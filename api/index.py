"""
Vercel Serverless entrypoint for the FastAPI backend.

Vercel detects the ASGI `app` object exported here and serves it.
All API routes are defined under the `/api` prefix inside src/server,
so requests to `/api/*` are routed here via vercel.json rewrites.
"""
import os
import sys

# Ensure the repository root is importable so `src.server` resolves.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.server.main import app  # noqa: E402,F401
