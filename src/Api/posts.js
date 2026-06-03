import { API_URL, getAuthHeaders, getAuthHeadersMultipart } from './config';

/**
 * Get list of posts for the current user's community.
 * הסינון לפי קהילה/עיר נעשה בצד השרת לפי הטוקן של המשתמש
 * (ה-backend שולף את ה-community_id מתוך המשתמש המאומת),
 * ולכן חובה לשלוח את ה-session, אחרת השרת יחזיר 401.
 * @param {Object|null} session - Supabase session object with access_token
 * @returns {Promise<Array>} Array of post objects
 */
export async function list(session = null) {
    try {
        const url = `${API_URL}/posts`;
        const response = await fetch(url, {
            headers: getAuthHeaders(session),
        });

        if (!response.ok) throw new Error(`Failed to fetch posts: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

/**
 * Create a new post
 * @param {FormData} formData - Form data containing post information and optional image
 * @param {Object|null} session - Supabase session object with access_token
 * @returns {Promise<Object>} Created post data
 */
export async function create(formData, session = null) {
    const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: getAuthHeadersMultipart(session),
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        throw new Error('Failed to create post');
    }
    return response.json();
}
