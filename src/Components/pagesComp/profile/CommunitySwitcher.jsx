import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';

/**
 * Compact community switcher for the Profile page. Shows the user's
 * memberships as chips; the active one is teal, the rest are muted slate.
 * Clicking a muted chip switches the active community and triggers a
 * silent refresh of the user (so the header's role badge updates) plus
 * invalidates every community-scoped React Query cache.
 *
 * If the user belongs to only one community, the switcher collapses into
 * a single label (no point showing a "+" CTA in the row — that's in
 * Settings under "הקהילות שלי").
 */
export default function CommunitySwitcher() {
    const { session, refresh } = useAppData();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [busy, setBusy] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['my-communities'],
        queryFn: () => avior.entities.communities.listMyMemberships(session),
        enabled: !!session,
    });

    const communities = data?.communities || [];

    if (isLoading || communities.length === 0) return null;

    const onSwitch = async (c) => {
        if (busy || c.is_active) return;
        setBusy(true);
        try {
            await avior.entities.communities.switchActive(c.id, session);
            toast.success(`עברת ל${c.name}`);
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.invalidateQueries({ queryKey: ['rides'] });
            qc.invalidateQueries({ queryKey: ['contacts'] });
            qc.invalidateQueries({ queryKey: ['notifications'] });
            qc.invalidateQueries({ queryKey: ['profile-posts'] });
            qc.invalidateQueries({ queryKey: ['profile-rides'] });
            qc.invalidateQueries({ queryKey: ['my-communities'] });
            await refresh?.();
        } catch (err) {
            console.error(err);
            toast.error(err?.message || 'מעבר נכשל');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap" aria-label="הקהילות שלי">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            {communities.map((c) => (
                <button
                    key={c.id}
                    type="button"
                    onClick={() => onSwitch(c)}
                    disabled={busy || c.is_active}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                        c.is_active
                            ? 'bg-teal-600/30 text-teal-100 border-teal-500/60 cursor-default'
                            : 'bg-slate-900/40 text-slate-300 border-slate-700 hover:bg-slate-700/60 hover:text-white'
                    }`}
                    aria-current={c.is_active ? 'true' : undefined}
                >
                    {c.name}
                </button>
            ))}
            <button
                type="button"
                onClick={() => navigate('/settings')}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-slate-700 text-slate-400 hover:text-teal-300 hover:border-teal-700 transition-colors"
                aria-label="הצטרפות לקהילה נוספת"
            >
                <Plus className="w-3 h-3" />
                הוסף
            </button>
        </div>
    );
}
