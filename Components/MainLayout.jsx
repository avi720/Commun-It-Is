import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom'; // <--- הרכיב החדש
import Sidebar from './HomePageComp/Sidebar';

export default function MainLayout({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('tremp_userData');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0f172a] text-white overflow-hidden">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 z-30 shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <Menu className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
          קהילת עזריקם
        </h1>
      </header>

      {/* Sidebar - כבר לא צריך להעביר לו currentView */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
      />

      {/* אזור התוכן */}
      <main className="pt-16 px-2 h-full overflow-y-auto pb-10">
        {/* מעבירים את המשתמש דרך ה-Context של הראוטר */}
        <Outlet context={{ user: userData }} /> 
      </main>

    </div>
  );
}