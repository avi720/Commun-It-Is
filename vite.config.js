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
      "@": path.resolve(__dirname, "."),
    },
  },
  server: {
    // 1. מאפשרים כניסה מ-ngrok
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
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