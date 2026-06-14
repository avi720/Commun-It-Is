import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi import Depends, File, Form, UploadFile

from ..config import supabase
from ..auth import get_current_user_id, get_user_community_id
from .notifications import _send_community_push


router = APIRouter(prefix="/api", tags=["posts"])


def _extract_storage_path(image_url: Optional[str]) -> Optional[str]:
    """Given a public URL like
    `https://<proj>.supabase.co/storage/v1/object/public/images/post_images/<uuid>.jpg`
    return the object path inside the bucket (`post_images/<uuid>.jpg`).
    Returns None if the URL doesn't match the expected shape — caller treats
    that as "nothing to delete" rather than an error.
    """
    if not image_url:
        return None
    marker = "/storage/v1/object/public/images/"
    idx = image_url.find(marker)
    if idx == -1:
        return None
    return image_url[idx + len(marker):].split("?")[0]


@router.get("/posts")
def get_posts(
    author_id: Optional[str] = None,
    community_id: str = Depends(get_user_community_id),
):
    """List posts in the caller's community, optionally filtered to a single
    author. The community filter is server-controlled (from the auth token),
    so passing ?author_id of a user in another community returns nothing —
    we don't leak cross-community posts."""
    try:
        if not community_id:
            return []

        # Posts already carry community_id, so filter on it directly.
        # We can't use a PostgREST embed (users!inner) because posts.user_id
        # has its foreign key to auth.users, not public.users — so the
        # relationship isn't discoverable and the embed errors out.
        query = (
            supabase.table("posts")
            .select("*")
            .eq("community_id", community_id)
        )
        if author_id:
            query = query.eq("user_id", author_id)
        posts_res = query.order("created_at", desc=True).execute()
        posts = posts_res.data or []
        if not posts:
            return []

        # Attach author info (firstName/lastName/phone/city) via a second query.
        user_ids = list({p["user_id"] for p in posts if p.get("user_id")})
        users_map = {}
        if user_ids:
            users_res = (
                supabase.table("users")
                .select("id, firstName, lastName, phone, city")
                .in_("id", user_ids)
                .execute()
            )
            users_map = {u["id"]: u for u in (users_res.data or [])}

        for p in posts:
            p["users"] = users_map.get(p.get("user_id"))

        return posts

    except Exception as e:
        print(f"Error fetching posts: {e}")
        return []


