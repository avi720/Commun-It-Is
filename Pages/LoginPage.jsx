import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { avior } from "../Api/Client";
import { useAppData } from '../context/AppContext';

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
      /*const response =*/ await avior.auth.login(formData.email, formData.password);

      // שמירת המידע
      //localStorage.setItem('tremp_userData', JSON.stringify(response));
      
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
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
            
            <div className="relative">
              <Mail className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
              <input 
                type="email" 
                placeholder="כתובת אימייל"
                className="w-full p-2 pr-10 rounded-md bg-slate-900 border border-slate-700 text-white focus:border-teal-500 outline-none"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
              <input 
                type="password" 
                placeholder="סיסמה"
                className="w-full p-2 pr-10 rounded-md bg-slate-900 border border-slate-700 text-white focus:border-teal-500 outline-none"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center font-medium bg-red-900/20 p-2 rounded">{error}</p>}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
            >
              התחבר
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            </button>
          </form>

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