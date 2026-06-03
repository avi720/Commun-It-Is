import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015', // תומך במכשירים ישנים יותר
    outDir: 'dist',
    minify: 'esbuild', // אופציונלי, לפעמים עוזר לביצועים
    rollupOptions: {
      output: {
        // פיצול ספריות הצד-שלישי לחבילות (chunks) נפרדות.
        // הן משתנות לעיתים רחוקות, ולכן נשמרות ב-cache של הדפדפן
        // בין פריסות - כך שעדכוני קוד שלנו לא מחייבים הורדה מחדש שלהן.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'data-vendor': ['@supabase/supabase-js', '@tanstack/react-query', 'date-fns'],
        },
      },
    },
  },
  server: {
    // 2. הגדרת הפרוקסי (הקסם קורה כאן)
    proxy: {
      '/api': {
        target: 'https://commun-it-is.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})