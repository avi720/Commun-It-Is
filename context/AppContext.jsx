import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '../Api/Client'; // או ה-URL הישיר שלך אם אין לך client מוגדר לזה

// 1. יצירת ההקשר (הצינור שדרכו עובר המידע)
const AppContext = createContext();

// 2. ה-Provider: הרכיב המנהל
export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // מתחילים בטעינה
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // כתובת ה-API שלך
    const API_URL = "https://0.0.0.0:8000/api"; 

    // פונקציה לטעינה ואימות נתונים
    const loadUserData = async () => {
        setIsLoading(true);
        const storedUser = localStorage.getItem('tremp_userData');

        if (!storedUser) {
            // אין מידע מקומי -> לא מחובר
            setIsLoading(false);
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);
            
            // בדיקה מול השרת: האם המשתמש קיים?
            const response = await fetch(`${API_URL}/users/check/${parsedUser.email}`);
            
            if (response.ok) {
                // הכל תקין - מעדכנים סטייט
                setUser(parsedUser);
                setIsAuthenticated(true);
            } else {
                // המשתמש נמחק מהשרת או חסום -> מנקים הכל
                console.warn("User invalid on server, logging out...");
                handleLogout();
            }
        } catch (error) {
            console.error("Data loading error:", error);
            // במקרה של שגיאת רשת, אפשר להחליט אם לנתק או להשאיר מחובר אופליין
            // כרגע נשאיר מחובר על בסיס הזיכרון המקומי
            if (storedUser) {
                 setUser(JSON.parse(storedUser));
                 setIsAuthenticated(true);
            }
        } finally {
            setIsLoading(false); // סיימנו לטעון
        }
    };

    // טעינה ראשונית
    useEffect(() => {
        loadUserData();
    }, []);

    // פונקציית התנתקות (חשופה לכל האפליקציה)
    const handleLogout = () => {
        localStorage.removeItem('tremp_userData');
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/login'; // ניווט מלא כדי לאפס הכל
    };

    // פונקציה לעדכון פרטי משתמש (למשל מדף הגדרות)
    const updateUser = (newUserData) => {
        setUser(newUserData);
        localStorage.setItem('tremp_userData', JSON.stringify(newUserData));
    };

    // המידע שאנחנו חושפים החוצה
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

// 3. ה-Hook שלנו: קיצור דרך לשימוש במידע
export const useAppData = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppData must be used within an AppProvider');
    }
    return context;
};