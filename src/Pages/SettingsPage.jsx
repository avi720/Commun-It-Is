import React, { useState } from 'react';
import { useAppData } from '../context/useAppData';
import ProfileForm from '../Components/pagesComp/settings/ProfileForm';
import DangerZone from '../Components/pagesComp/settings/DangerZone';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { avior } from '../Api';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';

export default function SettingsPage() {
    // 2. שולפים הכל מהקונטקסט המרכזי
    const { user, updateUser, session } = useAppData(); 
    
    // סטייט מקומי להודעות (טוסטים) - זה שייך רק לדף הזה
    const [message, setMessage] = useState(null);
    // state לדיאלוג מחיקת החשבון — מחליף את window.confirm()
    const [deleteOpen, setDeleteOpen] = useState(false);

    // פונקציה שעוטפת את העדכון עם הודעת הצלחה
    const handleSave = (updatedFields) => {
        try {
            // מיזוג המידע החדש עם הקיים
            const newUser = { ...user, ...updatedFields };
            
            // עדכון דרך הקונטקסט (זה יעדכן את כל האפליקציה וגם את ה-LocalStorage)
            updateUser(newUser);

            setMessage({ type: 'success', text: 'הפרטים נשמרו בהצלחה!' });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ type: 'error', text: 'שגיאה בשמירת הנתונים' });
        }
    };

    // פתיחת דיאלוג מחיקת חשבון. הביצוע עצמו מתבצע ב-confirmHardReset כשהמשתמש
    // לוחץ "אישור" בדיאלוג — מחליף את window.confirm() החוסם.
    const handleHardReset = () => setDeleteOpen(true);

    const confirmHardReset = async () => {
        setDeleteOpen(false);
        try {
            // 1. קריאה לשרת למחיקת המשתמש
            if (user && user.id) {
                await avior.entities.User.delete(user.id, session);
            }

            // 2. ניקוי מקומי והתנתקות
            localStorage.clear();
            window.location.href = '/login';

        } catch (error) {
            console.error("Error deleting account:", error);
            toast.error("אירעה שגיאה במחיקת החשבון. אנא נסה שוב.");
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto pb-20 overflow-y-auto h-full">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* כותרת */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                        הגדרות
                    </h1>
                    <p className="text-slate-400">ניהול פרופיל והעדפות</p>
                </div>

                {/* הודעות מערכת */}
                {message && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl flex items-center gap-3 ${
                            message.type === 'success' 
                                ? 'bg-teal-900/30 border border-teal-800 text-teal-300' 
                                : 'bg-red-900/30 border border-red-800 text-red-300'
                        }`}
                    >
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        {message.text}
                    </motion.div>
                )}

                {/* הטפסים עצמם נשארו ללא שינוי */}
                <ProfileForm user={user} onSave={handleSave} />
                
                <DangerZone onReset={handleHardReset} />

                <div className="text-center text-slate-400 text-xs mt-10">
                    Commun-it-is v1.0 • Developed by Hanan
                </div>
            </motion.div>

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="מחיקת חשבון לצמיתות"
                description={"פעולה בלתי הפיכה: כל הפרטים, הפוסטים, הנסיעות והקשרים שלך יימחקו לתמיד."}
                confirmText="מחק"
                confirmLabel="כן, מחק לצמיתות"
                cancelLabel="ביטול"
                destructive
                onConfirm={confirmHardReset}
            />
        </div>
    );
}