import { supabase } from './config';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// ה-deep link שאליו Supabase יחזיר את ה-tokens אחרי אימות Google ב-Custom Tab.
// המחרוזת חייבת להיות זהה ב-3 מקומות: כאן, ב-AndroidManifest.xml (intent-filter),
// וברשימת Redirect URLs ב-Supabase Dashboard.
export const NATIVE_OAUTH_REDIRECT = 'com.CommunItIs.myapp://login-callback';

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Sign up response data
 */
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

/**
 * Login an existing user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login response data
 */
export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

/**
 * Start the Google OAuth login/sign-up flow.
 * - Web: ה-supabase-js עושה window.location redirect לזרימה הרגילה.
 * - Native (APK): פותחים את עמוד הבחירה של Google ב-Chrome Custom Tab,
 *   ו-Supabase מחזיר את ה-tokens ל-deep link `com.CommunItIs.myapp://login-callback`.
 *   המאזין ב-App.jsx (appUrlOpen) קולט את ה-URL, קורא ל-setSession ו-Browser.close().
 * @returns {Promise<Object>} OAuth response data
 */
export async function signInWithGoogle() {
    const isNative = Capacitor.isNativePlatform();
    const redirectTo = isNative ? NATIVE_OAUTH_REDIRECT : window.location.origin;
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo,
            // ב-native אנחנו לא רוצים ש-supabase-js יעשה window.location.href —
            // זה דוחף את האימות ל-Chrome חיצוני ושובר את הזרימה. במקום זה
            // נפתח בעצמנו ב-Chrome Custom Tab דרך @capacitor/browser.
            skipBrowserRedirect: isNative,
        },
    });
    if (error) throw error;
    if (isNative && data?.url) {
        await Browser.open({ url: data.url, presentationStyle: 'popover' });
    }
    return data;
}
