import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RegisterPage({ onContinue, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    // מעבירים את המידע לשלב הבא (ולא לשרת עדיין)
    onContinue({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-teal-400">הרשמה לטרמפיקציה</CardTitle>
          <CardDescription className="text-slate-400">
            שלב 1 מתוך 2: פרטי התחברות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="אימייל"
                  className="w-full p-2 pr-10 rounded-md bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="סיסמה"
                  className="w-full p-2 pr-10 rounded-md bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="אימות סיסמה"
                  className="w-full p-2 pr-10 rounded-md bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="text-red-400 text-sm text-center">{error}</div>}

            <button 
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
            >
              המשך לשלב הבא
              <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              type="button"
              onClick={onBack}
              className="w-full text-slate-400 hover:text-white p-2 text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              חזרה להתחברות
            </button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}