import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.CommunItIs.myapp',
  appName: 'commun-it-is',
  webDir: 'dist',
  server: {
    // כתובת ה-Frontend המפורסם ב-Vercel (האפליקציה טוענת את אתר ה-Web)
    url: "https://commun-it-is-phone.vercel.app",
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;