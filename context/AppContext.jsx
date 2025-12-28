import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../Api/Client';
// import { base44 } from '../Api/Client'; // לא בשימוש ישיר כאן כרגע

const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // --- התיקון הקריטי ---
    // שימוש בנתיב יחסי. ה-Vite Proxy (שמוגדר ב-vite.config.js) ינתב את זה לשרת הנכון אוטומטית.
    const API_URL = "/api"; 

    const loadUserData = async () => {
        setIsLoading(true);
        const storedUser = localStorage.getItem('tremp_userData');

        if (!storedUser) {
            setIsLoading(false);
            return;
        }

        try {
            // בדיקת סשן נוכחי מול Supabase
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                handleLogout();
                return;
            }

            // המשתמש מחובר! עכשיו נבדוק אם יש לו פרופיל בטבלה שלנו
            const response = await fetch(`${API_URL}/users/check/${session.user.email}`);
            
            if (response.ok) {
                // מצב תקין: יש משתמש ויש פרופיל
                const userData = await response.json();
                setUser(userData);
                setIsAuthenticated(true);
            } else if (response.status === 404) {
                // --- מצב ביניים: מחובר אבל אין פרופיל ---
                console.log("User authenticated but no profile found. Redirecting to onboarding.");
                
                // אנחנו מגדירים משתמש זמני כדי שהמערכת לא תזרוק אותו
                setUser({ 
                    id: session.user.id,
                    email: session.user.email,
                    // firstName: session.user.user_metadata.first_name,
                    // lastName: session.user.user_metadata.last_name,
                    isIncomplete: true // דגל שיעזור לנו ב-App.jsx
                });
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Data loading error:", error);
            // במקרה של שגיאת רשת (שרת למטה), נשאיר את המשתמש מחובר על בסיס הזיכרון
            if (storedUser) {
                 try {
                    setUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);
                 } catch (e) {
                    handleLogout();
                 }
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUserData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('tremp_userData');
        localStorage.removeItem('tremp_isLoggedIn'); // ניקוי יסודי
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/login';
    };

    const updateUser = (newUserData) => {
        setUser(newUserData);
        localStorage.setItem('tremp_userData', JSON.stringify(newUserData));
    };

    const value = {
        user,
        isLoading,
        isAuthenticated,
        logout: handleLogout,
        updateUser,
        refresh: loadUserData
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export const useAppData = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppData must be used within an AppProvider');
    }
    return context;
};