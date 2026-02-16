from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException

from ..config import supabase
from ..schemas import RideSchema


router = APIRouter(prefix="/api", tags=["rides"])


@router.get("/rides")
def get_rides(city: Optional[str] = None):
    try:
        if not city:
            return []

        # Step 1: fetch all user IDs that live in this city
        user_res = supabase.table("users").select("id").eq("city", city).execute()
        user_ids = [u["id"] for u in user_res.data]

        if not user_ids:
            return []

        # Step 2: fetch rides created by these users
        response = (
            supabase.table("rides")
            .select("*")
            .in_("user_id", user_ids)
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
        # 1. Fetch the real community from DB using the verified user ID
        user_res = (
            supabase.table("users")
            .select("community_id")
            .eq("id", ride.user_id)
            .execute()
        )

        if not user_res.data or not user_res.data[0]["community_id"]:
            raise HTTPException(status_code=400, detail="User has no community assigned")

        real_community_id = user_res.data[0]["community_id"]

        # 2. Prepare data for persistence
        ride_data = ride.dict()

        # Overwrite sensitive fields with verified info
        ride_data["user_id"] = ride.user_id
        ride_data["community_id"] = real_community_id

        # Cleanup
        if "departure_minutes" in ride_data:
            del ride_data["departure_minutes"]

        # 3. Persist the ride
        response = supabase.table("rides").insert(ride_data).execute()

        if len(response.data) > 0:
            print(
                f"New ride created securely by {ride.user_id} in {real_community_id}"
            )
            return response.data[0]

        raise HTTPException(status_code=500, detail="Failed to create ride")

    except Exception as e:
        print(f"Error: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

