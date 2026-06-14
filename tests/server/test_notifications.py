"""
Tests for _send_community_push helper in routes/notifications.py.

Critical invariants:
- gate_column, when set, adds an .eq(column, True) filter
- exclude_user_id, when set, adds a .neq('id', user_id) filter (so the
  author never gets a push for their own action)
- both can be combined
"""
from unittest.mock import MagicMock, patch


def _build_query_chain(mock_supabase, tokens):
    """Configure the supabase chain so the helper ends with a query that
    returns the given list of {fcm_token} dicts."""
    table = mock_supabase.table.return_value
    select = table.select.return_value
    eq1 = select.eq.return_value         # community_id
    neq1 = eq1.neq.return_value          # fcm_token != null
    # Return the same neq result for further .eq()/.neq() chains so callers
    # that don't add gate_column / exclude_user_id still work.
    eq2 = neq1.eq.return_value
    neq2 = neq1.neq.return_value
    eq2_neq = eq2.neq.return_value
    final = MagicMock()
    final.data = [{"fcm_token": t} for t in tokens]
    for node in (neq1, eq2, neq2, eq2_neq):
        node.execute.return_value = final
    return select


def test_no_recipients_returns_zero_without_calling_firebase(mock_supabase):
    from src.server.routes import notifications as notif_mod

    _build_query_chain(mock_supabase, tokens=[])
    # firebase_admin is imported lazily; if we got tokens=[] the import path
    # is never reached, so no patch needed.
    result = notif_mod._send_community_push(
        "c1", title="t", body="b",
    )
    assert result == 0


def test_gate_column_adds_eq_filter(mock_supabase):
    from src.server.routes import notifications as notif_mod

    select = _build_query_chain(mock_supabase, tokens=[])
    notif_mod._send_community_push(
        "c1", title="t", body="b", gate_column="notify_ride_offers",
    )
    # The chain after community_id eq is .neq('fcm_token', 'null'), then
    # .eq('notify_ride_offers', True).
    neq_chain = select.eq.return_value.neq.return_value
    neq_chain.eq.assert_called_with("notify_ride_offers", True)


def test_exclude_user_id_adds_neq_filter(mock_supabase):
    from src.server.routes import notifications as notif_mod

    select = _build_query_chain(mock_supabase, tokens=[])
    notif_mod._send_community_push(
        "c1", title="t", body="b", exclude_user_id="self-uid",
    )
    neq_chain = select.eq.return_value.neq.return_value
    neq_chain.neq.assert_called_with("id", "self-uid")


def test_gate_and_exclude_can_combine(mock_supabase):
    from src.server.routes import notifications as notif_mod

    select = _build_query_chain(mock_supabase, tokens=[])
    notif_mod._send_community_push(
        "c1", title="t", body="b",
        gate_column="notify_ride_requests",
        exclude_user_id="self-uid",
    )
    # Both filters applied to the same neq result
    neq_chain = select.eq.return_value.neq.return_value
    neq_chain.eq.assert_called_with("notify_ride_requests", True)
    eq_chain = neq_chain.eq.return_value
    eq_chain.neq.assert_called_with("id", "self-uid")


def test_with_tokens_calls_firebase_messaging(mock_supabase):
    """When recipients exist, firebase_admin.messaging is imported and
    send_multicast is invoked. We patch the import path so the dep doesn't
    need to be installed locally."""
    from src.server.routes import notifications as notif_mod

    _build_query_chain(mock_supabase, tokens=["tok-1", "tok-2"])

    # Patch the lazy import target. The module imports firebase_admin only
    # when called, so we have to insert into sys.modules.
    import sys
    fake_messaging = MagicMock()
    fake_messaging.send_multicast.return_value = MagicMock(success_count=2)
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
    fake_messaging.send_multicast.assert_called_once()
