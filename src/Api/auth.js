import { supabase } from './config';

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
 * Redirects the browser to Google; on return, supabase-js detects the session
 * from the URL and onAuthStateChange (SIGNED_IN) takes over in AppContext.
 * New users are created automatically by the `sync_user_from_auth` DB trigger
 * and routed to /onboarding to complete their profile.
 * @returns {Promise<Object>} OAuth response data (contains the provider URL)
 */
export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) throw error;
    return data;
}
