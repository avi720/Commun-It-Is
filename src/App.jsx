import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider } from './context/AppContext';
import { useAppData } from './context/useAppData';
import { usePushNotifications } from './Components/hooks/usePushNotifications';
import { useNativeAuthCallback } from './Components/hooks/useNativeAuthCallback';

import MainLayout from './Components/MainLayout';
import CommitteeRoute from './Components/routes/CommitteeRoute';
import ProtectedRoute from './Components/routes/ProtectedRoute';
import OnboardingRoute from './Components/routes/OnboardingRoute';

function lazyWithRetry(importFn) {
  return lazy(() =>
    importFn().catch(() =>
      new Promise(resolve => setTimeout(resolve, 1500))
        .then(() => importFn())
        .catch(() => {
          window.location.reload();
          return new Promise(() => {});
        })
    )
  );
}

const PublicDisplay = lazyWithRetry(() => import('./Pages/PublicDisplay'));
const SendRide = lazyWithRetry(() => import('./Pages/SendRide'));
const LoginPage = lazyWithRetry(() => import('./Pages/LoginPage'));
const SettingsPage = lazyWithRetry(() => import('./Pages/SettingsPage'));
const HomePage = lazyWithRetry(() => import('./Pages/HomePage'));
const RegisterPage = lazyWithRetry(() => import('./Pages/Register/RegisterPage'));
const OnboardingPage = lazyWithRetry(() => import('./Pages/Register/OnboardingPage'));
const VerificationSuccess = lazyWithRetry(() => import('./Pages/Register/VerificationSuccess'));
const ResidentVerificationPending = lazyWithRetry(() => import('./Pages/Register/ResidentVerificationPending'));
const CommitteeDashboard = lazyWithRetry(() => import('./Pages/CommitteeDashboard'));
const PhoneBook = lazyWithRetry(() => import('./Pages/PhoneBook'));
const NotificationsHistory = lazyWithRetry(() => import('./Pages/NotificationsHistory'));
const ProfilePage = lazyWithRetry(() => import('./Pages/ProfilePage'));
const EditProfilePage = lazyWithRetry(() => import('./Pages/EditProfilePage'));
const RideRequestsPage = lazyWithRetry(() => import('./Pages/RideRequestsPage'));
const AboutPage = lazyWithRetry(() => import('./Pages/AboutPage'));
const PrivacyPolicyPage = lazyWithRetry(() => import('./Pages/PrivacyPolicyPage'));

// מסך טעינה אחיד שמוצג בזמן שדף עצל נטען או בזמן טעינת הסשן הראשונית
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-teal-500">
    <div className="text-2xl font-bold animate-pulse">טוען את הקהילה שלך...</div>
  </div>
);

function AppRoutes() {
  const { isAuthenticated, isLoading, session } = useAppData();
  usePushNotifications(session);

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
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/edit" element={<EditProfilePage />} />
        <Route path="ride-requests" element={<RideRequestsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
      </Route>
      {/* כל נתיב אחר זורק ללוגין */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
    </Suspense>
  );
}

export default function App() {
  useNativeAuthCallback();
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      {/* Toaster יחיד לכל האפליקציה — מחליף את alert() ב-toast.success/error/info.
          richColors נותן ירוק להצלחה ואדום לשגיאה; position מותאם ל-RTL ולמובייל. */}
      <Toaster richColors position="top-center" closeButton dir="rtl" />
    </AppProvider>
  );
}