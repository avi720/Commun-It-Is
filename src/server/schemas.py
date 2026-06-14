from typing import Literal, Optional

from fastapi import UploadFile, File
from pydantic import BaseModel, Field


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
    type: Literal["offer", "request"] = "offer"
    departure_minutes: Optional[int] = None


class RideUpdateSchema(BaseModel):
    """Fields editable on an existing ride. user_id, community_id and type are
    intentionally NOT editable — flipping `type` post-creation would let an
    'offer' silently become a 'request' (or vice-versa) without re-notifying
    the community."""

    driver_name: Optional[str] = None
    location: Optional[str] = None
    destination: Optional[str] = None
    departure_time: Optional[str] = None
    seats: Optional[int] = None


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

    # Profile additions (Phase 1)
    bio: Optional[str] = Field(default=None, max_length=200)
    avatar_url: Optional[str] = None
    address_visibility: Optional[Literal["everyone", "committee", "nobody"]] = None

    # Per-channel push notification toggles
    notify_posts: Optional[bool] = None
    notify_committee_posts: Optional[bool] = None
    notify_ride_offers: Optional[bool] = None
    notify_ride_requests: Optional[bool] = None

