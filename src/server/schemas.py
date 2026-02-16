from typing import Optional

from fastapi import Depends
from pydantic import BaseModel

from .auth import get_current_user_id


# --- Pydantic models (schemas) ---


class fcmTokenUpdate(BaseModel):
    """Update a user's FCM device token."""

    fcm_token: str
    user_id: str = Depends(get_current_user_id)


class UserSchema(BaseModel):
    email: str
    firstName: str
    lastName: str
    city: str
    address: str
    age: int
    phone: str


class RideSchema(BaseModel):
    user_id: str = Depends(get_current_user_id)
    community_id: str
    driver_name: str
    location: str
    destination: str
    departure_time: str
    seats: int
    departure_minutes: Optional[int] = None


class PostSchema(BaseModel):
    user_id: str = Depends(get_current_user_id)
    community_id: str
    content: str
    image_url: Optional[str] = None


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

