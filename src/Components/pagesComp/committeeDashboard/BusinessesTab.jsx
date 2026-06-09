import React from 'react';
import { Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/Api';

/**
 * טאב עסקים בדשבורד הוועד. אחראי על שליפת רשימת העסקים בקהילה ועל אישור עסק.
 * המפתחות עוקבים אחר אמנת cache-keys ב-docs/ARCHITECTURE.md.
 */
export default function BusinessesTab({ communityId, onCountChange }) {
    const queryClient = useQueryClient();

    const { data: businesses = [], isLoading } = useQuery({
        queryKey: ['businesses', communityId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('community_id', communityId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!communityId,
    });

    // מעדכן ספירה ב-shell כדי שכותרת הטאב תציג את המספר העדכני
    React.useEffect(() => {
        onCountChange?.(businesses.length);
    }, [businesses.length, onCountChange]);

    const approveMutation = useMutation({
        mutationFn: async (businessId) => {
            const { error } = await supabase
                .from('businesses')
                .update({ is_verified_by_committee: true })
                .eq('id', businessId);
            if (error) throw error;
            return businessId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses', communityId] });
            toast.success('העסק אושר בהצלחה!');
        },
        onError: (e) => {
            console.error('approveBusiness failed', e);
            toast.error('אישור העסק נכשל');
        },
    });

    if (isLoading) {
        return <div className="text-center p-10 text-slate-400">טוען עסקים…</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-300 px-2">עסקי הקהילה</h2>
            {businesses.length === 0 ? (
                <div className="p-6 bg-slate-800 rounded-xl text-center text-slate-400 mx-2">
                    אין עסקים בקהילה.
                </div>
            ) : (
                businesses.map(business => (
                    <div
                        key={business.id}
                        className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center mx-2"
                    >
                        <div>
                            <h3 className="font-bold text-lg">{business.name}</h3>
                            <p className="text-sm text-slate-400">
                                {business.category} • {business.phone}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{business.description}</p>
                        </div>
                        <button
                            onClick={() => approveMutation.mutate(business.id)}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-2 rounded-full shadow-lg"
                            aria-label="אשר עסק"
                        >
                            <Check className="w-6 h-6" />
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}
