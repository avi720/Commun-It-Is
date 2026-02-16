from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import supabase


security = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> str:
    """
    Dependency that validates the Supabase auth token and returns the user ID.
    """
    token = credentials.credentials

    try:
        # Ask Supabase to validate the token and return the associated user
        user = supabase.auth.get_user(token)

        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        # This is the verified user ID
        return user.user.id

    except Exception as e:  # pragma: no cover - defensive logging
        print(f"Auth Error: {e}")
        raise HTTPException(
            status_code=401, detail="Invalid or expired token"
        ) from e

