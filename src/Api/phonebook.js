import { supabase } from './config';

/**
 * Contacts for the caller's active community.
 *
 * `get_phonebook()` is security definer and returns only the columns the
 * phonebook is allowed to show. Address is already filtered inside the
 * function (everyone / committee / nobody), so a hidden address is never
 * sent to the browser. Direct `select` on `users` is own-row or committee
 * only — do not read the phonebook from that table.
 *
 * The RPC also returns the caller and, for committee members, residents who
 * opted out. This page keeps the previous behaviour: only people who turned
 * `visible_on_phonebook` on, and only for the community the UI asked for.
 *
 * @param {string} communityId - Community the screen is showing
 * @returns {Promise<Array>} Array of contact objects
 */
export async function getContacts(communityId) {
    const { data, error } = await supabase.rpc('get_phonebook');

    if (error) throw error;
    return (data || []).filter(
        (row) => row.community_id === communityId && row.visible_on_phonebook
    );
}
