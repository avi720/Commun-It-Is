from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from ..config import supabase
from ..schemas import NotificationRequest
from ..auth import get_committee_community_id, get_current_user_id


router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _send_community_push(
    community_id: str,
    *,
    title: str,
    body: str,
    gate_column: Optional[str] = None,
    exclude_user_id: Optional[str] = None,
) -> int:
    """Send a push to every user in `community_id` who has a registered device.

    Tokens live in `user_devices`; notification preferences and community
    membership live in `users`. We query users first to get eligible IDs,
    then pull their tokens from user_devices.

    `gate_column` — optional boolean column on `public.users` (e.g.
    `notify_ride_requests`); when set, only users whose value is `True`
    receive the push.

    `exclude_user_id` — drop this user from the recipient list.

    Returns the success_count from Firebase; 0 if there were no recipients.
    """
    users_query = (
        supabase.table("users")
        .select("id")
        .eq("community_id", community_id)
    )
    if gate_column:
        users_query = users_query.eq(gate_column, True)
    if exclude_user_id:
        users_query = users_query.neq("id", exclude_user_id)

    users_response = users_query.execute()
    user_ids = [u["id"] for u in (users_response.data or [])]
    if not user_ids:
        return 0

    devices_response = (
        supabase.table("user_devices")
        .select("fcm_token")
        .in_("user_id", user_ids)
        .execute()
    )
    tokens = [
        d["fcm_token"] for d in (devices_response.data or []) if d.get("fcm_token")
    ]
    if not tokens:
        return 0

    # Lazy-import firebase_admin so test environments without the wheel
    # (e.g. Windows-on-ARM Python 3.13, where grpcio doesn't build) can
    # still import this module without crashing. Production has the dep.
    from firebase_admin import messaging

    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=title, body=body),
        tokens=tokens,
    )
    # send_multicast() was removed in firebase-admin ≥ 7.
    # send_each_for_multicast sends one HTTP request per token — this is
    # what Firebase now recommends.
    response = messaging.send_each_for_multicast(message)
    return response.success_count


@router.post("/send")
async def send_community_notification(
    notif: NotificationRequest,
    community_id: str = Depends(get_committee_community_id),
    author_id: str = Depends(get_current_user_id),
):
    """
    Committee-only broadcast to the caller's community. Gated by
    `notify_committee_posts` per recipient, and the sender is excluded so
    they don't get their own push.
    """
    try:
        success_count = _send_community_push(
            community_id,
            title=notif.title,
            body=notif.body,
            gate_column="notify_committee_posts",
            exclude_user_id=author_id,
        )

        # Persist notification history. שם הטבלה הוא important_notifications
        # (זו גם הטבלה שממנה ה-frontend קורא את ההיסטוריה ב-notifications.getHistory).
        supabase.table("important_notifications").insert(
            {
                "community_id": community_id,
                "title": notif.title,
                "body": notif.body,
                "sender_name": notif.sender_name,
            }
        ).execute()

        return {"success": True, "sent_count": success_count}

    except Exception as e:
        print(f"Error sending notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))
