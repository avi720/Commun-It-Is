import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/Api';

/**
 * טאב תושבים. שולף את כל תושבי הקהילה (מסודר מהחדש לישן), מאפשר לוועד לאשר/לבטל
 * סטטוס תושב, ומסנן לפי "הכל / ממתינים לאישור / מאושרים".
 *
 * Optimistic updates: עדכון סטטוס מתבצע מקומית ב-cache עוד לפני שהשרת מאשר. אם
 * השרת נכשל, ה-state חוזר אחורה דרך onError + invalidate.
 */
export default function ResidentsTab({ communityId }) {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('all'); // 'all' | 'verified' | 'unverified'

    const { data: residents = [], isLoading } = useQuery({
        queryKey: ['residents', communityId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('community_id', communityId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!communityId,
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, newStatus }) => {
            const { error } = await supabase
                .from('users')
                .update({ is_verified_as_resident: newStatus })
                .eq('id', id);
            if (error) throw error;
            return { id, newStatus };
        },
        onMutate: async ({ id, newStatus }) => {
            // Optimistic update — מעדכן מיידית את ה-cache
            await queryClient.cancelQueries({ queryKey: ['residents', communityId] });
            const prev = queryClient.getQueryData(['residents', communityId]);
            queryClient.setQueryData(['residents', communityId], (old = []) =>
                old.map(r => (r.id === id ? { ...r, is_verified_as_resident: newStatus } : r))
            );
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            console.error('toggleResidentStatus failed', err);
            if (ctx?.prev) queryClient.setQueryData(['residents', communityId], ctx.prev);
            toast.error('אירעה שגיאה בעדכון הסטטוס');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['residents', communityId] });
        },
    });

    const filtered = residents.filter(r => {
        if (filter === 'verified') return r.is_verified_as_resident;
        if (filter === 'unverified') return !r.is_verified_as_resident;
        return true;
    });

    if (isLoading) {
        return <div className="text-center p-10 text-slate-400">טוען תושבים…</div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4">
                <h2 className="text-lg font-semibold text-slate-300">
                    תושבי הקהילה ({filtered.length})
                </h2>
                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="הכל" />
                    <FilterButton
                        active={filter === 'unverified'}
                        onClick={() => setFilter('unverified')}
                        label="ממתינים לאישור"
                        alert={residents.some(r => !r.is_verified_as_resident)}
                    />
                    <FilterButton active={filter === 'verified'} onClick={() => setFilter('verified')} label="מאושרים" />
                </div>
            </div>

            <div className="w-full overflow-x-auto bg-slate-800 rounded-xl border border-slate-700 shadow-sm mx-auto max-w-[98%]">
                <table className="min-w-max w-full text-sm text-right text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
                        <tr>
                            <th className="px-4 py-3 font-semibold">סטטוס (לחץ לשינוי)</th>
                            <th className="px-4 py-3 font-semibold">שם מלא</th>
                            <th className="px-4 py-3 font-semibold">גיל</th>
                            <th className="px-4 py-3 font-semibold">כתובת</th>
                            <th className="px-4 py-3 font-semibold">יצירת קשר</th>
                            <th className="px-4 py-3 font-semibold">תפקיד</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filtered.map(resident => (
                            <tr key={resident.id} className="hover:bg-slate-700/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <button
                                        onClick={() =>
                                            toggleMutation.mutate({
                                                id: resident.id,
                                                newStatus: !resident.is_verified_as_resident,
                                            })
                                        }
                                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                                            resident.is_verified_as_resident
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                        }`}
                                    >
                                        {resident.is_verified_as_resident ? (
                                            <>
                                                <Check className="w-3 h-3" /> מאושר
                                            </>
                                        ) : (
                                            <>
                                                <X className="w-3 h-3" /> לא מאושר
                                            </>
                                        )}
                                    </button>
                                </td>
                                <td className="px-4 py-3 font-medium text-white">
                                    {resident.firstName} {resident.lastName}
                                </td>
                                <td className="px-4 py-3 font-medium text-white">{resident.age}</td>
                                <td className="px-4 py-3 text-white">
                                    <div className="font-medium">{resident.city}</div>
                                    <div className="text-xs">{resident.address}</div>
                                </td>
                                <td className="px-4 py-3" dir="ltr">
                                    <div className="text-xs">{resident.phone}</div>
                                    <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{resident.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                    {resident.community_role === 'committee' ? (
                                        <span className="text-amber-500 text-xs font-bold border border-amber-500/20 px-2 py-0.5 rounded-full bg-amber-500/10">
                                            ועד
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-xs">תושב</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="p-12 text-center text-slate-400">לא נמצאו תושבים בקטגוריה זו</div>
                )}
            </div>
        </div>
    );
}

function FilterButton({ active, onClick, label, alert }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
                active ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
        >
            {label}
            {alert && !active && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
        </button>
    );
}
