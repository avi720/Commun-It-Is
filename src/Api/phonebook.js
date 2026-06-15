import { supabase } from './config';

/**
 * Get contacts from phonebook for a specific community.
 *
 * Reads from the `phonebook_visible` view rather than the `users` table
 * directly. The view applies `address_visibility` filtering server-side
 * (`SECURITY INVOKER`, see migration profile_tab_v1): if a user set their
 * address to "nobody" or "committee" and the caller doesn't qualify, the
 * address column is NULL in the JSON response — so a hidden address never
 * leaves the database, even to DevTools Network tab.
 *
 * RLS on the underlying `users` table also constrains which rows are
 * returned (only `visible_on_phonebook = true` peers in the same community,
 * plus the caller's own row, plus everything for committee members).
 *
 * @param {string} communityId - Community ID to get contacts for
 * @returns {Promise<Array>} Array of contact objects
 */
export async function getContacts(communityId) {
    const { data, error } = await supabase
        .from('phonebook_visible')
        .select('id, firstName, lastName, phone, city, address, avatar_url')
        .eq('community_id', communityId)
        .eq('visible_on_phonebook', true)
        .order('firstName');

    if (error) throw error;
    return data;
}
