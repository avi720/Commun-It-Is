import os
import uuid
import firebase_admin
import json

from firebase_admin import credentials, messaging
from fastapi import UploadFile, File, Form
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client;

# --- הגדרות Supabase ---
# וודא שהכנסת כאן את הפרטים האמיתיים שלך
load_dotenv()
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_SERVICE_KEY")

# בדיקה שהמפתחות קיימים
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase keys are missing! Check your .env file.")

# יצירת החיבור
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# אתחול פיירבייס עם המפתח שהורדת
# שים לב: ב-Render נצטרך לטפל בזה אחרת בעתיד, אבל לפיתוח מקומי זה מצוין
firebase_creds_str = os.getenv("FIREBASE_CREDENTIALS")

if not firebase_creds_str:
    # עוצרים הכל אם אין מפתח!
    raise RuntimeError("CRITICAL ERROR: 'FIREBASE_CREDENTIALS' environment variable is missing.")

try:
    # המרת המחרוזת (JSON String) למילון פייתון
    cred_dict = json.loads(firebase_creds_str)
    cred = credentials.Certificate(cred_dict)
    
    # אתחול
    firebase_admin.initialize_app(cred)
    print("✅ Firebase initialized successfully from Environment Variable")
    
except json.JSONDecodeError:
    raise RuntimeError("CRITICAL ERROR: 'FIREBASE_CREDENTIALS' is not a valid JSON string.")
except Exception as e:
    raise RuntimeError(f"CRITICAL ERROR: Failed to initialize Firebase: {str(e)}")

app = FastAPI()

# --- הגדרות CORS ---
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- מודלים (Schemas) ---

class UserSchema(BaseModel):
    email: str
    firstName: str
    lastName: str
    city: str
    address: str
    age: int
    phone: str

class RideSchema(BaseModel):
    user_id: str       # <--- השדה החדש: מזהה המשתמש (חובה!)
    driver_name: str
    location: str
    destination: str
    departure_time: str
    seats: int
    departure_minutes: Optional[int] = None 

class PostSchema(BaseModel):
    user_id: str  # או int, תלוי איך זה אצלך ב-DB
    content: str
    image_url: Optional[str] = None

class NotificationRequest(BaseModel):
    title: str
    body: str
    community_id: str
    sender_name: str

# --- נתיבים (Routes) ---
@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str):
    try:
        # אופציונלי: אם לא הגדרת "CASCADE" ב-Supabase, נצטרך למחוק קודם את הנסיעות שלו
        # supabase.table("rides").delete().eq("user_id", user_id).execute()
        
        # מחיקת המשתמש עצמו
        response = supabase.table("users").delete().eq("id", user_id).execute()
        
        if len(response.data) > 0:
            print(f"User {user_id} deleted successfully")
            return {"status": "success", "message": "User deleted"}
        else:
             raise HTTPException(status_code=404, detail="User not found")
             
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        

@app.get("/api/rides")
def get_rides(city: str = None):
    try:
        if not city:
            return []

        # שלב 1: משיגים את כל המזהים (IDs) של משתמשים שגרים בעיר הזו
        # (אנחנו עושים את זה בשני שלבים כדי לא להסתבך עם Foreign Keys בטבלת הנסיעות הישנה)
        user_res = supabase.table("users").select("id").eq("city", city).execute()
        
        # יוצרים רשימה של IDs
        user_ids = [u['id'] for u in user_res.data]
        
        if not user_ids:
            return []

        # שלב 2: שולפים את הנסיעות שנוצרו על ידי המשתמשים האלה
        response = supabase.table("rides").select("*").in_("user_id", user_ids).execute()
        all_rides = response.data

        # --- מכאן ממשיך הסינון של הזמן שכבר כתבנו ---
        now_utc = datetime.now(timezone.utc)
        valid_rides = []
        
        for ride in all_rides:
            try:
                if not ride.get("departure_time"): continue

                time_str = ride["departure_time"].replace("Z", "+00:00")
                ride_time = datetime.fromisoformat(time_str)
                
                if ride_time.tzinfo is None:
                    ride_time = ride_time.replace(tzinfo=timezone.utc)
                
                # תיקון תצוגה
                ride["departure_time"] = ride_time.isoformat()

                if now_utc < ride_time + timedelta(minutes=10):
                    valid_rides.append(ride)
                    
            except Exception as e:
                print(f"Skipping ride: {e}")

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

