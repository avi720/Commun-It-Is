import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';

/**
 * מודאל "שלח הודעה לכל הקהילה". מציג טופס כותרת+גוף, ולפני שליחה דורש אישור
 * דרך ConfirmDialog (החליף את window.confirm). השליחה מבטלת cache של
 * notifications כדי שההיסטוריה של הקהילה תרוענן מיד.
 */
export default function SendCommitteeMessageModal({ open, onClose, communityId }) {
    const { session } = useAppData();
    const queryClient = useQueryClient();
    const [data, setData] = useState({ title: '', body: '' });
    const [confirmOpen, setConfirmOpen] = useState(false);

    const sendMutation = useMutation({
        mutationFn: async ({ title, body }) => {
            return await avior.notifications.sendToCommunity(
                title,
                body,
                communityId,
                'ועד הקהילה',
                session
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', communityId] });
            toast.success('ההודעה נשלחה בהצלחה! 🚀');
            setData({ title: '', body: '' });
            onClose();
        },
        onError: (e) => {
            console.error('sendToCommunity failed', e);
            toast.error('שגיאה בשליחה');
        },
    });

    const handleSendClick = () => {
        if (!data.title || !data.body) {
            toast.error('חובה למלא כותרת ותוכן');
            return;
        }
        setConfirmOpen(true);
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">שליחת הודעה לקהילה</h3>
                    <input
                        className="w-full bg-slate-800 text-white p-3 rounded mb-3 border border-slate-700"
                        placeholder="כותרת ההודעה"
                        value={data.title}
                        onChange={e => setData({ ...data, title: e.target.value })}
                    />
                    <textarea
                        className="w-full bg-slate-800 text-white p-3 rounded mb-4 h-32 border border-slate-700"
                        placeholder="תוכן ההודעה..."
                        value={data.body}
                        onChange={e => setData({ ...data, body: e.target.value })}
                    />
                    <div className="flex gap-3 justify-end">
                        <button onClick={onClose} className="text-gray-400">
                            ביטול
                        </button>
                        <button
                            onClick={handleSendClick}
                            disabled={sendMutation.isPending}
                            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-6 py-2 rounded"
                        >
                            {sendMutation.isPending ? 'שולח…' : 'שלח'}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="שליחה לכל חברי הקהילה"
                description="ההודעה תישלח כ-Push notification לכל מי שהפעיל את האפליקציה. להמשיך?"
                confirmLabel="שלח"
                cancelLabel="לא, תחזור לעריכה"
                onConfirm={() => {
                    setConfirmOpen(false);
                    sendMutation.mutate(data);
                }}
            />
        </>
    );
}
