import React, { createContext, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { supabase } from '../Api';

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
                // ננקה את זיהוי המשתמש ב-Sentry כדי ששגיאות עתידיות לא ישויכו למי שהיה מחובר
                Sentry.setUser(null);
                if (showLoader) setIsLoading(false);
                return;
            }
            // מסמנים את ה-user.id ב-Sentry — UUID בלבד, בלי שם/מייל/טלפון.
            // מאפשר לסנן שגיאות לפי משתמש בלי לשלוח PII.
            Sentry.setUser({ id: currentSession.user.id });
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
            // OAuth avatar fallback: if the user has no avatar set in our DB
            // but their identity provider supplied one (Google → `picture`,
            // others → `avatar_url`), copy it over once. Idempotent.
            //
            // Race safety: we use a conditional UPDATE — `.is('avatar_url',
            // null)` is evaluated atomically at the row level by Postgres,
            // so even if loadUserData fires while the user is uploading their
            // own avatar in another tab, only one write wins. If the user's
            // upload landed first, this no-ops; if the fallback lands first,
            // the upload still overwrites it (its UPDATE has no IS NULL
            // filter). RLS already restricts the UPDATE to the user's own row
            // (`auth.uid() = id`), so no elevated permissions are needed.
            if (profile && currentSession && !profile.avatar_url) {
                const meta = currentSession.user?.user_metadata || {};
                const providerAvatar = meta.picture || meta.avatar_url;
                if (providerAvatar) {
                    supabase
                        .from('users')
                        .update({ avatar_url: providerAvatar })
                        .eq('id', currentSession.user.id)
                        .is('avatar_url', null)
                        .select('avatar_url')
                        .then(({ data, error }) => {
                            if (error) {
                                console.error("OAuth avatar copy failed:", error);
                                return;
                            }
                            // data.length === 0 means the WHERE didn't match
                            // (the user already has a custom avatar — don't
                            // touch local state).
                            if (data && data.length > 0) {
                                setUser((prev) =>
                                    prev ? { ...prev, avatar_url: providerAvatar } : prev
                                );
                            }
                        });
                }
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
        Sentry.setUser(null);
    };

    // כשקוראים לרענון ידני (למשל מכפתור "אימתתי מייל"), כן נרצה לראות לואדר
    const refresh = () => loadUserData(true);

    // Optimistic local update: callers that already PUT-ed the user to the
    // server can call this to keep the UI in sync without a full refetch.
    // Accepts either a partial patch (merged onto the current user) or a
    // full user object — both shapes work because we always spread `user`.
    const updateUser = (patch) => {
        setUser((prev) => (prev ? { ...prev, ...patch } : patch));
    };

    const value = {
        user,
        session,
        isLoading,
        isAuthenticated,
        logout: handleLogout,
        refresh,
        updateUser,
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