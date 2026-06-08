import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import firebase_init  # noqa: F401  - ensure Firebase initializes on startup
from .routes.notifications import router as notifications_router
from .routes.posts import router as posts_router
from .routes.rides import router as rides_router
from .routes.users import router as users_router


app = FastAPI()

# --- CORS configuration ---
# ALLOWED_ORIGINS is a comma-separated list set via env var.
# In Vercel production, set it to the public URL (e.g. "https://commun-it-is.vercel.app").
# When unset (local dev), default to the Vite dev server on port 5173.
# IMPORTANT: never use "*" here while allow_credentials is True — that would let
# any third-party site reach the API. The wildcard is blocked at the FastAPI layer.
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(users_router)
app.include_router(rides_router)
app.include_router(posts_router)
app.include_router(notifications_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)