import React, { useState } from 'react';
import { useAppData } from '../context/AppContext'; 
import ProfileForm from '../Components/pagesComp/settings/ProfileForm';
import DangerZone from '../Components/pagesComp/settings/DangerZone';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

export default function SettingsPage() {
    // 2. שולפים הכל מהקונטקסט המרכזי
    const { user, updateUser, logout } = useAppData(); 
    
    // סטייט מקומי להודעות (טוסטים) - זה שייך רק לדף הזה
    const [message, setMessage] = useState(null);

    // פונקציה שעוטפת את העדכון עם הודעת הצלחה
    const handleSave = (updatedFields) => {
        try {
            // מיזוג המידע החדש עם הקיים
            const newUser = { ...user, ...updatedFields };
            
            // עדכון דרך הקונטקסט (זה יעדכן את כל האפליקציה וגם את ה-LocalStorage)
            updateUser(newUser);

            setMessage({ type: 'success', text: 'הפרטים נשמרו בהצלחה!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (e) {
            setMessage({ type: 'error', text: 'שגיאה בשמירת הנתונים' });
        }
    };

    // פונקציית איפוס קשיח (נשארה מקומית כי היא קיצונית)
    const handleHardReset = () => {
        if (window.confirm("פעולה זו תמחק את כל הנתונים מהמכשיר ותאפס את האפליקציה. להמשיך?")) {
            localStorage.clear();
            window.location.href = '/login';
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
                
                <DangerZone onLogout={logout} onReset={handleHardReset} />

                <div className="text-center text-slate-600 text-xs mt-10">
                    Trempikatzia v1.0 • Developed by Hanan
                </div>
            </motion.div>
        </div>
    );
}