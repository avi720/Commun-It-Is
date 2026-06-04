from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends

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

def get_user_community_id(user_id: str = Depends(get_current_user_id)) -> str:
    """
    Dependency that fetches the community ID for a given user ID.
    """
    try:
        user_res = (
            supabase.table("users")
            .select("community_id")
            .eq("id", user_id)
            .execute()
        )

        if not user_res.data or not user_res.data[0]["community_id"]:
            raise HTTPException(status_code=400, detail="User has no community assigned")

        return user_res.data[0]["community_id"]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user community ID: {e}")
        raise HTTPException(status_code=400, detail=str(e))


def get_committee_community_id(user_id: str = Depends(get_current_user_id)) -> str:
    """
    Dependency for committee-only actions.

    Returns the caller's community_id, but ONLY if they are a committee member
    of that community. Otherwise raises 403. The community is always derived
    from the auth token (never trusted from the request body), so a committee
    member can only act on their own community.
    """
    try:
        user_res = (
            supabase.table("users")
            .select("community_id, community_role")
            .eq("id", user_id)
            .execute()
        )

        if not user_res.data:
            raise HTTPException(status_code=403, detail="User not found")

        row = user_res.data[0]

        if row.get("community_role") != "committee":
            raise HTTPException(
                status_code=403,
                detail="Only committee members can perform this action",
            )

        if not row.get("community_id"):
            raise HTTPException(status_code=400, detail="User has no community assigned")

        return row["community_id"]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying committee role: {e}")
        raise HTTPException(status_code=400, detail=str(e))