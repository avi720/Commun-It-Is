import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';

const TOGGLES = [
    {
        key: 'notify_posts',
        label: 'פוסטים חדשים בקהילה',
        hint: 'כשמישהו בקהילה מפרסם פוסט',
    },
    {
        key: 'notify_committee_posts',
        label: 'פוסטים של הוועד',
        hint: 'פוסטים מסומנים כהודעת ועד',
    },
    {
        key: 'notify_ride_offers',
        label: 'הצעות טרמפ חדשות',
        hint: 'כשמישהו מציע טרמפ בקהילה',
    },
    {
        key: 'notify_ride_requests',
        label: 'בקשות טרמפ',
        hint: 'כשמישהו מחפש טרמפ בקהילה',
    },
];

function Toggle({ checked, onChange, labelId }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={!!checked}
            aria-labelledby={labelId}
            onClick={() => onChange(!checked)}
            className={`relative inline-block h-6 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${checked ? 'bg-teal-600' : 'bg-slate-600'}`}
        >
            <span
                aria-hidden="true"
                style={{ right: checked ? '2px' : '24px' }}
                className="pointer-events-none absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-all duration-300"
            />
        </button>
    );
}

export default function NotificationsSection() {
    const { user, session, updateUser } = useAppData();
    // Server defaults all four to true. Treat undefined as true so a user
    // who hasn't touched the toggles still appears "on" on first load.
    const initial = TOGGLES.reduce((acc, t) => {
        acc[t.key] = user?.[t.key] !== false;
        return acc;
    }, {});
    const [state, setState] = useState(initial);

    const handle = (key) => async (next) => {
        const prev = state[key];
        setState((s) => ({ ...s, [key]: next }));
        try {
            await avior.entities.User.update(user.id, { [key]: next }, session);
            updateUser?.({ [key]: next });
        } catch (err) {
            console.error(err);
            toast.error('שגיאה בשמירת ההגדרה');
            setState((s) => ({ ...s, [key]: prev }));
        }
    };

    return (
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-400" />
                התראות
            </h2>
            <p className="text-xs text-slate-400 -mt-2">
                בחר אילו סוגי התראות תרצה לקבל. השינוי תקף מיד.
            </p>

            <div className="divide-y divide-slate-700/60">
                {TOGGLES.map((t) => {
                    const labelId = `notif-${t.key}`;
                    return (
                        <div key={t.key} className="flex items-center justify-between py-3">
                            <div className="space-y-0.5 flex-1 min-w-0 pl-4">
                                <span id={labelId} className="text-sm font-medium text-white block">
                                    {t.label}
                                </span>
                                <p className="text-xs text-slate-400">{t.hint}</p>
                            </div>
                            <Toggle checked={state[t.key]} onChange={handle(t.key)} labelId={labelId} />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
