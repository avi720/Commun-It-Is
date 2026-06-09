import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppData } from './context/AppContext';
import { usePushNotifications } from './Components/hooks/usePushNotifications';

import MainLayout from './Components/MainLayout';
import CommitteeRoute from './Components/routes/CommitteeRoute';

// טעינה עצלה (lazy) של הדפים - כל דף נטען רק כשנכנסים אליו,
// מה שמקטין משמעותית את החבילה הראשונית ואת זמן הטעינה הראשון.
const PublicDisplay = lazy(() => import('./Pages/PublicDisplay'));
const SendRide = lazy(() => import('./Pages/SendRide'));
const LoginPage = lazy(() => import('./Pages/LoginPage'));
const SettingsPage = lazy(() => import('./Pages/SettingsPage'));
const HomePage = lazy(() => import('./Pages/HomePage'));
const RegisterPage = lazy(() => import('./Pages/Register/RegisterPage'));
const OnboardingPage = lazy(() => import('./Pages/Register/OnboardingPage'));
const VerificationSuccess = lazy(() => import('./Pages/Register/VerificationSuccess'));
const ResidentVerificationPending = lazy(() => import('./Pages/Register/ResidentVerificationPending'));
const CommitteeDashboard = lazy(() => import('./Pages/CommitteeDashboard'));
const PhoneBook = lazy(() => import('./Pages/PhoneBook'));
const NotificationsHistory = lazy(() => import('./Pages/NotificationsHistory'));

// מסך טעינה אחיד שמוצג בזמן שדף עצל נטען או בזמן טעינת הסשן הראשונית
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-teal-500">
    <div className="text-2xl font-bold animate-pulse">טוען את הקהילה שלך...</div>
  </div>
);

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

  if (user?.is_verified_as_resident === false) {
    return <Navigate to="/resident-verification" replace />;
  }

  return children;
};

// רכיב להשלמת פרטים: רק למחוברים שאין להם פרופיל
const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAppData();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // אם המשתמש כבר שלם, אין לו מה לחפש פה -> לך הביתה
  if (isAuthenticated && !user?.isIncomplete) return <Navigate to="/" replace />;

  return children;
};

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAppData();
  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* אזור ציבורי - פתוח לכולם */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />

      {/* כאן השינוי: RegisterPage עומד בפני עצמו */}
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/verification-success" element={<VerificationSuccess />} />
      {/* נתיב מיוחד להשלמת פרטים - נגיש רק למי שמחובר אבל חסר פרופיל */}
      <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
      <Route path="/resident-verification" element={<ResidentVerificationPending />} />

      {/* אזור מוגן - רק למחוברים */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />
        <Route path="committee-dashboard" element={<CommitteeRoute><CommitteeDashboard /></CommitteeRoute>} />
        <Route path="rides" element={<PublicDisplay />} />
        <Route path="send-ride" element={<SendRide />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="phonebook" element={<PhoneBook />} />
        <Route path="notifications" element={<NotificationsHistory />} />
      </Route>
      {/* כל נתיב אחר זורק ללוגין */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
    </Suspense>
  );
}

export default function App() {
  usePushNotifications();
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}