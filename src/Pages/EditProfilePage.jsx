import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { useAppData } from '../context/useAppData';
import ProfileForm from '../Components/pagesComp/settings/ProfileForm';

export default function EditProfilePage() {
    const navigate = useNavigate();
    const { user, updateUser } = useAppData();

    const handleSave = (patch) => {
        updateUser?.(patch);
        toast.success('הפרטים נשמרו');
        navigate('/profile');
    };

    return (
        <div className="p-4 max-w-2xl mx-auto pb-20 overflow-y-auto h-full">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                <button
                    onClick={() => navigate('/profile')}
                    className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors mb-2"
                >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    חזרה לפרופיל
                </button>

                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-white">עריכת פרופיל</h1>
                    <p className="text-sm text-slate-400">תמונה, שם, ביו ופרטים אישיים</p>
                </div>

                <ProfileForm user={user} onSave={handleSave} />
            </motion.div>
        </div>
    );
}
