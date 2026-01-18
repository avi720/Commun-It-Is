import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppData } from './context/AppContext';
import { avior } from './Api/Client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

import MainLayout from './Components/MainLayout';
import PublicDisplay from './Pages/PublicDisplay';
import SendRide from './Pages/SendRide';
import LoginPage from './Pages/LoginPage';
import SettingsPage from './Pages/SettingsPage';
import HomePage from './Pages/HomePage';
import RegisterPage from './Pages/Register/RegisterPage';
import OnboardingPage from './Pages/Register/OnboardingPage';
import VerificationSuccess from './Pages/Register/VerificationSuccess';
import CommitteeDashboard from './Pages/CommitteeDashboard';
import CommitteeRoute from './Components/auth/CommitteeRoute';
import PhoneBook from './Pages/PhoneBook';
import NotificationsHistory from './Pages/NotificationsHistory';

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

  if (user?.isVerifiedResident === false) {
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
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-teal-500">
        <div className="text-2xl font-bold animate-pulse">טוען את הקהילה שלך...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* אזור ציבורי - פתוח לכולם */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />

      {/* כאן השינוי: RegisterPage עומד בפני עצמו */}
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/verification-success" element={<VerificationSuccess />} />
      {/* נתיב מיוחד להשלמת פרטים - נגיש רק למי שמחובר אבל חסר פרופיל */}
      <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
      <Route path="/resident-verification" element={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-500">הפרטים שלך נשלחו לבדיקה. תודה על הסבלנות!</div>} />

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
        // כל נתיב אחר זורק ללוגין
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  // ה-useEffect הזה רץ פעם אחת בלבד כשהאפליקציה עולה
  useEffect(() => {
    const initPush = async () => {
      // בדיקה שאנחנו בטלפון ולא במחשב (כדי למנוע שגיאות בדפדפן)
      if (Capacitor.isNativePlatform()) {
        try {
          // 1. רישום מאזינים (חובה להגדיר לפני הבקשה)
          await PushNotifications.addListener('registration', token => {
            console.info('Push registration success, token: ' + token.value);
            // שמירה זמנית - AppContext ישלח את זה לשרת כשהיוזר יתחבר
            localStorage.setItem('fcm_token', token.value);
          });

          await PushNotifications.addListener('registrationError', err => {
            console.error('Registration error: ', err.error);
          });

          await PushNotifications.addListener('pushNotificationReceived', notification => {
            console.log('Push received: ', notification);
            // כאן אפשר להוסיף לוגיקה להצגת הודעה יפה (Toast) בעתיד
            alert(`הודעה חדשה:\n${notification.title}\n${notification.body}`);
          });

          // 2. בקשת הרשאה מהמשתמש
          let permStatus = await PushNotifications.checkPermissions();

          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
          }
        } catch (e) {
          console.error("Push init error:", e);
        }
      }
    };

    initPush();

    // ניקוי מאזינים כשהאפליקציה נסגרת (נדיר, אבל טוב לביצועים)
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

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