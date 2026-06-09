"""
Tests for src/server/auth.py — specifically `get_committee_community_id`,
the dependency that gates every committee-only endpoint.

What we verify:
- 403 when the caller is not a committee member
- 400 when the user has no community assigned
- Happy path returns the community_id
"""
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException


def _configure_user_row(mock_supabase, row):
    """Set the next users-table lookup to return [row]."""
    chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    chain.execute.return_value = MagicMock(data=[row] if row else [])


def test_committee_happy_path_returns_community_id(mock_supabase):
    from src.server.auth import get_committee_community_id

    _configure_user_row(
        mock_supabase,
        {"community_id": "comm-123", "community_role": "committee"},
    )

    result = get_committee_community_id(user_id="user-1")

    assert result == "comm-123"


def test_non_committee_member_raises_403(mock_supabase):
    from src.server.auth import get_committee_community_id

    _configure_user_row(
        mock_supabase,
        {"community_id": "comm-123", "community_role": "resident"},
    )

    with pytest.raises(HTTPException) as exc:
        get_committee_community_id(user_id="user-1")

    assert exc.value.status_code == 403
    assert "committee" in exc.value.detail.lower()


def test_committee_with_no_community_raises_400(mock_supabase):
    from src.server.auth import get_committee_community_id

    _configure_user_row(
        mock_supabase,
        {"community_id": None, "community_role": "committee"},
    )

    with pytest.raises(HTTPException) as exc:
        get_committee_community_id(user_id="user-1")

    assert exc.value.status_code == 400


def test_user_not_found_raises_403(mock_supabase):
    from src.server.auth import get_committee_community_id

    _configure_user_row(mock_supabase, None)

    with pytest.raises(HTTPException) as exc:
        get_committee_community_id(user_id="ghost-user")

    assert exc.value.status_code == 403
