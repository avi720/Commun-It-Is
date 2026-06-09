import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppData } from '@/context/AppContext';

/**
 * שומר נתיב למשתמש מחובר ושהשלים את ה-onboarding.
 * - לא מחובר → /login
 * - מחובר אבל הפרופיל לא שלם → /onboarding
 * - מחובר אבל לא אומת כתושב → /resident-verification
 * - אחרת → מציג את הילדים
 */
export default function ProtectedRoute({ children }) {
    const { user, isAuthenticated, isLoading } = useAppData();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-500">
                טוען...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.isIncomplete) {
        return <Navigate to="/onboarding" replace />;
    }

    if (user?.is_verified_as_resident === false) {
        return <Navigate to="/resident-verification" replace />;
    }

    return children;
}
