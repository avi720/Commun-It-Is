import React, { useState, useEffect} from 'react';
import { Menu } from 'lucide-react';
import { Outlet} from 'react-router-dom';
import Sidebar from './homePageComp/Sidebar';

export default function MainLayout({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const API_URL = "http://localhost:8000/api";

  useEffect(() => {
    const storedUser = localStorage.getItem('tremp_userData');
    
    if (storedUser) {
      try {
          const userFromFile = JSON.parse(storedUser);
          // --- הגנה: בדיקה אם הנתונים תקינים ---
          if (!userFromFile || !userFromFile.email) {
              console.warn("נתוני משתמש לא תקינים (חסר אימייל), מבצע יציאה...");
              onLogout(); // נתונים פגומים -> החוצה
              return;
          }
          // ------------------------------------
          setUserData(userFromFile);
          // בדיקה מול השרת
          fetch(`${API_URL}/users/check/${userFromFile.email}`)
            .then(response => {
                if (!response.ok) {
                    console.warn("המשתמש לא נמצא בשרת, מתנתק...");
                    onLogout(); 
                }
            })
            .catch(err => console.error("שגיאת חיבור לשרת:", err));
            
      } catch (e) {
          console.error("שגיאה בקריאת נתונים:", e);
          onLogout();
      }
    }
  }, [onLogout]);

  return (
    // השינוי הגדול: h-screen (גובה מסך בדיוק) ו-flex-col
    <div className="flex flex-col h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      
      {/* Header */}
      {/* הורדנו את fixed ושמנו flex-none (גובה קבוע שלא משתנה) */}
      <header className="flex-none h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 z-30 shadow-sm relative">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <Menu className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
         {userData?.city ? `קהילת ${userData.city}` : 'קהילת טרמפיקציה'}
        </h1>
      </header>

      {/* Sidebar - נשאר כמו שהוא כי הוא Fixed מעל הכל */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
      />

      {/* אזור התוכן */}
      {/* flex-1: תפוס את כל המקום שנשאר אחרי ההדר */}
      {/* overflow-y-auto: אם התוכן ארוך, תגלול רק כאן בפנים */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 relative">
        <Outlet context={{ user: userData }} /> 
      </main>

    </div>
  );
}