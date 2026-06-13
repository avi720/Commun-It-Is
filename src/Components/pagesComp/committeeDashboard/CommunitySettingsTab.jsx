import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/Components/ui/input";
import { supabase } from '@/Api';

/**
 * טאב הגדרות קהילה. כרגע readonly — שם הקהילה מוצג ב-input מושבת. עתידי:
 * שינוי שם, ניהול שעות קבלת קהל, וכו'. כשנוסיף mutations — קל להוסיף אותן כאן.
 */
export default function CommunitySettingsTab({ communityId }) {
    const { data: community, isLoading } = useQuery({
        queryKey: ['community', communityId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .eq('id', communityId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!communityId,
    });

    if (isLoading) {
        return <div className="text-center p-10 text-slate-400">טוען הגדרות…</div>;
    }

    return (
        <div className="space-y-4 px-2">
            <h2 className="text-lg font-semibold text-slate-300">הגדרות הקהילה</h2>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <label className="block text-sm text-slate-400 mb-1">שם הקהילה</label>
                <Input
                    type="text"
                    disabled
                    value={community?.name || ''}
                    className="bg-slate-900 border-slate-700 rounded-lg text-white"
                />
                <p className="text-xs text-slate-400 mt-2">
                    * כרגע לא ניתן לשנות שם קהילה באופן עצמאי.
                </p>
            </div>
        </div>
    );
}