@app.get("/api/posts")
def get_posts(city: str = None):
    try:
        if not city:
            return []
        # שליפה חכמה: אנחנו מבקשים את הפוסטים וגם את המידע על המשתמש (שם וטלפון)
        # הפקודה select("*, users(*)") עושה JOIN אוטומטי
        response = supabase.table("posts")\
            .select("*, users!inner(firstName, lastName, phone, city)")\
            .eq("users.city", city)\
            .order("created_at", desc=True)\
            .execute()
        
        return response.data
    except Exception as e:
        print(f"Error fetching posts: {e}")
        return []

@app.post("/api/posts")
async def create_post(
    user_id: str = Form(...),      # מקבלים כ-Form Data
    content: str = Form(...),      # מקבלים כ-Form Data
    is_committee: bool = Form(False), # מקבלים האם הפוסט רשמי
    community_id: str = Form(None), # מזהה קהילה
    image: UploadFile = File(None) # הקובץ עצמו (אופציונלי)
):
    try:
        image_url = None

        # אם נשלחה תמונה - נעלה אותה ל-Storage
        if image:
            # קריאת תוכן הקובץ
            file_content = await image.read()
            
            # יצירת שם ייחודי (כדי לא לדרוס תמונות עם אותו שם)
            file_ext = image.filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_ext}"
            file_path = f"post_images/{file_name}"
            
            # העלאה לדלי "images" שיצרנו
            # שים לב: זה דורש שיהיה דלי בשם 'images' ב-Supabase
            res = supabase.storage.from_("images").upload(file_path, file_content, {"content-type": image.content_type})
            
            # קבלת ה-URL הציבורי
            image_url = supabase.storage.from_("images").get_public_url(file_path)

        # שמירת הפוסט בטבלה
        post_data = {
            "user_id": user_id,
            "content": content,
            "image_url": image_url,
            "community_id": community_id, 
            "is_committee": is_committee
        }
        
        response = supabase.table("posts").insert(post_data).execute()
        return response.data[0]

    except Exception as e:
        print(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notifications/send")
async def send_community_notification(notif: NotificationRequest):
    try:
        # 1. שליפת כל המשתמשים בקהילה שיש להם טוקן
        users_response = supabase.table("users") \
            .select("fcm_token") \
            .eq("community_id", notif.community_id) \
            .neq("fcm_token", "null") \
            .execute()
        
        tokens = [u['fcm_token'] for u in users_response.data if u.get('fcm_token')]
        
        if not tokens:
            return {"message": "No users with tokens found"}

        # 2. שליחת ההודעה דרך Firebase
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=notif.title,
                body=notif.body,
            ),
            tokens=tokens,
        )
        response = messaging.send_multicast(message)

        # 3. שמירת ההודעה בהיסטוריה
        supabase.table("notifications").insert({
            "community_id": notif.community_id,
            "title": notif.title,
            "body": notif.body,
            "sender_name": notif.sender_name
        }).execute()

        return {"success": True, "sent_count": response.success_count}

    except Exception as e:
        print(f"Error sending notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# עדכון טוקן של משתמש
class TokenUpdate(BaseModel):
    fcm_token: str

@app.put("/api/users/{user_id}/token")
async def update_user_token(user_id: str, token_data: TokenUpdate):
    try:
        supabase.table("users").update({"fcm_token": token_data.fcm_token}).eq("id", user_id).execute()
        return {"message": "Token updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)