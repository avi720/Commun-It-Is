import { StrictMode } from 'react' // ייבוא ספציפי במקום הכללי
import { createRoot } from 'react-dom/client' // ייבוא הפונקציה ישירות
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import './index.css'

// --- Sentry error tracking (T19) ---
// יוזם רק אם יש DSN ב-env. ב-dev (ללא DSN) — שקט. בפרוד — שולח שגיאות ל-Sentry.
// ה-DSN הוא public ולא סוד; אפשר לראות אותו ב-bundle. ההגנה: רק פרויקט הזה
// מקבל אירועים, ולא יוצא מידע מ-Sentry החוצה.
//
// privacy:
// - sendDefaultPii: false → לא שולח cookies/IP/headers רגישים
// - Sentry.setUser({ id }) נקרא ב-AppContext עם UUID בלבד, בלי שם/מייל/טלפון
// - replayIntegration עם maskAllText + blockAllMedia → אם יוקלט session replay,
//   הטקסט יוסתר וקבצי מדיה יחסמו (רלוונטי רק לשגיאות, לא ל-sessions רגילים)
if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_RELEASE || 'dev',
        sendDefaultPii: false,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
        ],
        // 10% מהבקשות נדגמות עם performance traces (מספיק לזיהוי slow paths,
        // לא ממלא את ה-quota החינמי של Sentry)
        tracesSampleRate: 0.1,
        // 0% session replays רגילים — רק כשיש שגיאה (100% מהמקרים האלה)
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
    })
}

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
        {/* Sentry.ErrorBoundary תופס שגיאות render שלא נתפסו ע"י React. */}
        <Sentry.ErrorBoundary
            fallback={({ error }) => (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-400 mb-3">משהו השתבש</h1>
                    <p className="text-slate-400 mb-4">השגיאה דווחה אוטומטית, אנחנו כבר על זה.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                        רענן את הדף
                    </button>
                    {import.meta.env.DEV && (
                        <pre className="mt-6 text-xs text-slate-500 max-w-2xl overflow-auto">
                            {error?.message}
                        </pre>
                    )}
                </div>
            )}
        >
            {/* עטיפת האפליקציה כולה בספק הנתונים */}
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </Sentry.ErrorBoundary>
    </StrictMode>,
)
