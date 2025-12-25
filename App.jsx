import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useAppData } from './context/AppContext'; // <--- הייבוא החדש

// Components
import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegisterPage';
import OnboardingPage from './Pages/OnboardingPage';
import MainLayout from './Components/MainLayout';
import HomePage from './Pages/HomePage';
import PublicDisplay from './Pages/PublicDisplay';
import SendRide from './Pages/SendRide';
import SettingsPage from './Pages/SettingsPage'; // הדף החדש שיצרנו

const queryClient = new QueryClient();

// רכיב פנימי שמנהל את הניתובים כדי שיוכל להשתמש ב-useAppData
function AppRoutes() {
  const { user, isLoading, isAuthenticated } = useAppData();

  // 1. מסך טעינה (Splash Screen)
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-teal-500">
         {/* אפשר לשים פה לוגו או אנימציה */}
         <div className="text-2xl font-bold animate-pulse">טוען קומיוניטיז...</div>
      </div>
    );
  }

  // 2. ניהול הניתובים
  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
      
      {/* נתיבים מוגנים (דורשים התחברות) */}
      {isAuthenticated ? (
        <Route path="/" element={<MainLayout />}>
           <Route index element={<HomePage />} />
           <Route path="onboarding" element={<OnboardingPage />} />
           <Route path="rides" element={<PublicDisplay />} />
           <Route path="send-ride" element={<SendRide />} />
           <Route path="settings" element={<SettingsPage />} />
        </Route>
      ) : (
        // אם לא מחובר, זורקים ללוגין
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      )}
    </Routes>
  );
}

// האפליקציה הראשית
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider> {/* העטיפה החדשה */}
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}