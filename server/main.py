import sqlite3
import os

# מוצא את הנתיב של התיקייה שבה נמצא הקובץ main.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# מגדיר שה-DB תמיד יהיה בתיקייה הזו
DB_NAME = os.path.join(BASE_DIR, "database.db")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import List, Optional

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
    address: str
    age: int
    email: str      # חובה בשביל לוגין
    password: str   # חובה בשביל לוגין

class RideSchema(BaseModel):
    driver_name: str
    destination: str
    departure_time: str # אנחנו מצפים לתאריך מלא בפורמט ISO
    seats: int
    # שדות אופציונליים שלא נשמור ב-DB אבל אולי מגיעים מהקלאיינט
    departure_minutes: Optional[int] = None 

class LoginSchema(BaseModel):
    email: str
    password: str

# --- הגדרות מסד נתונים (SQLite) ---

DB_NAME = "database.db"

def init_db():
    """פונקציה שרצה בהתחלה ויוצרת את הטבלאות אם הן לא קיימות"""
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        
        # יצירת טבלת משתמשים
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                firstName TEXT,
                lastName TEXT,
                address TEXT,
                age INTEGER
            )
        ''')
        
        # יצירת טבלת נסיעות
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS rides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_name TEXT,
                destination TEXT,
                departure_time TEXT,
                seats INTEGER,
                created_date TEXT
            )
        ''')
        conn.commit()

# הפעלת יצירת הטבלאות בעליית השרת
init_db()

# --- נתיבים (Routes) ---

@app.post("/api/users")
async def create_user(user: UserSchema):
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (email, password, firstName, lastName, address, age)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user.email, user.password, user.firstName, user.lastName, user.address, user.age))
            conn.commit()
            
        print(f"New user registered: {user.firstName} {user.lastName}")
        return {"status": "success", "message": "User created successfully"}
        
    except sqlite3.IntegrityError:
        # זה קורה אם מנסים להירשם עם אימייל שכבר קיים
        raise HTTPException(status_code=400, detail="Email already exists")
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
async def login(credentials: LoginSchema):
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row # מאפשר לגשת לשדות לפי שם
        cursor = conn.cursor()
        
        # שליפת המשתמש לפי אימייל וסיסמה
        cursor.execute('SELECT * FROM users WHERE email = ? AND password = ?', 
                      (credentials.email, credentials.password))
        user = cursor.fetchone()
        
        if user:
            # המרה למילון כדי להחזיר ללקוח
            return dict(user)
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")

@app.get("/api/rides")
def get_rides():
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM rides')
        all_rides = [dict(row) for row in cursor.fetchall()]

    # סינון נסיעות ישנות (אותה לוגיקה כמו קודם, רק שהנתונים באו מה-DB)
    now_utc = datetime.now(timezone.utc)
    valid_rides = []
    
    for ride in all_rides:
        try:
            ride_time = datetime.fromisoformat(ride["departure_time"].replace("Z", "+00:00"))
            if now_utc < ride_time + timedelta(minutes=10):
                valid_rides.append(ride)
            else:
                # אופציונלי: אפשר למחוק מה-DB נסיעות ישנות כדי לא לנפח אותו
                pass 
        except Exception:
            valid_rides.append(ride)

    return sorted(valid_rides, key=lambda x: x['departure_time'])

@app.post("/api/rides")
def create_ride(ride: RideSchema):
    created_date = datetime.now(timezone.utc).isoformat()
    
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO rides (driver_name, destination, departure_time, seats, created_date)
            VALUES (?, ?, ?, ?, ?)
        ''', (ride.driver_name, ride.destination, ride.departure_time, ride.seats, created_date))
        conn.commit()
        ride_id = cursor.lastrowid # מקבלים את ה-ID החדש שנוצר
    
    print(f"New ride created: {ride.driver_name}")
    
    # מחזירים את האובייקט המלא עם ה-ID
    return {**ride.dict(), "id": ride_id, "created_date": created_date}

# נתיב עזר: הצגת כל המשתמשים (לפיתוח)
@app.get("/api/users")
def get_all_users():
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT id, firstName, lastName, email, address, age FROM users')
        return [dict(row) for row in cursor.fetchall()]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)