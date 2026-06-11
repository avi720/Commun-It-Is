import React, { useState } from 'react';
import { User, MapPin, Phone, Save, Loader2 } from 'lucide-react';
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { toast } from 'sonner';
import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';

export default function ProfileForm({ user, onSave }) {
    const { session } = useAppData();
    // State מקומי לטופס כדי לא לשנות את הגלובלי בכל הקלדה.
    // user יציב ב-mount (ProtectedRoute מבטיח שהוא נטען) — ולכן lazy init
    // מספיק במקום useEffect של "סנכרון כשהוא משתנה".
    const [formData, setFormData] = useState(() => ({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        city: user?.city || '',
        address: user?.address || '',
        visible_on_phonebook: user?.visible_on_phonebook || false,
    }));
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // 1. שליחה לשרת (חובה להעביר את ה-user.id!)
            await avior.entities.User.update(user.id, formData, session);

            // 2. עדכון מקומי (UI)
            onSave(formData);

        } catch (error) {
            console.error("Update failed:", error);
            toast.error("שגיאה בעדכון הפרטים");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-teal-400" />
                פרטים אישיים
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-slate-300">שם פרטי</Label>
                    <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-slate-300">שם משפחה</Label>
                    <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> טלפון
                </Label>
                <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white text-left"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                />
            </div>

            <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> כתובת הבית
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300">יישוב</Label>
                        <Input
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="למשל: תל אביב"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">רחוב ומספר</Label>
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="למשל: הרצל 15"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between mt-4">
                <div className="space-y-1">
                    <span id="phonebook-visibility-label" className="text-sm font-medium text-white block">
                        הופעה בספר הטלפונים
                    </span>
                    <p className="text-xs text-slate-400">
                        אפשר לתושבים לראות את שמך ומספר הטלפון שלך
                    </p>
                </div>

                <button
                    type="button"
                    role="switch"
                    aria-checked={!!formData.visible_on_phonebook}
                    aria-labelledby="phonebook-visibility-label"
                    onClick={() => setFormData({ ...formData, visible_on_phonebook: !formData.visible_on_phonebook })}
                    className={`relative inline-block h-6 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${formData.visible_on_phonebook ? 'bg-teal-600' : 'bg-slate-600'}`}
                >
                    <span
                        aria-hidden="true"
                        style={{ right: formData.visible_on_phonebook ? '2px' : '24px' }}
                        className="pointer-events-none absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-all duration-300"
                    />
                </button>
            </div>
            <div className="pt-2">
                <Button type="submit" disabled={isSaving} className="w-full bg-teal-700 hover:bg-teal-800 text-white h-11">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    שמור שינויים
                </Button>
            </div>
        </form>
    );
}