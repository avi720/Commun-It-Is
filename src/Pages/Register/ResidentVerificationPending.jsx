import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../../Api';
import { useAppData } from '../../context/useAppData';

/**
 * מסך המתנה לאישור תושב ע"י הועד המקומי.
 * - מציג הודעת המתנה.
 * - מאזין בזמן אמת (Supabase Realtime) לשינוי ב-is_verified_as_resident:
 *   ברגע שהועד מאשר את התושב ב-DB, מתבצע רענון אוטומטי של הסשן.
 * - כפתור רענון ידני, למקרה שהדפדפן/אפליקציה נשארו פתוחים.
 */
export default function ResidentVerificationPending() {
    const { user, refresh } = useAppData();
    const navigate = useNavigate();
    const [refreshing, setRefreshing] = useState(false);

    // אם המשתמש כבר אושר -> ניווט הביתה
    useEffect(() => {
        if (user && user.is_verified_as_resident !== false) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    // האזנה בזמן אמת: כשהועד מאשר את התושב ב-DB, נרענן אוטומטית את הסשן
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel(`resident-verification-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.new?.is_verified_as_resident) {
                        refresh();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, refresh]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await refresh();
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md bg-slate-900 border border-teal-500/40 rounded-2xl shadow-2xl p-8 text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-teal-500/15 rounded-full flex items-center justify-center border-2 border-teal-500/60">
                    <Clock className="w-10 h-10 text-teal-400" />
                </div>

                <h1 className="text-2xl font-bold text-white">כמעט שם!</h1>

                <p className="text-teal-300 text-lg leading-relaxed">
                    הפרטים שלך נשלחו לבדיקה של הועד המקומי. תודה על הסבלנות!
                </p>

                <p className="text-slate-400 text-sm">
                    המסך יתעדכן אוטומטית ברגע שהבקשה תאושר. אפשר גם לרענן ידנית:
                </p>

                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white p-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 min-h-[44px]"
                >
                    {refreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    רענן סטטוס
                </button>
            </div>
        </div>
    );
}
