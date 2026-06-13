import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppData } from '../context/useAppData';
import { avior } from '../Api';
import { Calendar, User, AlertTriangle, Bell, BellRing } from 'lucide-react';

export default function NotificationsHistory() {
    const { user } = useAppData();

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['notifications', user?.community_id],
        queryFn: () => avior.notifications.getHistory(user.community_id),
        enabled: !!user?.community_id,
    });

    if (isLoading) return <div className="p-8 text-center text-slate-400">טוען הודעות...</div>;

    return (
        <div className="min-h-full pb-20 p-4 max-w-3xl mx-auto">
            <header className="mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-white">לוח הודעות</h1>
                    <p className="text-sm text-slate-400">עדכונים והודעות מוועד הקהילה</p>
                </div>
            </header>

            {messages.length === 0 ? (
                <div className="max-w-md mx-auto bg-slate-800/50 border border-slate-800 rounded-xl py-12 px-6 text-center">
                    <Bell className="w-16 h-16 text-slate-500 mx-auto mb-4" aria-hidden="true" />
                    <h3 className="text-xl md:text-2xl font-semibold text-slate-200 mb-3">עדיין שקט בקהילה</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        כשהוועד או חברי הקהילה יפרסמו עדכון או הודעה חשובה, היא תופיע כאן.
                    </p>
                    <p className="text-slate-400 text-sm inline-flex items-center gap-2 justify-center">
                        <BellRing className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                        <span>אתה יכול לאפשר התראות בהגדרות הדפדפן/האפליקציה כדי לא לפספס עדכונים.</span>
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`
                                relative overflow-hidden rounded-xl border p-4 transition-all
                                ${msg.is_emergency
                                    ? 'bg-red-950/30 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                    : 'bg-slate-800 border-slate-700 shadow-sm'}
                            `}
                        >
                            <div className={`absolute top-0 right-0 bottom-0 w-1 ${msg.is_emergency ? 'bg-red-500' : 'bg-teal-500'}`} />

                            <div className="flex justify-between items-start mb-2 pr-3">
                                <h3 className={`font-bold text-lg ${msg.is_emergency ? 'text-red-400' : 'text-white'}`}>
                                    {msg.is_emergency && <AlertTriangle className="w-4 h-4 inline-block ml-2 mb-1" />}
                                    {msg.title}
                                </h3>
                                <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded-full">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(msg.created_at).toLocaleDateString('he-IL')}
                                </span>
                            </div>

                            <p className="text-slate-300 pr-3 text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.body}
                            </p>

                            <div className="mt-4 pr-3 flex items-center gap-2 text-xs text-slate-500 border-t border-white/5 pt-3">
                                <User className="w-3 h-3" />
                                <span>נשלח על ידי: {msg.sender_name || 'ועד הקהילה'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
