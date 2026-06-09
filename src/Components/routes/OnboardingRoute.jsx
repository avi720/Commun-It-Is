import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppData } from '@/context/AppContext';

/**
 * נתיב /onboarding — נגיש רק למי שמחובר אבל פרופילו עדיין חסר.
 * - לא מחובר → /login
 * - מחובר אבל הפרופיל כבר שלם → / (לא לבזבז זמן)
 */
export default function OnboardingRoute({ children }) {
    const { isAuthenticated, user, isLoading } = useAppData();

    if (isLoading) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (isAuthenticated && !user?.isIncomplete) return <Navigate to="/" replace />;

    return children;
}
