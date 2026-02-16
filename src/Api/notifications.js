import { supabase, API_URL, getAuthHeaders } from './config';

/**
 * Send notification to all users in a community
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} communityId - Community ID
 * @param {string} senderName - Name of the sender
 * @param {Object|null} session - Supabase session object with access_token
 * @returns {Promise<Object>} Response with success status and sent count
 */
export async function sendToCommunity(title, body, communityId, senderName, session = null) {
    const response = await fetch(`${API_URL}/notifications/send`, {
        method: 'POST',
        headers: getAuthHeaders(session),
        body: JSON.stringify({ title, body, community_id: communityId, sender_name: senderName })
    });
    if (!response.ok) throw new Error('Failed to send notification');
    return response.json();
}

/**
 * Update user's FCM device token
 * @param {string} token - FCM token
 * @param {Object|null} session - Supabase session object with access_token
 * @returns {Promise<void>}
 */
export async function updateToken(token, session = null) {
    if (!session) return;

    await fetch(`${API_URL}/users/token`, {
        method: 'PUT',
        headers: getAuthHeaders(session),
        body: JSON.stringify({ fcm_token: token })
    });
}

/**
 * Get notification history for a community
 * @param {string} communityId - Community ID
 * @returns {Promise<Array>} Array of notification objects
 */
export async function getHistory(communityId) {
    const { data, error } = await supabase
        .from('important_notifications')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
