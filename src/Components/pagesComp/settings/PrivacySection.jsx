import React, { useState } from 'react';
import { Shield, Eye, Lock, Loader2 } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { toast } from 'sonner';
import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';

const VISIBILITY_OPTIONS = [
    { value: 'everyone', label: 'כל התושבים בקהילה' },
    { value: 'committee', label: 'רק חברי ועד' },
    { value: 'nobody', label: 'אף אחד' },
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

export default function PrivacySection() {
    const { user, session, updateUser } = useAppData();
    const [phoneVisible, setPhoneVisible] = useState(!!user?.visible_on_phonebook);
    const [addressVis, setAddressVis] = useState(user?.address_visibility || 'committee');
    const [pwdCurrent, setPwdCurrent] = useState('');
    const [pwdNext, setPwdNext] = useState('');
    const [pwdConfirm, setPwdConfirm] = useState('');
    const [pwdBusy, setPwdBusy] = useState(false);

    const persist = async (patch, optimisticReset) => {
        try {
            await avior.entities.User.update(user.id, patch, session);
            updateUser?.(patch);
        } catch (err) {
            console.error(err);
            toast.error('שגיאה בשמירת ההגדרה');
            optimisticReset?.();
        }
    };

    const onTogglePhone = (next) => {
        setPhoneVisible(next);
        persist({ visible_on_phonebook: next }, () => setPhoneVisible(!next));
    };

    const onChangeVisibility = (next) => {
        const prev = addressVis;
        setAddressVis(next);
        persist({ address_visibility: next }, () => setAddressVis(prev));
    };

    const onSubmitPassword = async (e) => {
        e.preventDefault();
        if (pwdNext !== pwdConfirm) {
            toast.error('הסיסמאות החדשות לא תואמות');
            return;
        }
        if (pwdNext.length < 8) {
            toast.error('סיסמה חייבת להיות באורך 8 תווים לפחות');
            return;
        }
        setPwdBusy(true);
        try {
            await avior.entities.User.changePassword(
                { current: pwdCurrent, next: pwdNext },
                session,
            );
            setPwdCurrent('');
            setPwdNext('');
            setPwdConfirm('');
            toast.success('הסיסמה עודכנה');
        } catch (err) {
            console.error(err);
            toast.error(err?.message || 'שינוי הסיסמה נכשל');
        } finally {
            setPwdBusy(false);
        }
    };

    return (
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                פרטיות ואבטחה
            </h2>

            {/* Phonebook visibility */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                    <span id="privacy-phone-label" className="text-sm font-medium text-white block">
                        הופעה בספר הטלפונים
                    </span>
                    <p className="text-xs text-slate-400">
                        אפשר לתושבים לראות את שמך ומספר הטלפון שלך
                    </p>
                </div>
                <Toggle checked={phoneVisible} onChange={onTogglePhone} labelId="privacy-phone-label" />
            </div>

            {/* Address visibility */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="space-y-1">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                        <Eye className="w-4 h-4" /> מי יכול לראות את הכתובת שלי
                    </span>
                    <p className="text-xs text-slate-400">
                        הסינון נאכף בצד השרת — כתובת מוסתרת לא נשלחת לדפדפן של הצופה
                    </p>
                </div>
                <div className="space-y-2">
                    {VISIBILITY_OPTIONS.map((opt) => (
                        <label
                            key={opt.value}
                            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-colors"
                        >
                            <input
                                type="radio"
                                name="address-visibility"
                                value={opt.value}
                                checked={addressVis === opt.value}
                                onChange={() => onChangeVisibility(opt.value)}
                                className="accent-teal-500 w-4 h-4"
                            />
                            <span className="text-sm text-slate-200">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Change password */}
            <form onSubmit={onSubmitPassword} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="space-y-1">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                        <Lock className="w-4 h-4" /> שינוי סיסמה
                    </span>
                </div>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-slate-300 text-xs">סיסמה נוכחית</Label>
                        <Input
                            type="password"
                            autoComplete="current-password"
                            value={pwdCurrent}
                            onChange={(e) => setPwdCurrent(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white text-left"
                            dir="ltr"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-slate-300 text-xs">סיסמה חדשה (לפחות 8 תווים)</Label>
                        <Input
                            type="password"
                            autoComplete="new-password"
                            value={pwdNext}
                            onChange={(e) => setPwdNext(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white text-left"
                            dir="ltr"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-slate-300 text-xs">אימות סיסמה חדשה</Label>
                        <Input
                            type="password"
                            autoComplete="new-password"
                            value={pwdConfirm}
                            onChange={(e) => setPwdConfirm(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white text-left"
                            dir="ltr"
                        />
                    </div>
                </div>
                <Button
                    type="submit"
                    disabled={pwdBusy || !pwdCurrent || !pwdNext}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white h-10"
                >
                    {pwdBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'עדכן סיסמה'}
                </Button>
            </form>
        </section>
    );
}
