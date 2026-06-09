"""
Tests for the 10-minute grace window in src/server/routes/rides.py::get_rides.

A ride departing at T is shown until T + 10 minutes. Edge cases covered:
- ride 9m59s past departure → KEPT
- ride 10m01s past departure → EXCLUDED
- ride 30 minutes in the future → KEPT
- DST boundary (Israel: late October / late March transitions): the
  comparison is purely timezone-aware via datetime.timezone.utc and
  timedelta, so DST has no effect on the math. We verify that explicitly.

A fixed clock is injected by patching datetime.now in the rides module.
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch


def _ride(id, departure_iso, community_id="comm-1"):
    return {
        "id": id,
        "community_id": community_id,
        "departure_time": departure_iso,
    }


def _setup_rides(mock_supabase, rides):
    """Configure the supabase chain so .execute() returns the given rides."""
    chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    chain.execute.return_value = MagicMock(data=rides)


def test_ride_just_under_grace_window_is_kept(mock_supabase):
    from src.server.routes import rides as rides_mod

    now = datetime(2026, 6, 9, 12, 0, 0, tzinfo=timezone.utc)
    # יציאה 9 דקות ו-59 שניות לפני "עכשיו"
    departure = (now - timedelta(minutes=9, seconds=59)).isoformat()
    _setup_rides(mock_supabase, [_ride("r1", departure)])

    with patch.object(rides_mod, "datetime") as dt:
        dt.now.return_value = now
        # שמירת בנאי הרגיל כדי שהפונקציה תוכל לעשות fromisoformat
        dt.fromisoformat.side_effect = lambda s: datetime.fromisoformat(s)

        result = rides_mod.get_rides(community_id="comm-1")

    assert len(result) == 1
    assert result[0]["id"] == "r1"


def test_ride_just_over_grace_window_is_excluded(mock_supabase):
    from src.server.routes import rides as rides_mod

    now = datetime(2026, 6, 9, 12, 0, 0, tzinfo=timezone.utc)
    # יציאה 10 דקות ושנייה לפני "עכשיו" — מחוץ לחלון
    departure = (now - timedelta(minutes=10, seconds=1)).isoformat()
    _setup_rides(mock_supabase, [_ride("r1", departure)])

    with patch.object(rides_mod, "datetime") as dt:
        dt.now.return_value = now
        dt.fromisoformat.side_effect = lambda s: datetime.fromisoformat(s)

        result = rides_mod.get_rides(community_id="comm-1")

    assert result == []


def test_future_ride_is_kept(mock_supabase):
    from src.server.routes import rides as rides_mod

    now = datetime(2026, 6, 9, 12, 0, 0, tzinfo=timezone.utc)
    departure = (now + timedelta(minutes=30)).isoformat()
    _setup_rides(mock_supabase, [_ride("r1", departure)])

    with patch.object(rides_mod, "datetime") as dt:
        dt.now.return_value = now
        dt.fromisoformat.side_effect = lambda s: datetime.fromisoformat(s)

        result = rides_mod.get_rides(community_id="comm-1")

    assert len(result) == 1


def test_dst_boundary_does_not_affect_window(mock_supabase):
    """
    Israel switches off DST on the last Sunday of October. If the rides
    code ever started using naive datetimes, a ride straddling the DST
    boundary could be miscalculated. We assert it isn't.
    """
    from src.server.routes import rides as rides_mod

    # 2026-10-25 02:30 UTC = 04:30 IDT (לפני) או 05:30 IST (אחרי) — לא משנה, כי
    # אנחנו עובדים ב-UTC לכל אורך הדרך.
    now = datetime(2026, 10, 25, 2, 30, 0, tzinfo=timezone.utc)
    # יציאה 5 דקות לפני, אמורה להישמר
    departure = (now - timedelta(minutes=5)).isoformat()
    _setup_rides(mock_supabase, [_ride("r1", departure)])

    with patch.object(rides_mod, "datetime") as dt:
        dt.now.return_value = now
        dt.fromisoformat.side_effect = lambda s: datetime.fromisoformat(s)

        result = rides_mod.get_rides(community_id="comm-1")

    assert len(result) == 1
    assert result[0]["id"] == "r1"


def test_multiple_rides_sorted_by_departure(mock_supabase):
    from src.server.routes import rides as rides_mod

    now = datetime(2026, 6, 9, 12, 0, 0, tzinfo=timezone.utc)
    rides = [
        _ride("late", (now + timedelta(minutes=20)).isoformat()),
        _ride("soon", (now + timedelta(minutes=5)).isoformat()),
        _ride("mid", (now + timedelta(minutes=10)).isoformat()),
    ]
    _setup_rides(mock_supabase, rides)

    with patch.object(rides_mod, "datetime") as dt:
        dt.now.return_value = now
        dt.fromisoformat.side_effect = lambda s: datetime.fromisoformat(s)

        result = rides_mod.get_rides(community_id="comm-1")

    assert [r["id"] for r in result] == ["soon", "mid", "late"]
