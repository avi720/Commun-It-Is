from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from fastapi import Depends

from ..config import supabase
from ..schemas import RideSchema, RideUpdateSchema
from ..auth import get_current_user_id, get_user_community_id
from .notifications import _send_community_push

router = APIRouter(prefix="/api", tags=["rides"])


@router.get("/rides")
def get_rides(
    user_id: Optional[str] = None,
    type: Optional[Literal["offer", "request"]] = None,
    upcoming: bool = True,
    community_id: str = Depends(get_user_community_id),
):
    """List rides in the caller's community.

    Optional filters:
      - user_id: only rides posted by this user
      - type: 'offer' or 'request' (defaults to both)
      - upcoming: when True (default), keep only rides departing within the
        last 10 minutes or in the future (matches the existing live-board
        behavior). Set to False to retrieve the user's full ride history —
        used by the Profile tab.
    """
    try:
        if not community_id:
            return []

        query = (
            supabase.table("rides")
            .select("*")
            .eq("community_id", community_id)
        )
        if user_id:
            query = query.eq("user_id", user_id)
        if type:
            query = query.eq("type", type)

        response = query.execute()
        all_rides = response.data or []

        if not upcoming:
            # Return everything matching the other filters; sort newest-first
            # by departure_time so a profile view shows recent first.
            return sorted(
                all_rides,
                key=lambda x: x.get("departure_time") or "",
                reverse=True,
            )

        # Filter rides by time window (existing live-board behavior)
        now_utc = datetime.now(timezone.utc)
        valid_rides = []

        for ride in all_rides:
            try:
                if not ride.get("departure_time"):
                    continue

                time_str = ride["departure_time"].replace("Z", "+00:00")
                ride_time = datetime.fromisoformat(time_str)

                if ride_time.tzinfo is None:
                    ride_time = ride_time.replace(tzinfo=timezone.utc)

                # Normalize format
                ride["departure_time"] = ride_time.isoformat()

                if now_utc < ride_time + timedelta(minutes=10):
                    valid_rides.append(ride)

            except Exception as e:
                print(f"Skipping ride: {e}")

        return sorted(valid_rides, key=lambda x: x["departure_time"])

    except Exception as e:
        print(f"Error fetching rides: {e}")
        return []


@router.post("/rides")
def create_ride(
    ride: RideSchema,
    user_id: str = Depends(get_current_user_id),
    community_id: str = Depends(get_user_community_id),
):
    try:
        # 2. Prepare data for persistence
        ride_data = ride.dict()

        # Overwrite sensitive fields with verified info from the auth token
        ride_data["user_id"] = user_id
        ride_data["community_id"] = community_id

        # Cleanup
        if "departure_minutes" in ride_data:
            del ride_data["departure_minutes"]

        # 3. Persist the ride
        response = supabase.table("rides").insert(ride_data).execute()

        if len(response.data) > 0:
            created = response.data[0]
            print(f"New ride created securely by {user_id} in {community_id}")

            # Fan-out push to the community. Gate on the matching toggle so
            # users who muted that channel don't get pinged; exclude the
            # author so they don't get a push for their own action.
            try:
                ride_type = created.get("type") or ride_data.get("type") or "offer"
                if ride_type == "request":
                    title = "מישהו מחפש טרמפ"
                    body = (
                        f"{ride_data.get('driver_name','')} מחפש טרמפ "
                        f"מ-{ride_data.get('location','')} ל-{ride_data.get('destination','')}"
                    )
                    gate = "notify_ride_requests"
                else:
                    title = "טרמפ חדש בקהילה"
                    body = (
                        f"{ride_data.get('driver_name','')} מציע טרמפ "
                        f"מ-{ride_data.get('location','')} ל-{ride_data.get('destination','')}"
                    )
                    gate = "notify_ride_offers"

                _send_community_push(
                    community_id,
                    title=title,
                    body=body,
                    gate_column=gate,
                    exclude_user_id=user_id,
                )
            except Exception as push_err:  # pragma: no cover - best effort
                print(f"Push fan-out failed for ride {created.get('id')}: {push_err}")

            return created

        raise HTTPException(status_code=500, detail="Failed to create ride")

    except Exception as e:
        print(f"Error: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/rides/{ride_id}")
def update_ride(
    ride_id: str,
    payload: RideUpdateSchema,
    user_id: str = Depends(get_current_user_id),
):
    """Edit a ride. Owner-only. Cannot mutate user_id/community_id/type
    (RideUpdateSchema intentionally omits them)."""
    try:
        ride_res = (
            supabase.table("rides").select("user_id").eq("id", ride_id).execute()
        )
        if not ride_res.data:
            raise HTTPException(status_code=404, detail="Ride not found")
        if ride_res.data[0]["user_id"] != user_id:
            raise HTTPException(
                status_code=403, detail="You can only edit your own rides"
            )

        update_data = payload.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        response = (
            supabase.table("rides").update(update_data).eq("id", ride_id).execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Ride not found")
        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating ride: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/rides/{ride_id}")
def delete_ride(
    ride_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a ride. Owner-only."""
    try:
        ride_res = (
            supabase.table("rides").select("user_id").eq("id", ride_id).execute()
        )
        if not ride_res.data:
            raise HTTPException(status_code=404, detail="Ride not found")
        if ride_res.data[0]["user_id"] != user_id:
            raise HTTPException(
                status_code=403, detail="You can only delete your own rides"
            )

        supabase.table("rides").delete().eq("id", ride_id).execute()
        return {"status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting ride: {e}")
        raise HTTPException(status_code=500, detail=str(e))
