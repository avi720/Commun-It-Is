import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { useAppData } from '../context/useAppData';
import { avior } from '../Api';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';

import PrivacySection from '../Components/pagesComp/settings/PrivacySection';
import NotificationsSection from '../Components/pagesComp/settings/NotificationsSection';
import DangerZone from '../Components/pagesComp/settings/DangerZone';
import AboutSection from '../Components/pagesComp/settings/AboutSection';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { user, session, logout } = useAppData();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const handleHardReset = () => setDeleteOpen(true);

    const confirmHardReset = async () => {
        setDeleteOpen(false);
        try {
            if (user && user.id) {
                // Server-side deletes auth.users via admin; CASCADE fans out
                // to public.users + posts + rides, and Storage gets cleaned
                // best-effort. See routes/users.py:delete_user.
                await avior.entities.User.delete(user.id, session);
            }
            localStorage.clear();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('אירעה שגיאה במחיקת החשבון. אנא נסה שוב.');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate('/login');
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto pb-20 overflow-y-auto h-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                        הגדרות
                    </h1>
                    <p className="text-slate-400">ניהול פרטיות, התראות וחשבון</p>
                </div>

                <PrivacySection />
                <NotificationsSection />

                {/* Account management — Delete Account */}
                <section className="space-y-3">
                    <DangerZone onReset={handleHardReset} />
                </section>

                <AboutSection />

                {/* Logout — bottom of page per redesign brief. Was in Sidebar. */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-900/40 border border-red-800 text-red-200 hover:bg-red-900/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                    <span className="font-semibold">התנתקות</span>
                </button>
            </motion.div>

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="מחיקת חשבון לצמיתות"
                description={'פעולה בלתי הפיכה: כל הפרטים, הפוסטים, הנסיעות והקשרים שלך יימחקו לתמיד.'}
                confirmText="מחק"
                confirmLabel="כן, מחק לצמיתות"
                cancelLabel="ביטול"
                destructive
                onConfirm={confirmHardReset}
            />
        </div>
    );
}
