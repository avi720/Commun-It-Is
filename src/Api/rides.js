import { API_URL, getAuthHeaders } from './config';

/**
 * Create a new ride
 * @param {Object} rideData - Ride data (driver_name, location, destination, departure_time, seats)
 * @param {Object|null} session - Supabase session object with access_token
 * @returns {Promise<Object>} Created ride data
 */
export async function create(rideData, session = null) {
    try {
        const response = await fetch(`${API_URL}/rides`, {
            method: 'POST',
            headers: getAuthHeaders(session),
            body: JSON.stringify(rideData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Server reported error:", errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating ride:", error);
        throw error;
    }
}

/**
 * Get list of rides for the current user's community.
 * הסינון לפי קהילה נעשה בצד השרת לפי הטוקן של המשתמש
 * (ה-backend שולף את ה-community_id מהמשתמש המאומת),
 * ולכן חובה לשלוח את ה-session, אחרת השרת יחזיר 401.
 * @param {Object|null} session - Supabase session object with access_token
 * @returns {Promise<Array>} Array of ride objects
 */
export async function list(session = null, { userId, type, upcoming } = {}) {
    try {
        const url = new URL(`${API_URL}/rides`, window.location.origin);
        if (userId) url.searchParams.set('user_id', userId);
        if (type) url.searchParams.set('type', type);
        // Only set `upcoming` when explicitly false so the server default
        // (true) keeps the existing PublicDisplay behavior untouched.
        if (upcoming === false) url.searchParams.set('upcoming', 'false');
        const response = await fetch(url.pathname + url.search, {
            headers: getAuthHeaders(session),
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching rides:", error);
        return [];
    }
}

/**
 * Update a ride (owner-only on the server). user_id/community_id/type
 * cannot be mutated — the server schema blocks them.
 * @param {string} rideId
 * @param {Object} patch - any of: driver_name, location, destination, departure_time, seats
 * @param {Object|null} session
 */
export async function update(rideId, patch, session = null) {
    const response = await fetch(`${API_URL}/rides/${rideId}`, {
        method: 'PUT',
        headers: getAuthHeaders(session),
        body: JSON.stringify(patch),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update ride:', errorText);
        throw new Error('Failed to update ride');
    }
    return response.json();
}

/**
 * Delete a ride (owner-only on the server).
 * @param {string} rideId
 * @param {Object|null} session
 */
export async function remove(rideId, session = null) {
    const response = await fetch(`${API_URL}/rides/${rideId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(session),
    });
    if (!response.ok) throw new Error('Failed to delete ride');
    return response.json();
}
