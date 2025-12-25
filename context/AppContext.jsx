import React, { createContext, useContext, useState, useEffect } from 'react';
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
            const parsedUser = JSON.parse(storedUser);
            
            // בדיקה מול השרת שהמשתמש קיים
            const response = await fetch(`${API_URL}/users/check/${parsedUser.email}`);
            
            if (response.ok) {
                setUser(parsedUser);
                setIsAuthenticated(true);
            } else {
                console.warn("User invalid on server, logging out...");
                handleLogout();
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