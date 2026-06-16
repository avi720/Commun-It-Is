import React, { useState } from 'react';
import { Building2, Plus, LogOut, Copy, Check, Crown, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';

/**
 * Multi-community management for the Settings page. Lists the user's
 * memberships, lets them join another community by invite code, switch the
 * active community, and leave one. The "active" badge shows which community
 * the rest of the app is scoped to right now (posts feed, phonebook, etc.).
 *
 * After any action that changes the active community, we invalidate every
 * community-scoped React Query cache so the next render fetches the new
 * community's data — and reload context user info so committee role flips
 * if applicable.
 */
export default function CommunitiesSection() {
    const { user, session, refresh } = useAppData();
    const qc = useQueryClient();
    const [inviteCode, setInviteCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['my-communities', user?.id],
        queryFn: () => avior.entities.communities.listMyMemberships(session),
        enabled: !!session && !!user?.id,
    });

    const communities = data?.communities || [];

    /** After active-community change, clear every per-community cache. */
    const invalidateCommunityScoped = () => {
        // posts/rides/phonebook/notifications all key on community_id; the
        // safest sweep is to remove anything whose first key segment matches.
        qc.invalidateQueries({ queryKey: ['posts'] });
        qc.invalidateQueries({ queryKey: ['rides'] });
        qc.invalidateQueries({ queryKey: ['contacts'] });
        qc.invalidateQueries({ queryKey: ['notifications'] });
        qc.invalidateQueries({ queryKey: ['my-communities'] });
    };

    const onJoin = async (e) => {
        e.preventDefault();
        const code = inviteCode.trim();
        if (!code) return;
        setBusy(true);
        try {
            const result = await avior.entities.communities.joinByCode(code, session);
            toast.success(`הצטרפת ל${result.community.name}`);
            setInviteCode('');
            await refetch();
            invalidateCommunityScoped();
            await refresh?.();
        } catch (err) {
            console.error(err);
            toast.error(err?.message || 'הצטרפות נכשלה');
        } finally {
            setBusy(false);
        }
    };

    const onSwitch = async (communityId, name) => {
        if (busy) return;
        setBusy(true);
        try {
            await avior.entities.communities.switchActive(communityId, session);
            toast.success(`עברת ל${name}`);
            await refetch();
            invalidateCommunityScoped();
            await refresh?.();
        } catch (err) {
            console.error(err);
            toast.error(err?.message || 'מעבר נכשל');
        } finally {
            setBusy(false);
        }
    };

    const onLeave = async (c) => {
        setBusy(true);
        try {
            await avior.entities.communities.leave(c.id, session);
            toast.success(`עזבת את ${c.name}`);
            setConfirmLeave(null);
            await refetch();
            invalidateCommunityScoped();
            await refresh?.();
        } catch (err) {
            console.error(err);
            toast.error(err?.message || 'יציאה נכשלה');
        } finally {
            setBusy(false);
        }
    };

    const onCopyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 1500);
        } catch {
            toast.error('העתקה נכשלה');
        }
    };

    return (
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-400" />
                הקהילות שלי
            </h2>

            {isLoading ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
                </div>
            ) : (
                <ul className="space-y-2">
                    {communities.map((c) => (
                        <li
                            key={c.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                c.is_active
                                    ? 'bg-teal-900/30 border-teal-700'
                                    : 'bg-slate-900/50 border-slate-800'
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-white text-sm">{c.name}</span>
                                    {c.role === 'committee' && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-amber-900/40 text-amber-200 px-2 py-0.5 rounded-full">
                                            <Crown className="w-3 h-3" />
                                            ועד
                                        </span>
                                    )}
                                    {c.is_active && (
                                        <span className="text-xs bg-teal-700/60 text-teal-100 px-2 py-0.5 rounded-full">
                                            פעילה
                                        </span>
                                    )}
                                </div>
                                {c.invite_code && (
                                    <button
                                        type="button"
                                        onClick={() => onCopyCode(c.invite_code)}
                                        className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-teal-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
                                        aria-label="העתק קוד הזמנה"
                                    >
                                        {copiedCode === c.invite_code ? (
                                            <Check className="w-3 h-3 text-teal-400" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                        קוד: {c.invite_code}
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {!c.is_active && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busy}
                                        onClick={() => onSwitch(c.id, c.name)}
                                        className="border-teal-700 text-teal-200 hover:bg-teal-900/40"
                                    >
                                        עבור
                                    </Button>
                                )}
                                {communities.length > 1 && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        disabled={busy}
                                        onClick={() => setConfirmLeave(c)}
                                        className="text-slate-400 hover:text-red-400"
                                        aria-label={`עזוב את ${c.name}`}
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={onJoin} className="pt-2 border-t border-slate-700 space-y-2">
                <label className="block text-sm text-slate-300">
                    הצטרפות לקהילה נוספת (קוד הזמנה)
                </label>
                <div className="flex gap-2">
                    <Input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="ABCD1234"
                        maxLength={32}
                        className="bg-slate-900 border-slate-700 text-white tracking-wider font-mono text-center"
                        disabled={busy}
                    />
                    <Button
                        type="submit"
                        disabled={busy || !inviteCode.trim()}
                        className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
                    >
                        <Plus className="w-4 h-4 ml-1" />
                        הצטרף
                    </Button>
                </div>
                <p className="text-xs text-slate-500">
                    קבל את הקוד ממנהל הקהילה. אחרי ההצטרפות, הקהילה החדשה תהפוך לפעילה.
                </p>
            </form>

            <ConfirmDialog
                open={!!confirmLeave}
                onOpenChange={(v) => !v && setConfirmLeave(null)}
                title="עזיבת קהילה"
                description={
                    confirmLeave
                        ? `האם לעזוב את "${confirmLeave.name}"? תפסיק לראות פוסטים, טרמפים ואת ספר הטלפונים של הקהילה הזו.`
                        : ''
                }
                confirmText="עזוב"
                confirmLabel="כן, עזוב"
                cancelLabel="ביטול"
                destructive
                onConfirm={() => confirmLeave && onLeave(confirmLeave)}
            />
        </section>
    );
}
