from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from ..config import supabase
from ..auth import get_current_user_id


router = APIRouter(prefix="/api/communities", tags=["communities"])


class JoinByCodeSchema(BaseModel):
    invite_code: str


class SwitchActiveSchema(BaseModel):
    community_id: str


@router.get("/me")
def list_my_communities(user_id: str = Depends(get_current_user_id)):
    """List all communities the caller is a member of, plus which one is
    currently active. The active community is taken from `users.community_id`
    (denormalized so the existing community filters keep working unchanged)."""
    try:
        # Memberships with role per community
        memberships_res = (
            supabase.table("user_communities")
            .select("community_id, role, joined_at")
            .eq("user_id", user_id)
            .execute()
        )
        memberships = memberships_res.data or []
        if not memberships:
            return {"communities": [], "active_community_id": None}

        community_ids = [m["community_id"] for m in memberships]
        comms_res = (
            supabase.table("communities")
            .select("id, name, city_symbol, logo_url, invite_code")
            .in_("id", community_ids)
            .execute()
        )
        comm_map = {c["id"]: c for c in (comms_res.data or [])}

        # Active community pointer
        active_res = (
            supabase.table("users")
            .select("community_id")
            .eq("id", user_id)
            .execute()
        )
        active_id = (
            active_res.data[0]["community_id"] if active_res.data else None
        )

        out = []
        for m in memberships:
            comm = comm_map.get(m["community_id"])
            if not comm:
                continue
            out.append({
                "id": comm["id"],
                "name": comm["name"],
                "city_symbol": comm.get("city_symbol"),
                "logo_url": comm.get("logo_url"),
                "invite_code": comm.get("invite_code"),
                "role": m["role"],
                "joined_at": m["joined_at"],
                "is_active": comm["id"] == active_id,
            })
        return {"communities": out, "active_community_id": active_id}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error listing user communities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/join")
def join_by_code(
    payload: JoinByCodeSchema,
    user_id: str = Depends(get_current_user_id),
):
    """Join a community by invite code. The code uniquely identifies the
    community. If the caller is already a member, the request is idempotent
    (returns the existing membership without error). After joining, the new
    community becomes the user's active community."""
    code = (payload.invite_code or "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Missing invite code")

    try:
        comm_res = (
            supabase.table("communities")
            .select("id, name, city_symbol, logo_url, invite_code")
            .eq("invite_code", code)
            .execute()
        )
        if not comm_res.data:
            raise HTTPException(status_code=404, detail="קוד הזמנה לא תקין")
        community = comm_res.data[0]
        community_id = community["id"]

        # Already a member?
        existing = (
            supabase.table("user_communities")
            .select("role")
            .eq("user_id", user_id)
            .eq("community_id", community_id)
            .execute()
        )

        if existing.data:
            role = existing.data[0]["role"]
        else:
            # New membership — default role 'resident'
            supabase.table("user_communities").insert({
                "user_id": user_id,
                "community_id": community_id,
                "role": "resident",
            }).execute()
            role = "resident"

        # Make the joined community the active one
        supabase.table("users").update({
            "community_id": community_id,
            "community_role": role,
        }).eq("id", user_id).execute()

        return {
            "status": "joined",
            "community": {**community, "role": role, "is_active": True},
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error joining community: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/active")
def switch_active(
    payload: SwitchActiveSchema,
    user_id: str = Depends(get_current_user_id),
):
    """Switch the caller's ACTIVE community to one of their existing
    memberships. Updates `users.community_id` and copies the per-membership
    role onto `users.community_role` so committee checks for the new active
    community work immediately."""
    try:
        membership = (
            supabase.table("user_communities")
            .select("role")
            .eq("user_id", user_id)
            .eq("community_id", payload.community_id)
            .execute()
        )
        if not membership.data:
            raise HTTPException(
                status_code=403,
                detail="You are not a member of that community",
            )

        role = membership.data[0]["role"]
        supabase.table("users").update({
            "community_id": payload.community_id,
            "community_role": role,
        }).eq("id", user_id).execute()

        return {"status": "switched", "community_id": payload.community_id, "role": role}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error switching active community: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/me/{community_id}")
def leave_community(
    community_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Leave a community. Blocked if it's the user's only membership — a user
    must always belong to at least one community for the existing
    community-scoped queries to keep working. If the user is leaving their
    active community, the active pointer is moved to one of the remaining
    memberships."""
    try:
        all_memberships = (
            supabase.table("user_communities")
            .select("community_id, role")
            .eq("user_id", user_id)
            .execute()
        )
        memberships = all_memberships.data or []

        if len(memberships) <= 1:
            raise HTTPException(
                status_code=400,
                detail="לא ניתן לעזוב את הקהילה היחידה שלך",
            )

        # Delete the row
        supabase.table("user_communities").delete().eq("user_id", user_id).eq(
            "community_id", community_id
        ).execute()

        # If the active pointer was the one we just left, repoint it.
        user_res = (
            supabase.table("users")
            .select("community_id")
            .eq("id", user_id)
            .execute()
        )
        active = user_res.data[0]["community_id"] if user_res.data else None
        if active == community_id:
            remaining = [m for m in memberships if m["community_id"] != community_id]
            if remaining:
                target = remaining[0]
                supabase.table("users").update({
                    "community_id": target["community_id"],
                    "community_role": target["role"],
                }).eq("id", user_id).execute()

        return {"status": "left"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error leaving community: {e}")
        raise HTTPException(status_code=500, detail=str(e))
