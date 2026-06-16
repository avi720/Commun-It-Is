import { supabase } from './config';
import { API_URL, getAuthHeaders } from './config';

/**
 * Get all communities
 * @returns {Promise<Array>} Array of community objects with id and name
 */
export async function getAll() {
    const { data, error } = await supabase
        .from('communities')
        .select('id, name')
        .order('name');

    if (error) throw error;
    return data;
}

/**
 * Join a community by name (legacy onboarding RPC — kept for the register
 * flow that creates a brand-new resident profile in a community).
 */
export async function joinByName(communityName) {
    const { data, error } = await supabase.rpc('join_community_by_name', {
        requested_name: communityName
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    return data;
}

/**
 * List the caller's community memberships (all communities they belong to)
 * plus which one is active. Returns `{ communities: [...], active_community_id }`.
 * Each community row carries `role`, `joined_at`, and `is_active`.
 *
 * @param {Object} session - Supabase session
 */
export async function listMyMemberships(session) {
    const res = await fetch(`${API_URL}/communities/me`, {
        headers: getAuthHeaders(session),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown' }));
        throw new Error(err.detail || 'Failed to list communities');
    }
    return res.json();
}

/**
 * Join a community by its invite code. Server validates the code, inserts a
 * `user_communities` row, and switches the user's ACTIVE community to the
 * newly joined one (so they see the new community's feed immediately).
 *
 * @param {string} inviteCode
 * @param {Object} session
 */
export async function joinByCode(inviteCode, session) {
    const res = await fetch(`${API_URL}/communities/join`, {
        method: 'POST',
        headers: getAuthHeaders(session),
        body: JSON.stringify({ invite_code: inviteCode }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown' }));
        throw new Error(err.detail || 'Failed to join community');
    }
    return res.json();
}

/**
 * Switch the active community to one the user is already a member of.
 * Updates `users.community_id` (which every community-scoped server filter
 * reads from) and copies the per-membership role to `users.community_role`.
 *
 * @param {string} communityId
 * @param {Object} session
 */
export async function switchActive(communityId, session) {
    const res = await fetch(`${API_URL}/communities/active`, {
        method: 'PUT',
        headers: getAuthHeaders(session),
        body: JSON.stringify({ community_id: communityId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown' }));
        throw new Error(err.detail || 'Failed to switch community');
    }
    return res.json();
}

/**
 * Leave a community. Blocked server-side if it's the only membership.
 * If the user leaves their active community, the server repoints the
 * active pointer to one of the remaining memberships.
 *
 * @param {string} communityId
 * @param {Object} session
 */
export async function leave(communityId, session) {
    const res = await fetch(`${API_URL}/communities/me/${communityId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(session),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown' }));
        throw new Error(err.detail || 'Failed to leave community');
    }
    return res.json();
}
