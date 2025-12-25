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
import OnboardingPage from './Pages/OnboardingPage';
import RegisterPage from './Pages/RegisterPage'; // <-- הוספנו את הייבוא החסר

const queryClient = new QueryClient();

function AppRoutes() {
  const { isLoading, isAuthenticated } = useAppData();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-teal-500">
         <div className="text-2xl font-bold animate-pulse">טוען טרמפיקציה...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* אזור ציבורי - פתוח לכולם */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      
      {/* התיקון: הוספת הנתיב החסר להרשמה */}
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />

      {/* אזור מוגן - רק למחוברים */}
      {isAuthenticated ? (
        <Route path="/" element={<MainLayout />}>
           <Route index element={<HomePage />} />
           <Route path="onboarding" element={<OnboardingPage />} />
           <Route path="rides" element={<PublicDisplay />} />
           <Route path="send-ride" element={<SendRide />} />
           <Route path="settings" element={<SettingsPage />} />
        </Route>
      ) : (
        // כל נתיב אחר זורק ללוגין
        <Route path="*" element={<Navigate to="/login" />} />
      )}
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