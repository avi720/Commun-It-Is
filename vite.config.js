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
  },
  server: {
    // 2. הגדרת הפרוקסי (הקסם קורה כאן)
    proxy: {
      '/api': {
        target: 'https://commun-it-is.onrender.com', // הכתובת המקומית של השרת שלך
        changeOrigin: true,
        secure: false,
      }
    }
  }
})