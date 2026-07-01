"""
Tests for _send_community_push helper in routes/notifications.py.

Critical invariants:
- gate_column, when set, adds an .eq(column, True) filter on the users query
- exclude_user_id, when set, adds a .neq('id', user_id) filter on the users
  query (so the author never gets a push for their own action)
- both can be combined
- tokens are fetched from user_devices, not from users
"""
from unittest.mock import MagicMock


def _build_query_chain(mock_supabase, *, user_ids=None, tokens=None):
    """Configure mock_supabase for the two-table query pattern:
    1. supabase.table("users").select("id").eq(…)… → user IDs
    2. supabase.table("user_devices").select("fcm_token").in_(…) → tokens

    Returns the users_chain mock for assertion inspection.
    """
    if user_ids is None:
        user_ids = []
    if tokens is None:
        tokens = []

    users_chain = MagicMock(name="users_chain")
    users_chain.select.return_value = users_chain
    users_chain.eq.return_value = users_chain
    users_chain.neq.return_value = users_chain
    users_result = MagicMock()
    users_result.data = [{"id": uid} for uid in user_ids]
    users_chain.execute.return_value = users_result

    devices_chain = MagicMock(name="devices_chain")
    devices_chain.select.return_value = devices_chain
    devices_chain.in_.return_value = devices_chain
    devices_result = MagicMock()
    devices_result.data = [{"fcm_token": t} for t in tokens]
    devices_chain.execute.return_value = devices_result

    def table_router(name):
        if name == "users":
            return users_chain
        if name == "user_devices":
            return devices_chain
        return MagicMock()

    mock_supabase.table.side_effect = table_router

    return users_chain


def test_no_recipients_returns_zero_without_calling_firebase(mock_supabase):
    from src.server.routes import notifications as notif_mod

    _build_query_chain(mock_supabase, user_ids=[], tokens=[])
    result = notif_mod._send_community_push(
        "c1", title="t", body="b",
    )
    assert result == 0


def test_gate_column_adds_eq_filter(mock_supabase):
    from src.server.routes import notifications as notif_mod

    users_chain = _build_query_chain(mock_supabase, user_ids=[], tokens=[])
    notif_mod._send_community_push(
        "c1", title="t", body="b", gate_column="notify_ride_offers",
    )
    eq_calls = [c.args for c in users_chain.eq.call_args_list]
    assert ("notify_ride_offers", True) in eq_calls


def test_exclude_user_id_adds_neq_filter(mock_supabase):
    from src.server.routes import notifications as notif_mod

    users_chain = _build_query_chain(mock_supabase, user_ids=[], tokens=[])
    notif_mod._send_community_push(
        "c1", title="t", body="b", exclude_user_id="self-uid",
    )
    neq_calls = [c.args for c in users_chain.neq.call_args_list]
    assert ("id", "self-uid") in neq_calls


def test_gate_and_exclude_can_combine(mock_supabase):
    from src.server.routes import notifications as notif_mod

    users_chain = _build_query_chain(mock_supabase, user_ids=[], tokens=[])
    notif_mod._send_community_push(
        "c1", title="t", body="b",
        gate_column="notify_ride_requests",
        exclude_user_id="self-uid",
    )
    eq_calls = [c.args for c in users_chain.eq.call_args_list]
    neq_calls = [c.args for c in users_chain.neq.call_args_list]
    assert ("notify_ride_requests", True) in eq_calls
    assert ("id", "self-uid") in neq_calls


def test_with_tokens_calls_firebase_messaging(mock_supabase):
    """When recipients exist, firebase_admin.messaging is imported and
    send_each_for_multicast is invoked."""
    from src.server.routes import notifications as notif_mod
    import sys

    _build_query_chain(
        mock_supabase, user_ids=["u1", "u2"], tokens=["tok-1", "tok-2"],
    )

    fake_messaging = MagicMock()
    fake_messaging.send_each_for_multicast.return_value = MagicMock(success_count=2)
    fake_module = MagicMock()
    fake_module.messaging = fake_messaging
    sys.modules["firebase_admin"] = fake_module

    try:
        result = notif_mod._send_community_push(
            "c1", title="hello", body="world",
        )
    finally:
        sys.modules.pop("firebase_admin", None)

    assert result == 2
    fake_messaging.send_each_for_multicast.assert_called_once()
