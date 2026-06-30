import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/Api';
import { NATIVE_DEEP_LINK } from '@/Api/auth';

// HTTPS App Link — Android יורה כאשר Supabase מפנה ל-callback URL
const HTTPS_CALLBACK_PREFIX = 'https://commun-it-is.vercel.app/api/auth/native-callback';

function isAuthCallbackUrl(url) {
    return url && (
        url.startsWith(NATIVE_DEEP_LINK) ||
        url.startsWith(HTTPS_CALLBACK_PREFIX)
    );
}

export function useNativeAuthCallback() {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        if (!Capacitor.isPluginAvailable('App')) return;

        let listenerHandle;
        (async () => {
            listenerHandle = await App.addListener('appUrlOpen', async ({ url }) => {
                if (!isAuthCallbackUrl(url)) return;
                console.log('[OAuth] Deep link received:', url);

                if (Capacitor.isPluginAvailable('Browser')) {
                    try { await Browser.close(); } catch { /* ignore */ }
                }

                // PKCE: ?code=
                const queryStart = url.indexOf('?');
                if (queryStart !== -1) {
                    const params = new URLSearchParams(url.slice(queryStart));
                    const code = params.get('code');
                    if (code) {
                        const { error } = await supabase.auth.exchangeCodeForSession(code);
                        if (error) console.error('[OAuth] exchangeCodeForSession failed:', error);
                        else console.log('[OAuth] Session established (PKCE)');
                        return;
                    }
                }

                // Implicit: #access_token=&refresh_token=
                const hashStart = url.indexOf('#');
                if (hashStart !== -1) {
                    const params = new URLSearchParams(url.slice(hashStart + 1));
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');
                    if (access_token && refresh_token) {
                        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                        if (error) console.error('[OAuth] setSession failed:', error);
                        else console.log('[OAuth] Session established (implicit)');
                    }
                }
            });
        })();

        return () => {
            listenerHandle?.remove();
        };
    }, []);
}
