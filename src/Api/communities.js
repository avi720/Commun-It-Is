import { supabase } from './config';

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
 * Join a community by name
 * @param {string} communityName - Name of the community to join
 * @returns {Promise<Object>} Join response with success status
 */
export async function joinByName(communityName) {
    const { data, error } = await supabase.rpc('join_community_by_name', {
        requested_name: communityName
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    return data;
}
