import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// הוספת הייבוא של React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// יצירת מופע של הלקוח
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* עטיפת האפליקציה כולה בספק הנתונים */}
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </React.StrictMode>,
)