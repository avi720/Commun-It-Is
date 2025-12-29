import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../Api/Client';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const API_URL = "/api"; 

    // הוספנו פרמטר showLoader (ברירת מחדל: true)
    const loadUserData = async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                // רק אם זה לא טעינה שקטה, מבצעים ניתוק מלא.
                // בטעינה שקטה אולי נעדיף לא לזרוק את המשתמש מיד אם יש בעיית רשת רגעית,
                // אבל כאן נשאיר את זה פשוט.
                setUser(null);
                setIsAuthenticated(false);
                if (showLoader) setIsLoading(false);
                return;
            }
            console.log("Session found:", session);
            // מביאים את פרטי המשתמש מה-API שלנו
            const response = await fetch(`${API_URL}/users/check/${session.user.email}`);
            // אם קיבלנו נתונים, המשתמש קיים במערכת. אם לא, הוא צריך להשלים פרטים.
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setIsAuthenticated(true);
            } else if (response.status === 404) {
                setUser({ 
                    id: session.user.id,
                    email: session.user.email,
                    isIncomplete: true 
                });
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Data loading error:", error);
            setUser(null);
            setIsAuthenticated(false);
            // לא מנתקים מיד בשגיאת רשת כדי לא להעיף משתמש סתם
        } finally {
            if (showLoader) setIsLoading(false);
        }
    };
    
    useEffect(() => {
        // בטעינה הראשונה של הדף - מציגים לואדר
        loadUserData(true);
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // --- התיקון כאן: בשינויים אוטומטיים, לא מראים לואדר ---
                // אלא אם כן המשתמש עדיין לא מחובר בכלל (null)
                loadUserData(false); 
            
            } else if (event === 'SIGNED_OUT') {
                // כאן זה בסדר לקרוא לניקוי, כי זה בא מהאירוע עצמו
                setUser(null);
                setIsAuthenticated(false);
                setIsLoading(false);
                //handleLogout();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        try{
            await supabase.auth.signOut()
        } catch (error) {
            console.error("Logout error:", error);
        }
        localStorage.removeItem('tremp_userData');
    };

    // כשקוראים לרענון ידני (למשל מכפתור "אימתתי מייל"), כן נרצה לראות לואדר
    const refresh = () => loadUserData(true);

    const value = {
        user,
        isLoading,
        isAuthenticated,
        logout: handleLogout,
        refresh
        // פונקציה לרענון שקט אם תצטרך בעתיד
        //silentRefresh: () => loadUserData(false) 
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