# Commun-It-Is

אפליקציית קהילה (טרמפים, פוסטים, ספר טלפונים והתראות) הבנויה ב-React + Vite,
עם backend ב-FastAPI (Python) ו-Supabase לאימות ולנתונים.

האפליקציה רצה כ-Web App ונפרסת ל-**Vercel** (frontend + backend באותו פרויקט).
עטיפת ה-Android (Capacitor) נשמרת בתיקיית `android/` לפרסום עתידי לחנויות
האפליקציות — היא טוענת את אתר ה-Web המפורסם.

## פיתוח מקומי

```bash
npm install
npm run dev      # מריץ את ה-frontend (Vite) על http://localhost:5173
```

הרצת ה-backend מקומית (אופציונלי):

```bash
pip install -r requirements.txt
uvicorn src.server.main:app --reload --port 8000
```

## משתני סביבה

העתק את `.env.example` ל-`.env` ומלא את הערכים. ב-Vercel יש להזין אותם
בלוח הבקרה (Project Settings → Environment Variables).

### Frontend (build-time — חייבים קידומת `VITE_`)
| משתנה | תיאור |
|-------|-------|
| `VITE_SUPABASE_URL` | כתובת פרויקט Supabase |
| `VITE_SUPABASE_KEY` | מפתח anon של Supabase |
| `VITE_GOOGLE_MAPS_API_KEY` | מפתח Google Maps |
| `VITE_API_URL` | (אופציונלי) כתובת ה-API. ברירת מחדל: `/api` |

### Backend (runtime)
| משתנה | תיאור |
|-------|-------|
| `VITE_SUPABASE_URL` | אותו ערך כמו ב-frontend |
| `SUPABASE_SERVICE_KEY` | מפתח service role של Supabase (server-only) |
| `FIREBASE_CREDENTIALS` | מפתח Firebase Admin כ-JSON במחרוזת אחת |

## פריסה ל-Vercel

1. חבר את הריפו ל-Vercel (Import Project) או הרץ `vercel --prod` דרך ה-CLI.
2. הגדרות הבנייה נקראות אוטומטית מ-`vercel.json`:
   - בנייה: `npm run build` → פלט ל-`dist/`.
   - ה-backend (FastAPI) מתארח כ-Serverless Function מתוך `api/index.py`.
   - ניתוב: `/api/*` → ה-backend; כל השאר → `index.html` (SPA fallback ל-React Router).
3. הזן את כל משתני הסביבה (ראה למעלה).
4. לאחר הפריסה, עדכן את `server.url` ב-`capacitor.config.ts` לכתובת ה-Vercel
   החדשה אם תרצה לבנות מחדש את אפליקציית ה-Android.
