import { useContext } from 'react';
import { AppContext } from './AppContext';

/**
 * Hook לצריכת AppContext (user, session, isAuthenticated, logout, refresh).
 *
 * הופרד מ-AppContext.jsx כדי שלא יישבר Vite Fast Refresh: ה-rule
 * react-refresh/only-export-components אוסר על קובץ שיש בו קומפוננטה לייצא
 * גם פונקציות שאינן קומפוננטות (זה גורם ל-full reload בכל hot update).
 */
export const useAppData = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppData must be used within an AppProvider');
    }
    return context;
};
