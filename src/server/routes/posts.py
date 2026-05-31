import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi import Depends

from ..schemas import PostSchema
from ..config import supabase
from ..auth import get_current_user_id, get_user_community_id


router = APIRouter(prefix="/api", tags=["posts"])


@router.get("/posts")
def get_posts(community_id: str = Depends(get_user_community_id)):
    try:
        if not community_id:
            return []

        # Smart fetch: request posts and related user info in a single query
        response = (
            supabase.table("posts")
            .select("*, users!inner(firstName, lastName, phone, city)")
            .eq("users.community_id", community_id)
            .order("created_at", desc=True)
            .execute()
        )

        return response.data

    except Exception as e:
        print(f"Error fetching posts: {e}")
        return []


@router.post("/posts")
async def create_post(
    post: PostSchema,
    user_id: str = Depends(get_current_user_id),
    community_id: str = Depends(get_user_community_id),
):
    try:
        # 2. Prepare data for persistence
        post_data = post.dict()

        # Overwrite sensitive fields with verified info from the auth token
        post_data["user_id"] = user_id
        post_data["community_id"] = community_id

        image_url: Optional[str] = None

        # If an image was sent, upload to Supabase Storage
        if post_data.get("image"):
            file_content = await post_data["image"].read()

            # Unique filename to avoid overwriting
            file_ext = post_data["image"].filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_ext}"
            file_path = f"post_images/{file_name}"

            # Upload to the 'images' bucket (must exist in Supabase)
            supabase.storage.from_("images").upload(
                file_path, file_content, {"content-type": post_data["image"].content_type}
            )

            # Get public URL
            image_url = supabase.storage.from_("images").get_public_url(file_path).split("?")[0]

        # Save post in DB
        post_data = {
            "user_id": post_data["user_id"],
            "content": post_data["content"],
            "image_url": image_url,
            "community_id": post_data["community_id"],
            "is_committee": post_data["is_committee"],
        }

        response = supabase.table("posts").insert(post_data).execute()
        return response.data[0]

    except Exception as e:
        print(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

