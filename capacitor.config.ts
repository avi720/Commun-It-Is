import { CapacitorConfig } from '@capacitor/cli';

// --- כאן אתה מגדיר את הכתובות שלך ---
const render_URL = "aaa"; // הכתובת המשתנה

// --- המפסק: שנה ל-true כשאתה יוצא מהבית ---
const USE_CLOUDFLARE = false;

const config: CapacitorConfig = {
  appId: 'com.CommunItIs.myapp',
  appName: 'commun-it-is',
  webDir: 'dist',
  server: {
    // כאן הקסם קורה: הוא בוחר לבד לפי המפסק למעלה
    url: render_URL,
    cleartext: true
  }
};

export default config;