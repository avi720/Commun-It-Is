import { supabase } from './config';
import { Capacitor } from '@capacitor/core';

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
 * - Web: supabase-js עושה window.location.assign לזרימה הרגילה.
 * - Native (APK): supabase-js עושה window.location.assign — Capacitor מיירט
 *   את הניווט (domain חיצוני) ופותח את ה-URL ב-Chrome חיצוני. ה-redirectTo
 *   מכוון ל-deep link, כך שה-callback מחזיר את המשתמש לאפליקציה.
 *   ה-hook useNativeAuthCallback מטפל ב-appUrlOpen ומסיים את האימות.
 */
export async function signInWithGoogle() {
    const isNative = Capacitor.isNativePlatform();
    const redirectTo = isNative ? NATIVE_OAUTH_REDIRECT : window.location.origin;
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
    });
    if (error) throw error;
    return data;
}
