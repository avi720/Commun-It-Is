import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi import Depends, File, Form, UploadFile

from ..config import supabase
from ..auth import get_current_user_id, get_user_community_id


router = APIRouter(prefix="/api", tags=["posts"])


@router.get("/posts")
def get_posts(community_id: str = Depends(get_user_community_id)):
    try:
        if not community_id:
            return []

        # Posts already carry community_id, so filter on it directly.
        # We can't use a PostgREST embed (users!inner) because posts.user_id
        # has its foreign key to auth.users, not public.users — so the
        # relationship isn't discoverable and the embed errors out.
        posts_res = (
            supabase.table("posts")
            .select("*")
            .eq("community_id", community_id)
            .order("created_at", desc=True)
            .execute()
        )
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
        return response.data[0]

    except HTTPException:
        # Let intentional auth/validation errors (e.g. 403) propagate as-is.
        raise
    except Exception as e:
        print(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

