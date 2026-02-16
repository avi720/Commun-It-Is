import uuid
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..config import supabase


router = APIRouter(prefix="/api", tags=["posts"])


@router.get("/posts")
def get_posts(city: Optional[str] = None):
    try:
        if not city:
            return []

        # Smart fetch: request posts and related user info in a single query
        response = (
            supabase.table("posts")
            .select("*, users!inner(firstName, lastName, phone, city)")
            .eq("users.city", city)
            .order("created_at", desc=True)
            .execute()
        )

        return response.data

    except Exception as e:
        print(f"Error fetching posts: {e}")
        return []


@router.post("/posts")
async def create_post(
    user_id: str = Form(...),  # Form Data
    content: str = Form(...),  # Form Data
    is_committee: bool = Form(False),
    community_id: str = Form(None),
    image: UploadFile = File(None),
):
    try:
        image_url: Optional[str] = None

        # If an image was sent, upload to Supabase Storage
        if image:
            file_content = await image.read()

            # Unique filename to avoid overwriting
            file_ext = image.filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_ext}"
            file_path = f"post_images/{file_name}"

            # Upload to the 'images' bucket (must exist in Supabase)
            supabase.storage.from_("images").upload(
                file_path, file_content, {"content-type": image.content_type}
            )

            # Get public URL
            image_url = supabase.storage.from_("images").get_public_url(file_path)

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

    except Exception as e:
        print(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

