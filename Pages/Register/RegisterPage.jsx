import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { avior } from '../../Api/Client';
import { Button } from "@/Components/ui/button";
import { useAppData } from '../../context/AppContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refresh } = useAppData();
  // ניהול מצבים (State)
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(''); // היה חסר לך
  const [emailSentTo, setEmailSentTo] = useState('');
  
  // ריכוז כל שדות הטופס לאובייקט אחד
  const [formData, setFormData] = useState({
    email: ''
  });

  // --- תוספת: שחזור מצב בטעינת הדף ---
  useEffect(() => {
      // בודקים אם יש מייל שמחכה לאימות בזיכרון של הטאב הנוכחי
      const pendingEmail = sessionStorage.getItem('pendingRegistrationEmail');
      if (pendingEmail) {
          setEmailSentTo(pendingEmail);
          setIsSuccess(true);
      }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // ניקוי שגיאות כשהמשתמש מקליד
    if (error) setError('');
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
        // מנסים לרענן את הנתונים מהשרת
        await refresh();
        // אם האימות הצליח, ה-App.jsx יזהה את זה לבד ויעביר אותך דף (בגלל ה-AuthRoute)
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleReset = () => {
      sessionStorage.removeItem('pendingRegistrationEmail');
      setIsSuccess(false);
      setFormData({ email: '' });
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      // 1. קריאה להרשמה (Auth בלבד)
      await avior.auth.signUp(
        formData.email
      );
      sessionStorage.setItem('pendingRegistrationEmail', formData.email); // שמירת המייל לזיכרון של הטאב הנוכחי
      // 2. הצלחה - מעבר למסך אימות מייל
      setEmailSentTo(formData.email);
      setIsSuccess(true);

    } catch (err) {
      console.error("Registration error:", err);
      // הצגת הודעה ידידותית למשתמש
      if (err.message.includes("already registered")) {
        setError("המייל הזה כבר רשום במערכת");
      } else {
        setError(err.message || "שגיאה בהרשמה");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- תצוגה 1: מסך הצלחה (מייל נשלח) ---
  if (isSuccess) {
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
              <span className="text-white font-medium">{emailSentTo}</span>
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
              className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 h-12 text-lg animate-pulse"
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

  // --- תצוגה 2: טופס הרשמה ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4" dir="rtl">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-teal-400">הרשמה</CardTitle>
          <CardDescription className="text-slate-400">
            שלב 1 מתוך 2: פרטי התחברות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  name="email"
                  type="email" 
                  placeholder="אימייל"
                  className="w-full p-2 pl-10 rounded-md bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">
                {error}
              </div>
            )}

            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 text-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  המשך לשלב הבא
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </Button>

            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="w-full text-slate-400 hover:text-white p-2 text-sm flex items-center justify-center gap-2 mt-2"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה להתחברות
            </button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}