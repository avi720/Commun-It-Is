from fastapi import APIRouter, HTTPException
from firebase_admin import messaging

from ..config import supabase
from ..schemas import NotificationRequest


router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/send")
async def send_community_notification(notif: NotificationRequest):
    try:
        # 1. Fetch all users in the community that have a token
        users_response = (
            supabase.table("users")
            .select("fcm_token")
            .eq("community_id", notif.community_id)
            .neq("fcm_token", "null")
            .execute()
        )

        tokens = [u["fcm_token"] for u in users_response.data if u.get("fcm_token")]

        if not tokens:
            return {"message": "No users with tokens found"}

        # 2. Send the message via Firebase
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=notif.title,
                body=notif.body,
            ),
            tokens=tokens,
        )
        response = messaging.send_multicast(message)

        # 3. Persist notification history
        supabase.table("notifications").insert(
            {
                "community_id": notif.community_id,
                "title": notif.title,
                "body": notif.body,
                "sender_name": notif.sender_name,
            }
        ).execute()

        return {"success": True, "sent_count": response.success_count}

    except Exception as e:
        print(f"Error sending notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

