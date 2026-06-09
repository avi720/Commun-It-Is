import React, { createContext, useState, useEffect } from 'react';
import { supabase, avior } from '../Api';

// ה-context object מיוצא כדי ש-useAppData (בקובץ נפרד) יוכל להשתמש בו.
// פיצול הזה מונע אזהרת react-refresh/only-export-components: קובץ עם קומפוננטה
// לא יכול גם לייצא hook בלי לשבור hot module replacement.
export const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // מצב הסיידבר (isSidebarOpen/toggleSidebar/closeSidebar) הועבר ל-MainLayout
    // והוא מועבר לדפים דרך useOutletContext() — ראה docs/ARCHITECTURE.md.

    // הוספנו פרמטר showLoader (ברירת מחדל: true)
    const loadUserData = async (showLoader = true) => {
        if (showLoader) setIsLoading(true);

        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            if (!currentSession) {
                // רק אם זה לא טעינה שקטה, מבצעים ניתוק מלא.
                // בטעינה שקטה אולי נעדיף לא לזרוק את המשתמש מיד אם יש בעיית רשת רגעית,
                // אבל כאן נשאיר את זה פשוט.
                setUser(null);
                setIsAuthenticated(false);
                if (showLoader) setIsLoading(false);
                return;
            }
            const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', currentSession.user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = לא נמצאו תוצאות (JSON object requested, multiple (or no) rows returned)
                console.error("Error fetching profile:", error);
                throw error;
            }
            // 3. בדיקה אם הפרופיל קיים ומלא
            if (profile) {
                // בדיקה אם חסרים פרטים קריטיים (למשל שם פרטי)
                if (!profile.firstName || !profile.lastName || !profile.city || !profile.phone || !profile.address || !profile.age) {
                    setUser({ ...profile, isIncomplete: true });
                    // המשתמש מחובר, אך חסרים פרטים -> ינותב ל-Onboarding
                    // } else if (profile.is_verified_as_resident === false) {
                    //     setUser({ ...profile, isVerifiedResident: false });
                    // }
                } else {
                    setUser(profile);
                }
                setIsAuthenticated(true);
            } else {
                // מקרה קצה: יש משתמש ב-Auth אבל לא ב-Public (אמור להיות מטופל ע"י הטריגר, אבל ליתר ביטחון)
                console.warn("User exists in Auth but not in public.users");
                setUser({
                    id: currentSession.user.id,
                    email: currentSession.user.email,
                    isIncomplete: true
                });
                setIsAuthenticated(true);
            }
            // אם יש טוקן של FCM שממתין בזיכרון, שלח אותו לשרת
            const storedToken = localStorage.getItem('fcm_token');
            if (storedToken && profile && currentSession) {
                avior.notifications.updateToken(storedToken, currentSession)
                    .catch(err => console.error("Token update failed", err));
            }

        } catch (error) {
            console.error("Data loading error:", error);
            // במקרה של שגיאה קריטית, נשאיר את המשתמש מחובר אך ללא נתונים כדי לא לזרוק אותו סתם
            // או שנחליט לנתק אותו אם זה קריטי
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            if (showLoader) setIsLoading(false);
        }
    };

    useEffect(() => {
        // בטעינה הראשונה של הדף - מציגים לואדר.
        // loadUserData הוא fetch אסינכרוני שמחייב useEffect ולא ניתן להפוך אותו
        // ל-lazy useState init — לכן ה-warning של react-hooks/set-state-in-effect
        // מוסר ידנית כאן.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadUserData(true);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            // 3. עדכון ה-session בזמן אמת כשיש שינוי (התחברות/התנתקות)
            setSession(newSession);
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // --- התיקון כאן: בשינויים אוטומטיים, לא מראים לואדר ---
                // אלא אם כן המשתמש עדיין לא מחובר בכלל (null)
                loadUserData(false);

            } else if (event === 'SIGNED_OUT') {
                // כאן זה בסדר לקרוא לניקוי, כי זה בא מהאירוע עצמו
                setUser(null);
                setSession(null);
                setIsAuthenticated(false);
                setIsLoading(false);
                //handleLogout();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
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
        session,
        isLoading,
        isAuthenticated,
        logout: handleLogout,
        refresh,
        // פונקציה לרענון שקט אם תצטרך בעתיד
        //silentRefresh: () => loadUserData(false)
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

// useAppData הועבר ל-./useAppData.js — ראה ההסבר ליד הצהרת AppContext למעלה.