import React, { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';
import { usePushPermission } from '@/Components/hooks/usePushPermission';

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

function Toggle({ checked, onChange, labelId, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={!!checked}
            aria-labelledby={labelId}
            aria-disabled={disabled || undefined}
            onClick={() => !disabled && onChange(!checked)}
            className={`relative inline-block h-6 w-12 shrink-0 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} ${checked && !disabled ? 'bg-teal-600' : 'bg-slate-600'}`}
        >
            <span
                aria-hidden="true"
                style={{ right: checked && !disabled ? '2px' : '24px' }}
                className="pointer-events-none absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-all duration-300"
            />
        </button>
    );
}

function PermissionBanner({ permission, onRequest }) {
    if (permission === 'denied') {
        return (
            <div className="flex items-start gap-3 rounded-xl bg-amber-900/30 border border-amber-800/50 p-4">
                <BellOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-200">
                        ההתראות חסומות במכשיר
                    </p>
                    <p className="text-xs text-slate-400">
                        כדי לקבל התראות, יש לאשר אותן בהגדרות המכשיר עבור האפליקציה.
                    </p>
                </div>
            </div>
        );
    }

    if (permission === 'prompt') {
        return (
            <div className="flex items-start gap-3 rounded-xl bg-teal-900/30 border border-teal-800/50 p-4">
                <Bell className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                    <p className="text-sm font-medium text-teal-200">
                        ההתראות לא הופעלו עדיין
                    </p>
                    <button
                        type="button"
                        onClick={onRequest}
                        className="text-xs font-semibold text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
                    >
                        הפעל התראות
                    </button>
                </div>
            </div>
        );
    }

    if (permission === 'unsupported') {
        return (
            <div className="flex items-start gap-3 rounded-xl bg-slate-700/40 border border-slate-600/50 p-4">
                <BellOff className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-400">
                    התראות זמינות רק באפליקציה לאנדרואיד.
                </p>
            </div>
        );
    }

    return null;
}

export default function NotificationsSection() {
    const { user, session, updateUser } = useAppData();
    const { permission, requestPermission } = usePushPermission();

    const isDisabled = permission !== 'granted';

    const initial = TOGGLES.reduce((acc, t) => {
        acc[t.key] = user?.[t.key] !== false;
        return acc;
    }, {});
    const [state, setState] = useState(initial);

    const handle = (key) => async (next) => {
        if (isDisabled) {
            if (permission === 'prompt') {
                const granted = await requestPermission();
                if (!granted) {
                    toast.error('לא ניתן להפעיל התראות ללא הרשאה');
                    return;
                }
            } else {
                toast.error('יש לאשר התראות בהגדרות המכשיר');
                return;
            }
        }

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

    const handleRequestPermission = async () => {
        const granted = await requestPermission();
        if (granted) {
            toast.success('התראות הופעלו בהצלחה');
        } else {
            toast.error('לא ניתן להפעיל התראות — יש לאשר בהגדרות המכשיר');
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

            <PermissionBanner permission={permission} onRequest={handleRequestPermission} />

            <div className="divide-y divide-slate-700/60">
                {TOGGLES.map((t) => {
                    const labelId = `notif-${t.key}`;
                    return (
                        <div key={t.key} className={`flex items-center justify-between py-3 ${isDisabled ? 'opacity-50' : ''}`}>
                            <div className="space-y-0.5 flex-1 min-w-0 pl-4">
                                <span id={labelId} className="text-sm font-medium text-white block">
                                    {t.label}
                                </span>
                                <p className="text-xs text-slate-400">{t.hint}</p>
                            </div>
                            <Toggle checked={state[t.key]} onChange={handle(t.key)} labelId={labelId} disabled={isDisabled} />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
