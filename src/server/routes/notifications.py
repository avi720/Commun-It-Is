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
    """Send a push to every user in `community_id` whose `fcm_token` is set.

    `gate_column` — optional boolean column on `public.users` (e.g.
    `notify_ride_requests`); when set, only users whose value is `True`
    receive the push. Use `None` to bypass the gate (only the committee
    broadcast endpoint should consider this — it gates on
    `notify_committee_posts` anyway).

    `exclude_user_id` — drop this user from the recipient list. Used to
    avoid sending an author a push for their own action.

    Returns the success_count from Firebase; 0 if there were no recipients.
    """
    query = (
        supabase.table("users")
        .select("fcm_token")
        .eq("community_id", community_id)
        .neq("fcm_token", "null")
    )
    if gate_column:
        query = query.eq(gate_column, True)
    if exclude_user_id:
        query = query.neq("id", exclude_user_id)

    users_response = query.execute()
    tokens = [
        u["fcm_token"] for u in (users_response.data or []) if u.get("fcm_token")
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
    response = messaging.send_multicast(message)
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
