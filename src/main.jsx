import { StrictMode } from 'react' // ייבוא ספציפי במקום הכללי
import { createRoot } from 'react-dom/client' // ייבוא הפונקציה ישירות
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'

// יצירת מופע של הלקוח — ברירות מחדל שמתאימות לאפליקציה:
// - staleTime של 30 שניות חוסך רענונים מיותרים בין ניווטים קצרים
// - refetchOnWindowFocus כבוי כי האפליקציה מותקנת כ-PWA / Capacitor ומיקוד חלון
//   הוא לא אינדיקטור אמיתי לכך שהדאטה התיישן.
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        },
    },
})

// שמירת האלמנט במשתנה לבדיקה
const rootElement = document.getElementById('root')

// בדיקת בטיחות - חנן מתעקש על זה
if (!rootElement) {
    throw new Error('Failed to find the root element')
}

createRoot(rootElement).render(
    <StrictMode>
        {/* עטיפת האפליקציה כולה בספק הנתונים */}
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </StrictMode>,
)