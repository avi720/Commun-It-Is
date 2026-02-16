import { API_URL } from './config';

/**
 * Get list of posts filtered by city
 * @param {string} userCity - City name to filter posts
 * @returns {Promise<Array>} Array of post objects
 */
export async function list(userCity) {
    try {
        const url = `${API_URL}/posts?city=${encodeURIComponent(userCity)}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to fetch posts');
        return await response.json();
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

/**
 * Create a new post
 * @param {FormData} formData - Form data containing post information and optional image
 * @returns {Promise<Object>} Created post data
 */
export async function create(formData) {
    const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        throw new Error('Failed to create post');
    }
    return response.json();
}
