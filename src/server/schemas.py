from typing import Optional

from fastapi import UploadFile, File
from pydantic import BaseModel


# --- Pydantic models (schemas) ---
#
# Note: authenticated fields such as ``user_id`` and ``community_id`` are NOT
# part of these request models. They are derived from the auth token and
# injected in the route handlers via FastAPI ``Depends`` (see auth.py). Putting
# ``Depends`` inside a Pydantic model is invalid and crashes on import.


class fcmTokenUpdate(BaseModel):
    """Update a user's FCM device token."""

    fcm_token: str


class UserSchema(BaseModel):
    email: str
    firstName: str
    lastName: str
    city: str
    address: str
    age: int
    phone: str

class RideSchema(BaseModel):
    driver_name: str
    location: str
    destination: str
    departure_time: str
    seats: int
    departure_minutes: Optional[int] = None


class PostSchema(BaseModel):
    content: str
    is_committee: bool
    image: Optional[UploadFile] = File(None)


class NotificationRequest(BaseModel):
    title: str
    body: str
    community_id: str
    sender_name: str


class UserUpdateSchema(BaseModel):
    """Schema for updating user profile information."""
    
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    age: Optional[int] = None
    visible_on_phonebook: Optional[bool] = None

