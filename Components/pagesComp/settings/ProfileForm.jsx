import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Save, Loader2 } from 'lucide-react';
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";

export default function ProfileForm({ user, onSave }) {
    // State מקומי לטופס כדי לא לשנות את הגלובלי בכל הקלדה
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        city: '',
        address: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // סנכרון ראשוני כשהמשתמש נטען
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                city: user.city || '',
                address: user.address || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        // דימוי של פעולה אסינכרונית (אם בעתיד יהיה שרת)
        await new Promise(resolve => setTimeout(resolve, 500));
        onSave(formData);
        setIsSaving(false);
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
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-slate-300">שם משפחה</Label>
                    <Input 
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white ltr"
                    type="tel"
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
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="למשל: תל אביב"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">רחוב ומספר</Label>
                        <Input 
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="bg-slate-900 border-slate-700 text-white"
                            placeholder="למשל: הרצל 15"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <Button type="submit" disabled={isSaving} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    שמור שינויים
                </Button>
            </div>
        </form>
    );
}