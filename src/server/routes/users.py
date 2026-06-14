from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends

from ..config import supabase
from ..schemas import ChangePasswordSchema, fcmTokenUpdate, UserUpdateSchema
from ..auth import get_current_user_id


router = APIRouter(prefix="/api/users", tags=["users"])


def _list_user_storage_objects(bucket: str, prefix: str) -> list[str]:
    """List all object paths in `bucket` under `prefix/`. Returns full paths.
    Empty list on any error (best-effort cleanup, not a hard requirement)."""
    try:
        res = supabase.storage.from_(bucket).list(prefix, {"limit": 1000})
        return [f"{prefix}/{obj['name']}" for obj in (res or [])]
    except Exception:  # pragma: no cover - best effort
        return []


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Delete a user end-to-end. Only the authenticated user can delete their own
    profile (URL user_id must match token user_id).

    Flow:
      1. Collect the user's post-image paths from the DB while we still can.
      2. Delete from `auth.users` via admin API. The CASCADE FKs from
         `public.users.id` and `posts/rides.user_id` to `auth.users(id)` clean
         up every dependent row in one transaction.
      3. Best-effort Storage cleanup: avatar folder + all collected post-image
         objects. Failures are logged but do not abort the operation —
         leftover objects are orphans, not a data-integrity hazard.
    """
    try:
        if current_user_id != user_id:
            raise HTTPException(
                status_code=403, detail="You can only delete your own profile"
            )

        # 1. Collect post image paths BEFORE the cascade nukes the rows
        try:
            posts_res = (
                supabase.table("posts")
                .select("image_url")
                .eq("user_id", user_id)
                .execute()
            )
        except Exception as e:  # pragma: no cover - if this fails we just skip cleanup
            print(f"Could not list post images for cleanup: {e}")
            posts_res = type("o", (), {"data": []})()

        marker = "/storage/v1/object/public/images/"
        post_image_paths: list[str] = []
        for row in (posts_res.data or []):
            url = row.get("image_url")
            if not url:
                continue
            idx = url.find(marker)
            if idx != -1:
                post_image_paths.append(url[idx + len(marker):].split("?")[0])

        # 2. Delete the auth user — this CASCADEs into public.users, posts, rides
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as e:
            print(f"Failed to delete auth user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete account")

        # 3. Best-effort Storage cleanup
        avatar_paths = _list_user_storage_objects("avatars", user_id)
        if avatar_paths:
            try:
                supabase.storage.from_("avatars").remove(avatar_paths)
            except Exception as e:  # pragma: no cover - best effort
                print(f"Failed to remove avatar objects {avatar_paths}: {e}")

        if post_image_paths:
            try:
                supabase.storage.from_("images").remove(post_image_paths)
            except Exception as e:  # pragma: no cover - best effort
                print(f"Failed to remove post images: {e}")

        print(f"User {user_id} deleted successfully (cascade + storage cleanup)")
        return {"status": "success", "message": "User deleted"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/me/change-password")
async def change_password(
    payload: ChangePasswordSchema,
    user_id: str = Depends(get_current_user_id),
):
    """Verify the user's current password (by re-attempting sign_in), then
    set the new password via the auth admin API. The service-role key is
    required for `admin.update_user_by_id`; password verification still goes
    through the standard Supabase Auth path so a brute-force attempt is
    visible in the auth logs/rate-limits."""
    try:
        # Look up the user's email — we need it for sign_in verification.
        user_row = (
            supabase.table("users").select("email").eq("id", user_id).execute()
        )
        if not user_row.data or not user_row.data[0].get("email"):
            raise HTTPException(status_code=400, detail="User has no email on file")
        email = user_row.data[0]["email"]

        # 1. Verify the current password
        try:
            supabase.auth.sign_in_with_password(
                {"email": email, "password": payload.current_password}
            )
        except Exception:
            raise HTTPException(status_code=400, detail="הסיסמה הנוכחית שגויה")

        # 2. Set the new password via the admin API
        try:
            supabase.auth.admin.update_user_by_id(
                user_id, {"password": payload.new_password}
            )
        except Exception as e:
            print(f"Failed to update password for {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update password")

        return {"status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"change_password error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdateSchema,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Update user profile information.
    Only the authenticated user can update their own profile.
    """
    try:
        # Verify that the authenticated user is updating their own profile
        if current_user_id != user_id:
            raise HTTPException(
                status_code=403, detail="You can only update your own profile"
            )

        # Prepare update data (only include fields that were provided)
        update_data = user_data.dict(exclude_unset=True)

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Update the user in Supabase
        response = (
            supabase.table("users")
            .update(update_data)
            .eq("id", user_id)
            .execute()
        )

        if len(response.data) > 0:
            print(f"User {user_id} updated successfully")
            return response.data[0]

        raise HTTPException(status_code=404, detail="User not found")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/token")
async def update_user_token(
    token_data: fcmTokenUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """
    Register or update a user's FCM device token.
    """
    try:
        data = {
            "user_id": user_id,
            "fcm_token": token_data.fcm_token,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

        supabase.table("user_devices").upsert(
            data, on_conflict="user_id, fcm_token"
        ).execute()

        return {"message": "Device token registered securely"}

    except Exception as e:
        print(f"Error updating token: {e}")
        raise HTTPException(status_code=500, detail=str(e))

