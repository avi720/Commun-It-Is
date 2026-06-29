import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/Api';

/**
 * ב-APK של Capacitor, אחרי ש-Google מסיים אימות, Supabase מפנה ל-
 * `com.CommunItIs.myapp://login-callback#access_token=...&refresh_token=...`.
 * האירוע `appUrlOpen` יורה ב-MainActivity (singleTask) כשה-OS פותח את ה-URI.
 * ה-hook הזה מחלץ את ה-tokens, מקרא setSession (זה גורם ל-onAuthStateChange
 * לעדכן את ה-AppContext) וסוגר את ה-Custom Tab.
 *
 * ב-web — הזרימה הרגילה של supabase-js דואגת לכל זה דרך ה-URL hash, וה-hook
 * לא עושה כלום.
 */
export function useNativeAuthCallback() {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        // ב-remote-URL architecture ה-JS מ-Vercel יכול לרוץ על APK ישן
        // שעדיין לא כולל את ה-native layer של @capacitor/app.
        if (!Capacitor.isPluginAvailable('App')) return;

        let listenerHandle;
        (async () => {
            listenerHandle = await App.addListener('appUrlOpen', async ({ url }) => {
                if (!url || !url.startsWith('com.CommunItIs.myapp://login-callback')) {
                    return;
                }
                // ה-tokens חוזרים ב-fragment (#...). URL constructor שומר את ה-#
                // ב-hash; חותכים את ה-# וקוראים את הפרמטרים.
                const hash = url.split('#')[1] || '';
                const params = new URLSearchParams(hash);
                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');
                if (access_token && refresh_token) {
                    await supabase.auth.setSession({ access_token, refresh_token });
                }
                try { await Browser.close(); } catch { /* כבר סגור — מתעלמים */ }
            });
        })();

        return () => {
            listenerHandle?.remove();
        };
    }, []);
}
