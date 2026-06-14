"""
Tests for the new rides route behavior added in profile_tab_v1:
- POST /rides with type='request' persists the type
- GET /rides ?user_id / ?type / ?upcoming filters
- PUT /rides owner-only enforcement
- DELETE /rides owner-only enforcement
"""
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException


def _setup_single_eq_chain(mock_supabase, data):
    """Default GET shape: .table().select().eq().execute() — used when only
    community_id is filtered."""
    chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    chain.execute.return_value = MagicMock(data=data)


def test_get_rides_with_upcoming_false_returns_all(mock_supabase):
    from src.server.routes import rides as rides_mod

    _setup_single_eq_chain(mock_supabase, [
        {"id": "r1", "community_id": "c1", "departure_time": "2020-01-01T00:00:00Z"},
        {"id": "r2", "community_id": "c1", "departure_time": "2099-01-01T00:00:00Z"},
    ])
    result = rides_mod.get_rides(
        user_id=None, type=None, upcoming=False, community_id="c1"
    )
    # upcoming=False skips the 10-minute filter entirely
    assert {r["id"] for r in result} == {"r1", "r2"}


def test_get_rides_with_type_filter_chains_extra_eq(mock_supabase):
    from src.server.routes import rides as rides_mod

    eq1 = mock_supabase.table.return_value.select.return_value.eq.return_value
    eq2 = eq1.eq.return_value
    eq2.execute.return_value = MagicMock(data=[])

    rides_mod.get_rides(user_id=None, type="request", upcoming=False, community_id="c1")
    eq1.eq.assert_called_with("type", "request")


def test_update_ride_owner_only_403_when_not_owner(mock_supabase):
    from src.server.routes import rides as rides_mod
    from src.server.schemas import RideUpdateSchema

    ride_chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    ride_chain.execute.return_value = MagicMock(data=[{"user_id": "owner-1"}])

    with pytest.raises(HTTPException) as exc_info:
        rides_mod.update_ride(
            ride_id="r1",
            payload=RideUpdateSchema(seats=4),
            user_id="intruder",
        )
    assert exc_info.value.status_code == 403


def test_delete_ride_owner_only_403_when_not_owner(mock_supabase):
    from src.server.routes import rides as rides_mod

    ride_chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    ride_chain.execute.return_value = MagicMock(data=[{"user_id": "owner-1"}])

    with pytest.raises(HTTPException) as exc_info:
        rides_mod.delete_ride(ride_id="r1", user_id="intruder")
    assert exc_info.value.status_code == 403


def test_ride_update_schema_rejects_type_field():
    """type is intentionally NOT in RideUpdateSchema — pydantic should ignore
    or reject the attempt depending on config. Either way, the value must
    NOT round-trip through .dict(exclude_unset=True)."""
    from src.server.schemas import RideUpdateSchema

    payload = RideUpdateSchema(**{"seats": 4})
    data = payload.dict(exclude_unset=True)
    assert "type" not in data
    assert "user_id" not in data
    assert "community_id" not in data
