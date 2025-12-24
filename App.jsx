import React, { useState } from 'react';
import PublicDisplay from './Pages/PublicDisplay';
import SendRide from './Pages/SendRide';
import LoginPage from './Pages/LoginPage';
import OnboardingPage from './Pages/OnboardingPage';
import RegisterPage from './Pages/RegisterPage'; // הוספנו
import { ArrowRight, Monitor, LogOut, Trash2 } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState(() => {
    const isLoggedIn = localStorage.getItem('tremp_isLoggedIn');
    const isOnboardingDone = localStorage.getItem('tremp_onboardingDone');

    if (isLoggedIn && isOnboardingDone) return 'display';
    return 'login';
  });

  // משתנה זמני לשמירת המייל והסיסמה במעבר בין מסכים
  const [tempRegisterData, setTempRegisterData] = useState(null);

  // --- ניהול הניווט ---

  const handleLoginSuccess = () => setAppState('display');
  
  // מעבר מדף לוגין לדף הרשמה
  const handleGoToRegister = () => setAppState('register');
  
  // מעבר מדף הרשמה לדף אונבורדינג (שומרים את האימייל בצד)
  const handleRegisterNext = (authData) => {
      setTempRegisterData(authData);
      setAppState('onboarding');
  };

  const handleOnboardingComplete = () => setAppState('display');

  const handleLogout = () => {
    localStorage.removeItem('tremp_isLoggedIn');
    setAppState('login');
  };

  const handleHardReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  // --- תצוגת המסכים ---

  if (appState === 'login') {
    return <LoginPage 
              onLoginSuccess={handleLoginSuccess} 
              onRegisterClick={handleGoToRegister} // פונקציה חדשה שנעביר ללוגין
           />;
  }

  if (appState === 'register') {
    return <RegisterPage 
              onContinue={handleRegisterNext} 
              onBack={() => setAppState('login')} 
           />;
  }

  if (appState === 'onboarding') {
    return <OnboardingPage 
              onComplete={handleOnboardingComplete} 
              initialAuth={tempRegisterData} // מעבירים את המידע ששמרנו
           />;
  }

  // --- האפליקציה הרגילה ---
  return (
    <div className="relative w-full h-full">
      
      {/* כפתורי שליטה */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <button onClick={handleLogout} className="p-2 bg-slate-800/50 text-slate-300 rounded-full hover:bg-slate-800 hover:text-white transition-colors border border-slate-700">
          <LogOut className="w-4 h-4" />
        </button>
        <button onClick={handleHardReset} className="p-2 bg-red-900/50 text-red-300 rounded-full hover:bg-red-600 hover:text-white transition-colors border border-red-800">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <button 
        onClick={() => setAppState(appState === 'display' ? 'send' : 'display')}
        style={{ top: '50px', right: '50px', width: '40px', height: '40px' }} 
        className="fixed z-50 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/50 hover:bg-white/20 hover:text-white transition-all shadow-xl group"
      >
        {appState === 'display' ? (
          <ArrowRight style={{ width: '18px', height: '18px' }} className="transform group-hover:-translate-x-1 transition-transform" />
        ) : (
          <Monitor style={{ width: '18px', height: '18px' }} />
        )}
      </button>

      {appState === 'display' ? <PublicDisplay /> : <SendRide />}
    </div>
  );
}