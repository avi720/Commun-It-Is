import os
from dotenv import load_dotenv
from supabase import create_client, Client


# --- Supabase configuration ---
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_SERVICE_KEY")

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

