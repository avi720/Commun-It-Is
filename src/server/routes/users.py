from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends

from ..config import supabase
from ..schemas import fcmTokenUpdate, UserUpdateSchema
from ..auth import get_current_user_id


router = APIRouter(prefix="/api/users", tags=["users"])


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Delete a user. Only the authenticated user can delete their own profile —
    the user_id in the URL must match the id derived from the auth token.
    """
    try:
        if current_user_id != user_id:
            raise HTTPException(
                status_code=403, detail="You can only delete your own profile"
            )

        # Optional: if CASCADE is not configured, delete rides first.
        # supabase.table("rides").delete().eq("user_id", user_id).execute()

        # Delete the user itself
        response = supabase.table("users").delete().eq("id", user_id).execute()

        if len(response.data) > 0:
            print(f"User {user_id} deleted successfully")
            return {"status": "success", "message": "User deleted"}

        raise HTTPException(status_code=404, detail="User not found")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
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

