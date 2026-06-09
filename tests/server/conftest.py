"""
Shared pytest fixtures for backend tests.

The FastAPI dependencies (`get_current_user_id`, `get_user_community_id`,
`get_committee_community_id`) hit Supabase directly. The tests mock that
client so they are deterministic and run with no external dependency.
"""
from unittest.mock import MagicMock

import pytest


@pytest.fixture
def mock_supabase(monkeypatch):
    """
    Replace `supabase` in src.server.config / src.server.auth / routes with a
    MagicMock. Tests configure the mock per-case to simulate Supabase responses.
    """
    mock = MagicMock()

    monkeypatch.setattr("src.server.config.supabase", mock, raising=False)
    monkeypatch.setattr("src.server.auth.supabase", mock, raising=False)

    # rides router imports `supabase` at module level via `from ..config`
    try:
        import src.server.routes.rides as rides_mod  # noqa: F401
        monkeypatch.setattr("src.server.routes.rides.supabase", mock, raising=False)
    except ImportError:
        # אם הראוטר לא נטען (למשל deps נחסרות), הבדיקה הקשורה תכשל לחוד עם הודעה ברורה
        pass

    return mock
