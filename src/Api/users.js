import { supabase, API_URL, getAuthHeaders } from './config';

/**
 * Create or update user profile directly via Supabase
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<void>}
 */
export async function createProfile(profileData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // לא זורקים — הקורא יבדוק תוצאה דרך session/auth state. רישום לשגיאה
        // הוא הסיגנל היחיד כל עוד אין error tracker (T19).
        console.error("User not logged in");
        return;
    }
    const { error } = await supabase.from('users').update(profileData).eq('id', user.id);
    if (error) {
        console.error('Error updating profile:', error.message);
        // זורקים כדי שהקורא (OnboardingPage / ProfileForm) יציג toast.error.
        // לא מציגים alert מכאן כי זה ה-API layer.
        throw new Error(error.message || 'שגיאה בשמירת הפרטים');
    }
}

/**
 * Update user profile via API
 * @param {string} userId - User ID to update
 * @param {Object} userData - User data to update
 * @param {Object|null} session - Supabase session object with access_token
 * @returns {Promise<Object>} Updated user data
 */
export async function update(userId, userData, session = null) {
    if (!session) return;
    // ה-backend מצפה ל-PUT /api/users/{user_id} עם שדות העדכון ישירות ב-body,
    // ומאמת שהמשתמש מעדכן את עצמו לפי הטוקן.
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(session),
        body: JSON.stringify(userData)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        console.error('Server responded with error:', errorData);
        throw new Error(errorData.message || 'Failed to update user due to invalid data.');
    }
    return response.json();
}

/**
 * Delete a user
 * @param {string} userId - User ID to delete
 * @param {Object|null} session - Supabase session object with access_token
 * @returns {Promise<Object>} Deletion response
 */
export async function deleteUser(userId, session = null) {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(session)
    });

    if (!response.ok) {
        throw new Error('Failed to delete user');
    }
    return response.json();
}
