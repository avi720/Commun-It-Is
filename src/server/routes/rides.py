from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi import Depends

from ..config import supabase
from ..schemas import RideSchema
from ..auth import get_user_community_id

router = APIRouter(prefix="/api", tags=["rides"])


@router.get("/rides")
def get_rides(community_id: str = Depends(get_user_community_id)):
    try:
        if not community_id:
            return []

        # משיכה ישירה ויעילה של כל הטרמפים ששייכים לקהילה הספציפית
        response = (
            supabase.table("rides")
            .select("*")
            .eq("community_id", community_id)
            .execute()
        )
        all_rides = response.data

        # Filter rides by time window
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
def create_ride(ride: RideSchema):
    try:
        # 2. Prepare data for persistence
        ride_data = ride.dict()

        # Overwrite sensitive fields with verified info
        ride_data["user_id"] = ride.user_id
        ride_data["community_id"] = ride.community_id

        # Cleanup
        if "departure_minutes" in ride_data:
            del ride_data["departure_minutes"]

        # 3. Persist the ride
        response = supabase.table("rides").insert(ride_data).execute()

        if len(response.data) > 0:
            print(
                f"New ride created securely by {ride.user_id} in {ride.community_id}"
            )
            return response.data[0]

        raise HTTPException(status_code=500, detail="Failed to create ride")

    except Exception as e:
        print(f"Error: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

