import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppData } from '@/context/AppContext';

export default function CommitteeRoute({ children }) {
    const { user, session } = useAppData();

    // 1. אם המשתמש לא מחובר בכלל -> לך להתחבר
    if (!session) {
        return <Navigate to="/login" replace />;
    }

    // 2. אם המשתמש מחובר אבל הוא לא חבר ועד -> עוף הביתה
    if (user?.community_role !== 'committee') {
        return <Navigate to="/" replace />;
    }

    // 3. הכל תקין? תציג את הדף המבוקש
    return children;
}