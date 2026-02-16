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
 * Get list of rides filtered by city
 * @param {string} userCity - City name to filter rides
 * @returns {Promise<Array>} Array of ride objects
 */
export async function list(userCity) {
    try {
        const url = `${API_URL}/rides?city=${encodeURIComponent(userCity)}`;
        const response = await fetch(url);

        console.log("Fetching rides from:", url);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching rides:", error);
        return [];
    }
}