@router.post("/posts")
async def create_post(
    content: str = Form(...),
    is_committee: bool = Form(False),
    image: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_user_id),
    community_id: str = Depends(get_user_community_id),
):
    """
    Create a new post. The request is sent as multipart/form-data so an
    optional image file can be uploaded alongside the text fields.
    user_id and community_id are derived from the auth token (never trusted
    from the client).
    """
    try:
        # Only committee members may publish official "committee" posts.
        # The client UI hides the toggle from residents, but that is a
        # client-side guard only — enforce it server-side as well.
        if is_committee:
            role_res = (
                supabase.table("users")
                .select("community_role")
                .eq("id", user_id)
                .execute()
            )
            is_actually_committee = (
                bool(role_res.data)
                and role_res.data[0].get("community_role") == "committee"
            )
            if not is_actually_committee:
                raise HTTPException(
                    status_code=403,
                    detail="Only committee members can publish committee posts",
                )

        image_url: Optional[str] = None

        # If an image was sent, upload to Supabase Storage
        if image is not None:
            file_content = await image.read()

            # Unique filename to avoid overwriting
            file_ext = (image.filename or "img").split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_ext}"
            file_path = f"post_images/{file_name}"

            # Upload to the 'images' bucket (must exist in Supabase)
            supabase.storage.from_("images").upload(
                file_path, file_content, {"content-type": image.content_type}
            )

            # Get public URL
            image_url = supabase.storage.from_("images").get_public_url(file_path).split("?")[0]

        # Save post in DB
        post_data = {
            "user_id": user_id,
            "content": content,
            "image_url": image_url,
            "community_id": community_id,
            "is_committee": is_committee,
        }

        response = supabase.table("posts").insert(post_data).execute()
        created = response.data[0]

        # Fan-out push to the community. Committee posts gate on
        # notify_committee_posts (typically higher-priority opt-in); regular
        # posts gate on notify_posts. Author is excluded.
        # Best-effort: a push failure must not fail the post creation.
        try:
            author_name = ""
            author_res = (
                supabase.table("users")
                .select("firstName, lastName")
                .eq("id", user_id)
                .execute()
            )
            if author_res.data:
                row = author_res.data[0]
                author_name = (
                    f"{row.get('firstName') or ''} {row.get('lastName') or ''}".strip()
                )

            title = "פוסט חדש מהוועד" if is_committee else "פוסט חדש בקהילה"
            body_preview = content[:80] + ("…" if len(content) > 80 else "")
            body = f"{author_name}: {body_preview}" if author_name else body_preview

            _send_community_push(
                community_id,
                title=title,
                body=body,
                gate_column=(
                    "notify_committee_posts" if is_committee else "notify_posts"
                ),
                exclude_user_id=user_id,
            )
        except Exception as push_err:  # pragma: no cover - best effort
            print(f"Push fan-out failed for post {created.get('id')}: {push_err}")

        return created

    except HTTPException:
        # Let intentional auth/validation errors (e.g. 403) propagate as-is.
        raise
    except Exception as e:
        print(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/posts/{post_id}")
async def update_post(
    post_id: str,
    content: str = Form(...),
    remove_image: bool = Form(False),
    image: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_user_id),
):
    """
    Edit a post. Only the post's author may edit. `is_committee` is NOT
    editable — flipping a regular post into a committee post post-creation
    would bypass the committee-only check enforced in create_post.

    A new `image` replaces the existing one (old object is removed from the
    `images` bucket). `remove_image=true` clears the image without uploading
    a new one.
    """
    try:
        post_res = (
            supabase.table("posts")
            .select("user_id, image_url")
            .eq("id", post_id)
            .execute()
        )
        if not post_res.data:
            raise HTTPException(status_code=404, detail="Post not found")
        post = post_res.data[0]
        if post["user_id"] != user_id:
            raise HTTPException(
                status_code=403, detail="You can only edit your own posts"
            )

        update_data: dict = {"content": content}
        old_image_path = _extract_storage_path(post.get("image_url"))

        new_image_url: Optional[str] = None
        if image is not None:
            file_content = await image.read()
            file_ext = (image.filename or "img").split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_ext}"
            file_path = f"post_images/{file_name}"
            supabase.storage.from_("images").upload(
                file_path, file_content, {"content-type": image.content_type}
            )
            new_image_url = (
                supabase.storage.from_("images").get_public_url(file_path).split("?")[0]
            )
            update_data["image_url"] = new_image_url
        elif remove_image:
            update_data["image_url"] = None

        response = (
            supabase.table("posts").update(update_data).eq("id", post_id).execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Post not found")

        # Best-effort cleanup of the replaced/removed image. Failure here does
        # not roll back the DB update — leftover objects are orphans, not a
        # data-integrity hazard. Skip if the new and old paths are the same
        # (defensive — shouldn't happen because new uploads use a fresh uuid).
        if old_image_path and (image is not None or remove_image):
            try:
                supabase.storage.from_("images").remove([old_image_path])
            except Exception as cleanup_err:  # pragma: no cover - best effort
                print(f"Failed to remove old image {old_image_path}: {cleanup_err}")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a post. Owner-only. Removes the image from Storage (best effort)."""
    try:
        post_res = (
            supabase.table("posts")
            .select("user_id, image_url")
            .eq("id", post_id)
            .execute()
        )
        if not post_res.data:
            raise HTTPException(status_code=404, detail="Post not found")
        post = post_res.data[0]
        if post["user_id"] != user_id:
            raise HTTPException(
                status_code=403, detail="You can only delete your own posts"
            )

        image_path = _extract_storage_path(post.get("image_url"))

        supabase.table("posts").delete().eq("id", post_id).execute()

        if image_path:
            try:
                supabase.storage.from_("images").remove([image_path])
            except Exception as cleanup_err:  # pragma: no cover - best effort
                print(f"Failed to remove image {image_path}: {cleanup_err}")

        return {"status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

