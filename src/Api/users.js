import { supabase, API_URL, getAuthHeaders } from './config';

const AVATAR_BUCKET = 'avatars';

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

/**
 * Upload a new avatar for the current user.
 *
 * Uploads directly from the browser to the Supabase `avatars` Storage bucket
 * (RLS scopes writes to `${user.id}/...` — see migration profile_tab_v1).
 * Then PUTs /users/{id} to persist the resulting public URL on
 * `users.avatar_url`. The FastAPI backend never touches the binary.
 *
 * @param {File|Blob} file - The image to upload
 * @param {Object} session - Supabase session (needed for the /users PUT)
 * @returns {Promise<{ avatar_url: string }>}
 */
export async function uploadAvatar(file, session) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
    // Stable per-user filename → `upsert: true` overwrites the previous
    // avatar atomically and the public URL stays the same shape. We append
    // a cache-buster on the returned URL so the <img> reloads after replace.
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (uploadError) throw new Error(uploadError.message || 'Avatar upload failed');

    const { data: { publicUrl } } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(path);
    const avatar_url = `${publicUrl}?t=${Date.now()}`;

    await update(user.id, { avatar_url }, session);
    return { avatar_url };
}

/**
 * Change the current user's password. Verifies the current password
 * server-side, then sets the new one via the admin API.
 *
 * @param {{current: string, next: string}} params
 * @param {Object} session
 * @returns {Promise<void>}
 */
export async function changePassword({ current, next }, session) {
    const response = await fetch(`${API_URL}/users/me/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(session),
        body: JSON.stringify({ current_password: current, new_password: next }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'שגיאה בשינוי הסיסמה');
    }
}

/**
 * Remove the current user's avatar — deletes the object from Storage and
 * clears `users.avatar_url`. Storage delete failure is logged but does not
 * abort the column update (orphans don't break correctness).
 *
 * @param {Object} session
 * @returns {Promise<void>}
 */
export async function deleteAvatar(session) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // We don't know the extension here without a DB read; list the user's
    // folder and remove anything we find. Idempotent — empty folder is fine.
    const { data: files } = await supabase.storage
        .from(AVATAR_BUCKET)
        .list(user.id, { limit: 10 });

    if (files && files.length > 0) {
        const paths = files.map((f) => `${user.id}/${f.name}`);
        const { error } = await supabase.storage.from(AVATAR_BUCKET).remove(paths);
        if (error) console.error('Avatar storage delete failed:', error.message);
    }

    await update(user.id, { avatar_url: null }, session);
}
