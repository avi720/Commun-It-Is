import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.CommunItIs.myapp',
  appName: 'commun-it-is',
  webDir: 'dist',
  server: {
    // כאן שמים את הכתובת של ה-Frontend שיצרנו הרגע ב-Render
    url: "https://commun-it-is-frontend.onrender.com",
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;