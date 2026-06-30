import { supabase } from './config';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export const NATIVE_DEEP_LINK = 'com.CommunItIs.myapp://login-callback';
const NATIVE_CALLBACK_URL = `${window.location.origin}/api/auth/native-callback`;

export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/verification-success`
        }
    });
    if (error) throw error;
    return data;
}

export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

export async function signInWithGoogle() {
    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
        return data;
    }

    // Supabase's /auth/v1/authorize sends "Content-Security-Policy: sandbox"
    // on its 302, which causes Chrome on Android to blank out Google's
    // sign-in page.  Workaround: get the authorize URL without navigating,
    // extract Google's URL via a server-side proxy, then open Google in a
    // Chrome Custom Tab.
    // redirectTo points to our /api/auth/native-callback, an HTTPS page that
    // reads code/access_token client-side and deep-links back into the app.
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: NATIVE_CALLBACK_URL,
            skipBrowserRedirect: true,
        },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned');

    console.log('[OAuth] Supabase authorize URL:', data.url);

    const res = await fetch(`/api/auth/oauth-redirect?url=${encodeURIComponent(data.url)}`);
    const body = await res.json();

    if (!res.ok || body.error || !body.url) {
        console.error('[OAuth] Proxy error:', body);
        throw new Error(body.error || 'Failed to get Google OAuth URL');
    }

    console.log('[OAuth] Opening Custom Tab:', body.url);
    await Browser.open({ url: body.url, presentationStyle: 'popover' });

    return data;
}
