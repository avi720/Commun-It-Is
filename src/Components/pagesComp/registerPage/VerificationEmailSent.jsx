import React, { } from 'react';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/context/useAppData';
import { avior } from '@/Api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";

export default function VerificationEmailSent({ email, password, setLoading, loading, navigate }) {

    const { refresh } = useAppData();

    const handleCheckVerification = async () => {
        setLoading(true);
        try {
            await refresh();
            const loginResponse = await avior.auth.login(email, password);
            if (loginResponse.user) {
                // התחברות הצליחה! המייל מאומת.
                // שומרים את המידע לשימוש באפליקציה
                localStorage.setItem('tremp_userData', JSON.stringify(loginResponse.user));
                // מנקים את המייל הזמני מהזיכרון של הטאב
                sessionStorage.removeItem('pendingRegistrationEmail');
                // רענון הקונטקסט כדי שהאפליקציה תדע שאנחנו מחוברים
                await refresh();
                // ה-Router ב-App.jsx כבר יעביר אותנו ל-Onboarding כי חסרים פרטים
                //navigate('/onboarding');
            }
        } catch (error) {
            console.error("Login failed:", error);
            toast.error("האימות טרם הושלם או שגיאה בהתחברות. אנא נסה שוב.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        sessionStorage.removeItem('pendingRegistrationEmail');
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4" dir="rtl">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700 animate-in fade-in zoom-in-95 duration-300">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center border border-teal-500/30">
                        <Mail className="w-8 h-8 text-teal-400" />
                    </div>
                    <CardTitle className="text-2xl text-white">אימות כתובת מייל</CardTitle>
                    <CardDescription className="text-slate-400 text-lg">
                        שלחנו מייל אימות לכתובת:
                        <br />
                        <span className="text-white font-medium">{email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-sm text-slate-300 space-y-3">
                        <p className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-teal-500" />
                            <span>בדוק את תיבת הדואר הנכנס שלך</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-teal-500" />
                            <span>לחץ על הקישור במייל להפעלת החשבון</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-teal-500" />
                            <span>לאחר מכן, לחץ על הכפתור למטה</span>
                        </p>
                    </div>
                    {/* כפתור בדיקה חכם */}
                    <Button
                        className="w-full bg-teal-700 hover:bg-teal-800 text-white gap-2 h-12 text-lg animate-pulse"
                        onClick={handleCheckVerification}
                        disabled={loading}
                    >
                        {loading ? "בודק..." : "אימתתי את המייל"}
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white gap-2 h-12 text-lg"
                        onClick={() => {
                            handleReset();
                            navigate('/login')
                        }}
                    >
                        עבור לדף ההתחברות <ArrowRight className="w-5 h-5" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}