import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { avior } from '@/Api/Client';

// לוגו Google רשמי (SVG) — אין אייקון מותג ב-lucide
function GoogleLogo({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
    );
}

/**
 * כפתור התחברות/הרשמה דרך Google.
 * מפעיל את זרימת ה-OAuth של Supabase; הדפדפן עובר ל-Google ובחזרה
 * supabase-js מזהה את ה-session ו-AppContext ממשיך משם.
 */
export default function GoogleSignInButton({ label = 'המשך עם Google' }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleClick = async () => {
        setLoading(true);
        setError('');
        try {
            await avior.auth.signInWithGoogle();
            // בהצלחה הדפדפן מנותב ל-Google, אז לא נגיע לכאן בדרך כלל
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError('שגיאה בהתחברות דרך Google');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={handleClick}
                disabled={loading}
                className="w-full bg-white hover:bg-slate-100 text-slate-800 p-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <GoogleLogo className="w-5 h-5" />
                )}
                {label}
            </button>
            {error && (
                <p className="text-red-400 text-sm text-center font-medium bg-red-900/20 p-2 rounded">
                    {error}
                </p>
            )}
        </div>
    );
}
