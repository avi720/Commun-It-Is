import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { base44 } from "../Api/Client";

export default function LoginPage({ onLoginSuccess, onRegisterClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. קריאה לשרת לביצוע התחברות
      const userData = await base44.entities.User.login(email, password);
      
      // 2. שמירת הנתונים ב-localStorage כדי שהמשתמש יישאר מחובר
      localStorage.setItem('tremp_userData', JSON.stringify(userData));
      localStorage.setItem('tremp_isLoggedIn', 'true');
      localStorage.setItem('tremp_onboardingDone', 'true'); // מניחים שמשתמש קיים כבר השלים onboarding

      // 3. עדכון ה-App שעברנו בהצלחה
      onLoginSuccess();
    } catch (err) {
      setError('אימייל או סיסמה לא נכונים');
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold text-teal-400">התחברות לטרמפיקציה</CardTitle>
          <CardDescription className="text-slate-400">הזן את פרטיך כדי להתחיל</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
              <input 
                type="email" 
                placeholder="כתובת אימייל"
                className="w-full p-2 pr-10 rounded-md bg-slate-900 border border-slate-700 text-white"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
              <input 
                type="password" 
                placeholder="סיסמה"
                className="w-full p-2 pr-10 rounded-md bg-slate-900 border border-slate-700 text-white"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              התחבר
            </button>
          </form>

          <div className="text-center text-sm text-slate-400 mt-4">
            אין לך חשבון?{' '}
            <span onClick={onRegisterClick} className="text-teal-400 cursor-pointer hover:underline font-bold">הירשם עכשיו</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}