import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// Create and export Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// API base URL
// ניתן להגדיר VITE_API_URL במשתני הסביבה. אם לא הוגדר, נשתמש בנתיב היחסי "/api"
// שעובד אוטומטית כשה-backend מתארח באותו פרויקט Vercel (ללא בעיות CORS).
export const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Helper function to create headers with Authorization token if session is provided
 * @param {Object|null} session - Supabase session object with access_token
 * @returns {Object} Headers object with Content-Type and optional Authorization
 */
export function getAuthHeaders(session = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
}

/**
 * Headers for multipart/form-data requests (file uploads).
 * IMPORTANT: do NOT set Content-Type here — the browser must set it
 * automatically together with the multipart boundary. We only attach
 * the Authorization token.
 * @param {Object|null} session - Supabase session object with access_token
 * @returns {Object} Headers object with optional Authorization only
 */
export function getAuthHeadersMultipart(session = null) {
    const headers = {};

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
}
