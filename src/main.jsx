import { StrictMode } from 'react' // ייבוא ספציפי במקום הכללי
import { createRoot } from 'react-dom/client' // ייבוא הפונקציה ישירות
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'

// יצירת מופע של הלקוח
const queryClient = new QueryClient()

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