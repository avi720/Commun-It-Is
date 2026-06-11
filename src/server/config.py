import os
from dotenv import load_dotenv
from supabase import create_client, Client


# --- Supabase configuration ---
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
# T23: השם הקנוני הוא SUPABASE_SERVICE_KEY (בלי קידומת VITE_, כי זה סוד server-only).
# ה-fallback ל-VITE_SUPABASE_SERVICE_KEY נשאר זמנית כדי שה-deploy יעבוד גם לפני
# שמשתני הסביבה ב-Vercel עודכנו. ניתן להסיר את ה-fallback אחרי שהשם החדש מוגדר
# ב-Vercel והשם הישן הוסר.
# T23: canonical name is SUPABASE_SERVICE_KEY (no VITE_ prefix — this is a
# server-only secret). The VITE_SUPABASE_SERVICE_KEY fallback is temporary, to
# keep deploys working until Vercel ENV is updated. Safe to drop once the new
# name is set in Vercel and the old VITE_-prefixed one is removed.
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase keys are missing! Check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# --- Firebase configuration ---
firebase_creds_str = os.getenv("FIREBASE_CREDENTIALS")

if not firebase_creds_str:
    # Stop early if the credentials are missing – this is critical for the backend.
    raise RuntimeError(
        "CRITICAL ERROR: 'FIREBASE_CREDENTIALS' environment variable is missing."
    )

