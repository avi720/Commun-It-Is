import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/Api';
import { useAppData } from '@/context/AppContext';

/**
 * שומר מסלולי ועד. בעבר הסתמך רק על user.community_role מה-snapshot של
 * AppContext (שנטען פעם אחת בכניסה) — תושב שאיבד הרשאת ועד היה ממשיך לראות
 * את ה-UI עד התנתקות מלאה (TECH-DEBT T11).
 *
 * עכשיו: כל ניווט לדף ועד מבצע fetch קצר של ה-role הנוכחי מ-DB דרך React Query
 * עם staleTime:0. אם נחזר תפקיד אחר — מנתבים הביתה. ה-FastAPI side ממילא בודק
 * תפקיד חי, אבל הבדיקה הקליינטית הזו חוסכת מסך ריק במקום redirect מיידי.
 */
export default function CommitteeRoute({ children }) {
    const { user, session } = useAppData();

    const { data: role, isLoading } = useQuery({
        queryKey: ['me', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('community_role')
                .eq('id', user.id)
                .single();
            if (error) throw error;
            return data?.community_role;
        },
        enabled: !!user?.id && !!session,
        staleTime: 0,
        refetchOnMount: 'always',
    });

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    // כל עוד אין תוצאה — לא מציגים את התוכן (גם לא flash של הדף הסגור).
    // אם אין user עדיין, מסתמכים על ProtectedRoute שמעליה.
    if (isLoading && !role) {
        return null;
    }

    const effectiveRole = role ?? user?.community_role;
    if (effectiveRole !== 'committee') {
        return <Navigate to="/" replace />;
    }

    return children;
}
