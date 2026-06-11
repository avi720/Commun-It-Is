import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { avior } from "../Api";
import { useAppData } from '../context/useAppData';
import GoogleSignInButton from '../Components/auth/GoogleSignInButton';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const handleNavigation = (path) => { navigate(path); };

  const { refresh } = useAppData();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // התחברות בלבד
      const response = await avior.auth.login(formData.email, formData.password);

      // שמירת המידע
      localStorage.setItem('tremp_userData', JSON.stringify(response));

      // עדכון המערכת וניווט
      await refresh();
      navigate('/');

    } catch (err) {
      console.error(err);
      setError('שם משתמש או סיסמה שגויים');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold text-teal-400">
            התחברות
          </CardTitle>
          <CardDescription className="text-slate-400">
            הזן את פרטיך כדי להתחיל
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-slate-300">כתובת אימייל</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  className="flex w-full h-11 md:h-9 pr-10 px-3 py-1 rounded-md bg-slate-900 border border-slate-700 text-white text-base md:text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-slate-300">סיסמה</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="הזן סיסמה"
                  className="flex w-full h-11 md:h-9 pr-10 px-3 py-1 rounded-md bg-slate-900 border border-slate-700 text-white text-base md:text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center font-medium bg-red-900/20 p-2 rounded">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white p-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 min-h-[44px]"
            >
              התחבר
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            </button>
          </form>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">או</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          <GoogleSignInButton label="התחבר עם Google" />

          <div className="text-center text-sm text-slate-400 mt-4 select-none">
            אין לך חשבון?{' '}
            <span
              onClick={() => handleNavigation('/register')}
              className="text-teal-400 cursor-pointer hover:underline font-bold"
            >
              הירשם עכשיו
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}