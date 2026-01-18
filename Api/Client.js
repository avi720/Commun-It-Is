// Api/Client.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// יצירת הקליינט וייצוא שלו
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const API_URL = "https://commun-it-is.onrender.com/api";

export const avior = {
    // --- ישות האותנטיקציה ---
    auth: {
        signUp: async (email, password) => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/verification-success`
                }
            });
            if (error) throw error;
            return data;
        },
        login: async (email, password) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return data;
        }
    },

    entities: {
        // --- ישות הנסיעות ---
        Ride: {
            // יצירת נסיעה חדשה
            create: async (rideData) => {
                try {
                    const response = await fetch(`${API_URL}/rides`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(rideData),
                    });

                    if (!response.ok) {
                        throw new Error(`Server error: ${response.status}`);
                    }
                    return await response.json();
                } catch (error) {
                    console.error("Error creating ride:", error);
                    throw error;
                }
            },

            // קבלת רשימת נסיעות
            list: async (userCity) => {
                try {
                    const url = `${API_URL}/rides?city=${encodeURIComponent(userCity)}`;
                    // הוספתי כאן את ה-Headers לקריאת GET
                    const response = await fetch(url);

                    console.log("Fetching rides from:", url);
                    if (!response.ok) throw new Error(`Server error: ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error("Error fetching rides:", error);
                    return [];
                }
            }
        },

        // --- ישות המשתמשים ---
        User: {
            createProfile: async (profileData) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.error("User not logged in");
                    return;
                }
                const { error } = await supabase.from('users').update(profileData).eq('id', user.id);
                if (error) {
                    console.error('Error updating profile:', error.message);
                    alert('שגיאה בשמירת הפרטים');
                } else {
                    console.log('Profile updated successfully!');
                }
            },

            update: async (userId, userData) => {
                const response = await fetch(`${API_URL}/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
                    console.error('Server responded with 422:', errorData);
                    throw new Error(errorData.message || 'Failed to update user due to invalid data.');
                }
                return response.json();
            },

            delete: async (userId) => {
                const response = await fetch(`${API_URL}/users/${userId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete user');
                }
                return response.json();
            }
        },

        // --- פוסטים ---
        Post: {
            list: async (userCity) => {
                try {
                    const url = `${API_URL}/posts?city=${encodeURIComponent(userCity)}`;
                    // הוספתי כאן headers לקריאת GET
                    const response = await fetch(url);

                    if (!response.ok) throw new Error('Failed to fetch posts');
                    return response.json();
                } catch (error) {
                    console.error("Error fetching posts:", error);
                    return [];
                }
            },

            create: async (formData) => {
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
        }
    },

    notifications: {
        // ועד שולח הודעה לכולם
        sendToCommunity: async (title, body, communityId, senderName) => {
            const response = await fetch(`${API_URL}/notifications/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body, community_id: communityId, sender_name: senderName })
            });
            if (!response.ok) throw new Error('Failed to send notification');
            return response.json();
        },

        // משתמש מעדכן את הטוקן שלו
        updateToken: async (userId, token) => {
            await fetch(`${API_URL}/users/${userId}/token`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fcm_token: token })
            });
        },

        getHistory: async (communityId) => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('community_id', communityId)
                .order('created_at', { ascending: false }); // הכי חדש למעלה

            if (error) throw error;
            return data;
        }
    }
};