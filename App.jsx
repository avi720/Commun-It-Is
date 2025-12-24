import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // <--- הוספנו

// דפים
import LoginPage from './Pages/LoginPage';
import OnboardingPage from './Pages/OnboardingPage';
import RegisterPage from './Pages/RegisterPage';
import HomePage from './Pages/HomePage';
import PublicDisplay from './Pages/PublicDisplay';
import SendRide from './Pages/SendRide';

// Layout
import MainLayout from './Components/MainLayout';

export default function App() {
  // ניהול התחברות (נשאר אותו דבר)
  const [authState, setAuthState] = useState(() => {
    const isLoggedIn = localStorage.getItem('tremp_isLoggedIn');
    const isOnboardingDone = localStorage.getItem('tremp_onboardingDone');

    if (isLoggedIn && isOnboardingDone) return 'APP';
    if (isLoggedIn && !isOnboardingDone) return 'ONBOARDING';
    return 'LOGIN';
  });

  const [tempRegisterData, setTempRegisterData] = useState(null);

  const handleLoginSuccess = () => setAuthState('APP');
  const handleGoToRegister = () => setAuthState('REGISTER');
  const handleRegisterNext = (authData) => {
      setTempRegisterData(authData);
      setAuthState('ONBOARDING');
  };
  const handleOnboardingComplete = () => setAuthState('APP');
  const handleLogout = () => {
    localStorage.removeItem('tremp_isLoggedIn');
    setAuthState('LOGIN');
  };

  // --- Render ---

  // אם לא מחוברים - מציגים את מסכי הכניסה הרגילים (בלי ראוטר בינתיים לשימור הפשטות)
  if (authState === 'LOGIN') return <LoginPage onLoginSuccess={handleLoginSuccess} onRegisterClick={handleGoToRegister} />;
  if (authState === 'REGISTER') return <RegisterPage onContinue={handleRegisterNext} onBack={() => setAuthState('LOGIN')} />;
  if (authState === 'ONBOARDING') return <OnboardingPage onComplete={handleOnboardingComplete} initialAuth={tempRegisterData} />;

  // אם מחוברים - מפעילים את ה-Router
  return (
    <BrowserRouter>
      <Routes>
        {/* נתיב ראשי שעוטף הכל ב-MainLayout */}
        <Route path="/" element={<MainLayout onLogout={handleLogout} />}>
          
          {/* דפי הבנים שיופיעו בתוך ה-Outlet */}
          <Route index element={<HomePage />} /> {/* ברירת מחדל: דף הבית */}
          <Route path="rides" element={<PublicDisplay />} />
          <Route path="send" element={<SendRide />} />
          
          {/* דף הגדרות (Inline בינתיים) */}
          <Route path="settings" element={
             <div className="p-4 text-center text-slate-400">
                <h2 className="text-2xl font-bold text-white mb-2">הגדרות</h2>
                <button onClick={() => {localStorage.clear(); window.location.reload()}} className="mt-8 p-3 bg-red-900/50 text-red-200 rounded-lg border border-red-800">
                  איפוס מערכת
                </button>
             </div>
          } />

          {/* אם מישהו מקליד שטויות ב-URL, נחזיר אותו הביתה */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}