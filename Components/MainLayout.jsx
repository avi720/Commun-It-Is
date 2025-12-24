import React, { useState, useEffect} from 'react';
import { Menu } from 'lucide-react';
import { Outlet} from 'react-router-dom';
import Sidebar from './HomePageComp/Sidebar';

export default function MainLayout({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('tremp_userData');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
      setUserData(parsedUser);
    }
    // 2. בדיקה מול השרת: האם המשתמש הזה באמת קיים?
      fetch(`${API_URL}/users/check/${parsedUser.email}`)
        .then(response => {
            if (!response.ok) {
                // אופס! השרת לא מכיר אותנו (כנראה ה-DB נמחק)
                console.warn("User not found in DB - logging out");
                onLogout(); // זורק את המשתמש החוצה
            }
        })
        .catch(err => {
            console.error("Connection error:", err);
            // כאן אפשר להחליט אם לנתק או לתת להמשיך (למשל אם אין אינטרנט)
        });
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
      <main className="flex-1 overflow-y-auto relative">
        <Outlet context={{ user: userData }} /> 
      </main>

    </div>
  );
}