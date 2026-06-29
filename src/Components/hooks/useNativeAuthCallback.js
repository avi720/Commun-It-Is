import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { supabase } from '@/Api';
import { NATIVE_OAUTH_REDIRECT } from '@/Api/auth';

/**
 * ב-APK של Capacitor, אחרי ש-Google מסיים אימות, Supabase מפנה ל-
 * `com.CommunItIs.myapp://login-callback?code=...` (PKCE) או
 * `com.CommunItIs.myapp://login-callback#access_token=...` (implicit).
 *
 * supabase-js v2 משתמש PKCE כברירת מחדל — ה-callback מחזיר `?code=`,
 * וה-hook קורא exchangeCodeForSession שמשתמש ב-code_verifier שנשמר
 * ב-localStorage של ה-WebView על ידי signInWithOAuth.
 */
export function useNativeAuthCallback() {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        if (!Capacitor.isPluginAvailable('App')) return;

        let listenerHandle;
        (async () => {
            listenerHandle = await App.addListener('appUrlOpen', async ({ url }) => {
                if (!url || !url.startsWith(NATIVE_OAUTH_REDIRECT)) return;

                // PKCE flow: Supabase מחזיר ?code= ב-query params
                const queryStart = url.indexOf('?');
                if (queryStart !== -1) {
                    const params = new URLSearchParams(url.slice(queryStart));
                    const code = params.get('code');
                    if (code) {
                        await supabase.auth.exchangeCodeForSession(code);
                        return;
                    }
                }

                // Implicit flow fallback: tokens ב-fragment (#)
                const hashStart = url.indexOf('#');
                if (hashStart !== -1) {
                    const params = new URLSearchParams(url.slice(hashStart + 1));
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');
                    if (access_token && refresh_token) {
                        await supabase.auth.setSession({ access_token, refresh_token });
                    }
                }
            });
        })();

        return () => {
            listenerHandle?.remove();
        };
    }, []);
}
