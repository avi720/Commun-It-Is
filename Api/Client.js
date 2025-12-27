// Api/Client.js

// הפניה לשרת הפייתון המקומי שלך
const API_URL = "/api";

export const avior = {
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
            list: async (sortOrder = '-created_date') => {
                try {
                    const response = await fetch(`${API_URL}/rides`);
                    console.log("Fetching rides from:", `${API_URL}/rides`);
                    if (!response.ok) {
                        throw new Error(`Server error: ${response.status}`);
                    }
                    return await response.json();
                } catch (error) {
                    console.error("Error fetching rides:", error);
                    return []; // מחזיר רשימה ריקה במקרה של שגיאה כדי שהאתר לא יקרוס
                }
            }
        }, // <--- סגירת Ride

        // --- ישות המשתמשים (עכשיו היא בחוץ, כמו שצריך) ---
        User: {
            create: async (userData) => {
                // המרת הגיל למספר
                const payload = {
                    ...userData,
                    age: parseInt(userData.age)
                };
                console.log("Creating user with payload:", payload);
                // תיקון: שימוש ב-API_URL
                const response = await fetch(`${API_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to create user: ${errorText}`);
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
            list: async () => {
                const response = await fetch(`${API_URL}/posts`);
                if (!response.ok) throw new Error('Failed to fetch posts');
                return response.json();
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