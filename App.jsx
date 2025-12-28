import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useAppData } from './context/AppContext';

import MainLayout from './Components/MainLayout';
import PublicDisplay from './Pages/PublicDisplay';
import SendRide from './Pages/SendRide';
import LoginPage from './Pages/LoginPage';
import SettingsPage from './Pages/SettingsPage';
import HomePage from './Pages/HomePage';
import SignIn from './Pages/SignIn';
import RegisterPage from './Pages/Register/RegisterPage';
import OnboardingPage from './Pages/Register/OnboardingPage';
import VerificationSuccess from './Pages/Register/VerificationSuccess';

const queryClient = new QueryClient();

// רכיב שמגן על נתיבים ומוודא שהמשתמש סיים הרשמה
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAppData();

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-500">טוען...</div>;

  // 1. אם לא מחובר -> לך להתחבר
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. אם מחובר אבל אין פרטים (הדגל שיצרנו ב-Context) -> לך להשלים פרטים
  if (user?.isIncomplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// רכיב שמוודא שמשתמש שכבר קיים לא ייכנס שוב להרשמה/התחברות
const AuthRoute = ({ children }) => {
    const { isAuthenticated } = useAppData();
    if (isAuthenticated) return <Navigate to="/" replace />;
    return children;
};

function AppRoutes() {
const { isAuthenticated, user, isLoading } = useAppData();
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-teal-500">
         <div className="text-2xl font-bold animate-pulse">טוען את הקהילה שלך...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* אזור ציבורי - פתוח לכולם */}
      <Route path="/login" element={!isAuthenticated ? <AuthRoute><LoginPage /></AuthRoute> : <Navigate to="/" />} />
      
      {/* כאן השינוי: RegisterPage עומד בפני עצמו */}
      <Route path="/register" element={!isAuthenticated ? <AuthRoute><RegisterPage /></AuthRoute> : <Navigate to="/" />} />
      <Route path="/verification-success" element={<VerificationSuccess />} />
      {/* נתיב מיוחד להשלמת פרטים - נגיש רק למי שמחובר אבל חסר פרופיל */}
      <Route path="/onboarding" element={isAuthenticated ? <OnboardingPage /> : <Navigate to="/login" />} />

      {/* אזור מוגן - רק למחוברים */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
           <Route index element={<HomePage />} />
           <Route path="rides" element={<PublicDisplay />} />
           <Route path="send-ride" element={<SendRide />} />
           <Route path="settings" element={<SettingsPage />} />
        </Route>
        // כל נתיב אחר זורק ללוגין
        <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}