import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider } from './context/AppContext';
import { useAppData } from './context/useAppData';
import { usePushNotifications } from './Components/hooks/usePushNotifications';

import MainLayout from './Components/MainLayout';
import CommitteeRoute from './Components/routes/CommitteeRoute';
import ProtectedRoute from './Components/routes/ProtectedRoute';
import OnboardingRoute from './Components/routes/OnboardingRoute';

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
const ProfilePage = lazy(() => import('./Pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./Pages/EditProfilePage'));
const RideRequestsPage = lazy(() => import('./Pages/RideRequestsPage'));
const AboutPage = lazy(() => import('./Pages/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./Pages/PrivacyPolicyPage'));

// מסך טעינה אחיד שמוצג בזמן שדף עצל נטען או בזמן טעינת הסשן הראשונית
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-teal-500">
    <div className="text-2xl font-bold animate-pulse">טוען את הקהילה שלך...</div>
  </div>
);

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAppData();
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
  usePushNotifications();
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