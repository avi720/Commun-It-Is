"""PUT /api/communities/active must prove membership before it copies a role.

The client used to be able to insert user_communities(self, target, 'committee')
and then call this endpoint, which trusted that row. RLS now rejects the
insert. These tests lock the server check: no membership means no update, and
the role written to users.community_role is the membership role.
"""
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from src.server.routes.communities import (
    SwitchActiveSchema,
    get_active_invite_code,
    switch_active,
)


def _membership_rows(mock_supabase, rows):
    chain = mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value
    chain.execute.return_value = MagicMock(data=rows)


def test_switch_rejects_a_community_the_caller_has_not_joined(mock_supabase):
    _membership_rows(mock_supabase, [])

    with pytest.raises(HTTPException) as exc:
        switch_active(SwitchActiveSchema(community_id="comm-b"), user_id="user-1")

    assert exc.value.status_code == 403
    mock_supabase.table.return_value.update.assert_not_called()


def test_switch_copies_the_membership_role(mock_supabase):
    _membership_rows(mock_supabase, [{"role": "resident"}])
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[{}])
    )

    result = switch_active(SwitchActiveSchema(community_id="comm-b"), user_id="user-1")

    assert result == {"status": "switched", "community_id": "comm-b", "role": "resident"}
    mock_supabase.table.return_value.update.assert_called_with({
        "community_id": "comm-b",
        "community_role": "resident",
    })


def test_switch_rejects_an_unexpected_membership_role(mock_supabase):
    _membership_rows(mock_supabase, [{"role": "owner"}])

    with pytest.raises(HTTPException) as exc:
        switch_active(SwitchActiveSchema(community_id="comm-b"), user_id="user-1")

    assert exc.value.status_code == 403
    mock_supabase.table.return_value.update.assert_not_called()


def test_invite_code_comes_from_the_committee_community(mock_supabase):
    chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    chain.execute.return_value = MagicMock(data=[{"invite_code": "CODE-A"}])

    assert get_active_invite_code(community_id="comm-a") == {"invite_code": "CODE-A"}
    mock_supabase.table.assert_called_with("communities")
    mock_supabase.table.return_value.select.assert_called_with("invite_code")


def test_invite_code_404_when_the_community_row_is_missing(mock_supabase):
    chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    chain.execute.return_value = MagicMock(data=[])

    with pytest.raises(HTTPException) as exc:
        get_active_invite_code(community_id="missing")

    assert exc.value.status_code == 404
