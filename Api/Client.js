// Api/Client.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// יצירת הקליינט וייצוא שלו - קריטי שזה יהיה כאן!
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// הפניה לשרת הפייתון המקומי שלך
const API_URL = "/api";

export const avior = {
    // --- ישות האותנטיקציה ---
    auth: {
    // פונקציה חדשה: רק רושמת ל-Auth ושולחת מייל
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
        // לבדיקה למה ההתנתקות נמצא ב-AppContext.jsx
        // signOut: async () => {
        //     await supabase.auth.signOut();
        //},
        login: async (email, password) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return data;
        },
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
                    const response = await fetch(url);
                    console.log("Fetching rides from:", url);
                    if (!response.ok) throw new Error(`Server error: ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error("Error fetching rides:", error);
                    return []; // מחזיר רשימה ריקה במקרה של שגיאה כדי שהאתר לא יקרוס
                }
            }
        }, // <--- סגירת Ride

        // --- ישות המשתמשים (עכשיו היא בחוץ, כמו שצריך) ---
        User: {
            // פונקציה חדשה: שמירת הפרטים בטבלה (תקרא לה ב-Onboarding)
            createProfile: async (profileData) => {
                // כאן אנחנו שולחים לשרת (Python) שישמור בטבלה
                const response = await fetch(`${API_URL}/create_user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profileData)
                });
                
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.detail || 'Failed to create profile');
                }
                return response.json();
            },
            
            login: async (email, password) => {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                if (!response.ok) {
                    throw new Error('Login failed');
                }
                return response.json();
            },

            update: async (userId, userData) => {
                const response = await fetch(`${API_URL}/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
        
                if (!response.ok) {
                    // Try to parse the error message from the server response
                    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
                    console.error('Server responded with 422:', errorData); // Log the server's detailed error
                    throw new Error(errorData.message || 'Failed to update user due to invalid data.');
                }
                return response.json();
                
            },
            
            delete: async (userId) => {
                const response = await fetch(`${API_URL}/users/${userId}`, {
                    method: 'DELETE',
                });
                
                if (!response.ok) {
                    throw new Error('Failed to delete user');
                }
                return response.json();
            }
        }, // <--- סגירת User

        Post: {
            list: async (userCity) => {
                try {
                    const url = `${API_URL}/posts?city=${encodeURIComponent(userCity)}`;
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Failed to fetch posts');
                    return response.json();
                } catch (error) {
                    console.error("Error fetching posts:", error);
                    return []; // מחזיר רשימה ריקה במקרה של שגיאה כדי שהאתר לא יקרוס
                }
            },

            create: async (formData) => {
                // שים לב: אנחנו מקבלים formData ישירות, ולא אובייקט רגיל
                const response = await fetch(`${API_URL}/posts`, {
                    method: 'POST',
                    // חשוב: לא מוסיפים headers: { 'Content-Type': 'application/json' }
                    // הדפדפן יגדיר אוטומטית multipart/form-data
                    body: formData 
                });
                
                if (!response.ok) {
                    const errorText = await response.text(); // כדי לראות שגיאות מהשרת
                    console.error("Server Error:", errorText);
                    throw new Error('Failed to create post');
                }
                return response.json();
            }
        }
    } // <--- סגירת entities
};