import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from supabase import create_client, Client

# --- הגדרות Supabase ---
# וודא שהכנסת כאן את הפרטים האמיתיים שלך
SUPABASE_URL = "https://crhhgcisokrjehnyviya.supabase.co"
SUPABASE_KEY = "sb_publishable_kCCixn8jk0e9Z7gDmWMWbw__Q1jYH33"

# יצירת החיבור
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# --- הגדרות CORS ---
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- מודלים (Schemas) ---

class UserSchema(BaseModel):
    firstName: str
    lastName: str
    city: str
    address: str
    age: int
    email: str
    password: str
    phone: str

class UserUpdateSchema(BaseModel):
    firstName: str
    lastName: str
    city: str
    address: str
    phone: str
    # שים לב: אנחנו לא כוללים כאן אימייל, סיסמה או גיל כי הם לא בטופס העדכון

class RideSchema(BaseModel):
    user_id: str       # <--- השדה החדש: מזהה המשתמש (חובה!)
    driver_name: str
    location: str
    destination: str
    departure_time: str
    seats: int
    departure_minutes: Optional[int] = None 

class LoginSchema(BaseModel):
    email: str
    password: str

# --- נתיבים (Routes) ---

@app.post("/api/users")
async def create_user(user: UserSchema):
    try:
        user_data = user.dict()
        response = supabase.table("users").insert(user_data).execute()
        return {"status": "success", "message": "User created successfully"}
        
    except Exception as e:
        error_msg = str(e)
        if "23505" in error_msg or "duplicate key" in error_msg:
             raise HTTPException(status_code=400, detail="Email already exists")
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@app.put("/api/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdateSchema):
    try:
        # המרת הנתונים למילון
        update_payload = user_data.dict()
        
        # עדכון ב-Supabase לפי ID
        response = supabase.table("users").update(update_payload).eq("id", user_id).execute()
        
        if len(response.data) > 0:
            print(f"User {user_id} updated successfully")
            return response.data[0] # מחזיר את המשתמש המעודכן
        else:
             raise HTTPException(status_code=404, detail="User not found or update failed")
             
    except Exception as e:
        print(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/api/login")
async def login(credentials: LoginSchema):
    try:
        response = supabase.table("users").select("*")\
            .eq("email", credentials.email)\
            .eq("password", credentials.password)\
            .execute()
        
        if len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        

@app.get("/api/users/check/{email}")
def check_user_exists(email: str):
    try:
        response = supabase.table("users").select("id").eq("email", email).execute()
        if len(response.data) > 0:
            return {"status": "exists"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/rides")
def get_rides():
    try:
        # שליפת כל הנסיעות
        response = supabase.table("rides").select("*").execute()
        all_rides = response.data

        # סינון נסיעות ישנות
        now_utc = datetime.now(timezone.utc)
        valid_rides = []
        
        for ride in all_rides:
            try:
                ride_time = datetime.fromisoformat(ride["departure_time"].replace("Z", "+00:00"))
                if now_utc < ride_time + timedelta(minutes=10):
                    valid_rides.append(ride)
            except Exception:
                valid_rides.append(ride)

        return sorted(valid_rides, key=lambda x: x['departure_time'])
    
    except Exception as e:
        print(f"Error fetching rides: {e}")
        return []

@app.post("/api/rides")
def create_ride(ride: RideSchema):
    try:
        created_date = datetime.now(timezone.utc).isoformat()
        
        ride_data = ride.dict()
        # ניקוי שדות עזר
        if "departure_minutes" in ride_data:
            del ride_data["departure_minutes"]
            
        ride_data["created_date"] = created_date
        
        # השדה user_id כבר נמצא ב-ride_data כי הוספנו אותו ל-Schema
        
        response = supabase.table("rides").insert(ride_data).execute()
        
        if len(response.data) > 0:
            new_ride = response.data[0]
            print(f"New ride created by user {ride.user_id}")
            return new_ride
        
        raise HTTPException(status_code=500, detail="Failed to create ride")

    except Exception as e:
        print(f"Error creating ride: {e}")
        # בדיקה אם השגיאה היא בגלל user_id שלא קיים
        if "foreign key constraint" in str(e):
            raise HTTPException(status_code=400, detail="User ID does not exist")
        raise HTTPException(status_code=500, detail=str(e))

# נתיב עזר
@app.get("/api/users")
def get_all_users():
    response = supabase.table("users").select("*").execute()
    return response.data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)