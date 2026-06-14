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

    # rides / posts / notifications routers all import `supabase` at module
    # level via `from ..config`. Each is patched independently so a test that
    # only touches posts isn't broken by another router failing to import.
    for module_path in (
        "src.server.routes.rides",
        "src.server.routes.posts",
        "src.server.routes.notifications",
    ):
        try:
            __import__(module_path)
            monkeypatch.setattr(f"{module_path}.supabase", mock, raising=False)
        except ImportError:
            # אם הראוטר לא נטען (למשל deps נחסרות), הבדיקה הקשורה תכשל לחוד עם הודעה ברורה
            pass

    return mock
