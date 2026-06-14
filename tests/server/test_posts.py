"""
Tests for the new posts route behavior added in profile_tab_v1:
- GET /posts ?author_id filter
- PUT /posts/{id} owner-only enforcement
- DELETE /posts/{id} owner-only enforcement

Like test_rides.py, these tests mock supabase so they're deterministic.
"""
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException


def test_get_posts_without_author_id_uses_single_eq(mock_supabase):
    """Default flow: filter by community_id only, no author filter."""
    from src.server.routes import posts as posts_mod

    # Stub the chain. .table().select().eq() returns a builder; .order().execute() returns posts.
    eq_chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    order_chain = eq_chain.order.return_value
    order_chain.execute.return_value = MagicMock(data=[
        {"id": "p1", "user_id": "u1", "content": "hi", "community_id": "c1"},
    ])
    # Second query (.in_) for user lookup
    in_chain = mock_supabase.table.return_value.select.return_value.in_.return_value
    in_chain.execute.return_value = MagicMock(data=[
        {"id": "u1", "firstName": "Avi", "lastName": "Paz", "phone": "0500000000", "city": "TLV"}
    ])

    result = posts_mod.get_posts(author_id=None, community_id="c1")
    assert len(result) == 1
    assert result[0]["users"]["firstName"] == "Avi"
    # Verify the chain didn't get an extra .eq() for author
    # (only one .eq call: community_id)
    select_mock = mock_supabase.table.return_value.select.return_value
    assert select_mock.eq.call_count == 1
    select_mock.eq.assert_called_with("community_id", "c1")


def test_get_posts_with_author_id_adds_second_eq(mock_supabase):
    """When author_id is provided, an additional eq('user_id', author_id) is applied."""
    from src.server.routes import posts as posts_mod

    eq1 = mock_supabase.table.return_value.select.return_value.eq.return_value  # after community_id
    eq2 = eq1.eq.return_value  # after user_id
    order_chain = eq2.order.return_value
    order_chain.execute.return_value = MagicMock(data=[])

    result = posts_mod.get_posts(author_id="u-author", community_id="c1")
    assert result == []

    # The first .eq is community_id (called on the select result), the second
    # .eq is user_id (chained on the result of the first .eq).
    eq1.eq.assert_called_with("user_id", "u-author")


def test_update_post_owner_only_403_when_not_author(mock_supabase, monkeypatch):
    """Non-author PUT must 403."""
    import asyncio
    from src.server.routes import posts as posts_mod

    # Existing post belongs to "owner-1"
    post_chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    post_chain.execute.return_value = MagicMock(data=[
        {"user_id": "owner-1", "image_url": None}
    ])

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(posts_mod.update_post(
            post_id="post-1",
            content="hijacked",
            remove_image=False,
            image=None,
            user_id="intruder",
        ))
    assert exc_info.value.status_code == 403


def test_delete_post_owner_only_403_when_not_author(mock_supabase):
    from src.server.routes import posts as posts_mod

    post_chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    post_chain.execute.return_value = MagicMock(data=[
        {"user_id": "owner-1", "image_url": None}
    ])

    with pytest.raises(HTTPException) as exc_info:
        posts_mod.delete_post(post_id="post-1", user_id="intruder")
    assert exc_info.value.status_code == 403


def test_delete_post_404_when_post_missing(mock_supabase):
    from src.server.routes import posts as posts_mod

    post_chain = mock_supabase.table.return_value.select.return_value.eq.return_value
    post_chain.execute.return_value = MagicMock(data=[])

    with pytest.raises(HTTPException) as exc_info:
        posts_mod.delete_post(post_id="ghost", user_id="anyone")
    assert exc_info.value.status_code == 404


def test_extract_storage_path_parses_public_url():
    from src.server.routes.posts import _extract_storage_path

    url = "https://abc.supabase.co/storage/v1/object/public/images/post_images/uuid-1.jpg"
    assert _extract_storage_path(url) == "post_images/uuid-1.jpg"
    assert _extract_storage_path(url + "?cache=1") == "post_images/uuid-1.jpg"
    assert _extract_storage_path(None) is None
    assert _extract_storage_path("https://elsewhere.example/foo.jpg") is None
