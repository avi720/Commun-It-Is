import React, { useRef, useState } from 'react';
import { User, MapPin, Phone, Save, Loader2, Camera, Trash2 } from 'lucide-react';
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { toast } from 'sonner';
import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';

export default function ProfileForm({ user, onSave }) {
    const { session, updateUser } = useAppData();
    // State מקומי לטופס כדי לא לשנות את הגלובלי בכל הקלדה.
    // user יציב ב-mount (ProtectedRoute מבטיח שהוא נטען) — ולכן lazy init
    // מספיק במקום useEffect של "סנכרון כשהוא משתנה".
    const [formData, setFormData] = useState(() => ({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        city: user?.city || '',
        address: user?.address || '',
        bio: user?.bio || '',
    }));
    const [isSaving, setIsSaving] = useState(false);
    // Avatar state — separate from formData because uploads go through
    // their own pipeline (direct to Storage) and persist immediately,
    // not on "Save". We track avatar_url locally so the preview updates
    // without waiting for a context refresh.
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
    const [isAvatarBusy, setIsAvatarBusy] = useState(false);
    const fileInputRef = useRef(null);

    const initials = `${(user?.firstName || '?')[0] || ''}${(user?.lastName || '')[0] || ''}`.toUpperCase();

    const handleAvatarFile = async (e) => {
        const file = e.target.files?.[0];
        // Reset the input so re-picking the same file fires onChange again
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('יש לבחור קובץ תמונה');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('הקובץ גדול מדי (מקסימום 5MB)');
            return;
        }
        setIsAvatarBusy(true);
        try {
            const { avatar_url } = await avior.entities.User.uploadAvatar(file, session);
            setAvatarUrl(avatar_url);
            updateUser?.({ avatar_url });
            toast.success('תמונת הפרופיל עודכנה');
        } catch (err) {
            console.error(err);
            toast.error('העלאת התמונה נכשלה');
        } finally {
            setIsAvatarBusy(false);
        }
    };

    const handleAvatarRemove = async () => {
        if (!avatarUrl) return;
        setIsAvatarBusy(true);
        try {
            await avior.entities.User.deleteAvatar(session);
            setAvatarUrl(null);
            updateUser?.({ avatar_url: null });
            toast.success('תמונת הפרופיל הוסרה');
        } catch (err) {
            console.error(err);
            toast.error('הסרת התמונה נכשלה');
        } finally {
            setIsAvatarBusy(false);
        }
    };

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

            {/* Avatar editor */}
            <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-700 border border-slate-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="תמונת פרופיל"
                            className="w-full h-full object-cover"
                            onError={() => setAvatarUrl(null)}
                        />
                    ) : (
                        <span aria-hidden="true">{initials || '?'}</span>
                    )}
                    {isAvatarBusy && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-white" aria-hidden="true" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFile}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isAvatarBusy}
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-900 border-slate-700 text-white hover:bg-slate-700 h-9"
                    >
                        <Camera className="w-4 h-4 ml-2" aria-hidden="true" />
                        {avatarUrl ? 'החלף תמונה' : 'העלה תמונה'}
                    </Button>
                    {avatarUrl && (
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isAvatarBusy}
                            onClick={handleAvatarRemove}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-9 justify-start"
                        >
                            <Trash2 className="w-4 h-4 ml-2" aria-hidden="true" />
                            הסר תמונה
                        </Button>
                    )}
                </div>
            </div>

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

            {/* Bio — 200 char limit (matches DB CHECK) */}
            <div className="space-y-2">
                <Label className="text-slate-300">תיאור קצר על עצמי</Label>
                <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 200) })}
                    rows={3}
                    placeholder="למשל: אופה לחמי מחמצת בשעות הפנאי, אבא של נועם ורועי"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                />
                <p className="text-xs text-slate-500 text-left" dir="ltr">
                    {formData.bio.length}/200
                </p>
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

            <div className="pt-2">
                <Button type="submit" disabled={isSaving} className="w-full bg-teal-700 hover:bg-teal-800 text-white h-11">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    שמור שינויים
                </Button>
            </div>
        </form>
    );
}