import { supabase } from './config';

/**
 * Get contacts from phonebook for a specific community
 * @param {string} communityId - Community ID to get contacts for
 * @returns {Promise<Array>} Array of contact objects with first_name, last_name, phone, city, street
 */
export async function getContacts(communityId) {
    const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, phone, city, street')
        .eq('community_id', communityId)
        .eq('visible_on_phonebook', true)
        .order('first_name');

    if (error) throw error;
    return data;
}
