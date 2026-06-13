import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { avior } from '@/Api';
import { Button } from "@/Components/ui/button";
import VerificationEmailSent from '@/Components/pagesComp/registerPage/VerificationEmailSent';
import GoogleSignInButton from '@/Components/auth/GoogleSignInButton';

// שחזור מצב בטעינת הדף — נקרא פעם אחת ב-mount דרך lazy useState init,
// במקום useEffect. מחזיר אובייקט עם שני הערכים כדי לא לקרוא ל-sessionStorage
// פעמיים.
function restorePendingEmail() {
  const pending = sessionStorage.getItem('pendingRegistrationEmail');
  return { emailSentTo: pending || '', isSuccess: !!pending };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const restored = useState(restorePendingEmail)[0];
  const [isSuccess, setIsSuccess] = useState(restored.isSuccess);
  const [emailSentTo, setEmailSentTo] = useState(restored.emailSentTo);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // ניקוי שגיאות כשהמשתמש מקליד
    if (error) setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // בדיקות תקינות (Validations)
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    // 1. בדיקת תו מיוחד (בודק אם יש לפחות אחד מהתווים האלו)
    const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
    // 2. בדיקת מספר (בודק אם יש ספרה 0-9)
    const numberRegex = /\d/;

    if (formData.password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }

    if (!specialCharRegex.test(formData.password)) {
      setError('הסיסמה חייבת להכיל לפחות תו מיוחד אחד (!@#$...)');
      return;
    }

    if (!numberRegex.test(formData.password)) {
      setError('הסיסמה חייבת להכיל לפחות מספר אחד');
      return;
    }

    setLoading(true);
    try {
      // 1. קריאה להרשמה (Auth בלבד)
      await avior.auth.signUp(
        formData.email,
        formData.password
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
      <VerificationEmailSent
        email={emailSentTo}
        password={formData.password}
        setLoading={setLoading}
        loading={loading}
        navigate={navigate}
      />
    )
  }

  // --- תצוגה 2: טופס הרשמה ---
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-900 p-4" dir="rtl">
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
              <Label htmlFor="register-email" className="text-slate-300">כתובת אימייל</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="flex w-full h-11 md:h-9 pr-10 px-3 py-1 rounded-md bg-slate-900 border border-slate-700 text-white text-base md:text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password" className="text-slate-300">סיסמה</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="לפחות 8 תווים, מספר ותו מיוחד"
                  className="flex w-full h-11 md:h-9 pr-10 px-3 py-1 rounded-md bg-slate-900 border border-slate-700 text-white text-base md:text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm-password" className="text-slate-300">אימות סיסמה</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="הזן שוב את הסיסמה"
                  className="flex w-full h-11 md:h-9 pr-10 px-3 py-1 rounded-md bg-slate-900 border border-slate-700 text-white text-base md:text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  value={formData.confirmPassword}
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
              className="w-full bg-teal-700 hover:bg-teal-800 text-white h-11 text-lg font-medium transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  המשך לשלב הבא
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="flex items-center gap-3 my-1">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-xs text-slate-400">או</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>

            <GoogleSignInButton label="הרשמה עם Google" />

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full text-slate-400 hover:text-white p-2 text-sm flex items-center justify-center gap-2 mt-2 min-h-[44px] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              חזרה להתחברות
            </button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}