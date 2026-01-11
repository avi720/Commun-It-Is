import React from 'react';
import { Menu } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './mainlayoutComp/Sidebar';
import HomePage from '@/Pages/HomePage';
import { useAppData } from '../context/AppContext';

export default function MainLayout() {
  const navigate = useNavigate();

  const { user, logout, toggleSidebar } = useAppData();

  return (
    // 1. המעטפת הראשית: תופסת את כל הגובה, ומונעת גלילה של כל העמוד (רק התוכן יגלול)
    <div className="flex flex-col h-screen w-full bg-[#0f172a] text-white overflow-hidden">

      {/* 2. HEADER: 
          משתמש ב-padding-top דינמי כדי לא לדרוס את השעון/סוללה.
          הרקע נמתח עד הכי למעלה.
      */}
      <header className="w-full flex-none z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 pt-[env(safe-area-inset-top)] shadow-sm transition-all duration-300">

        {/* ה-div הפנימי: מחזיק את הכפתורים בגובה קבוע ונוח לאצבע */}
        <div className="h-14 w-full flex items-center justify-between px-4">

          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors active:scale-95 touch-manipulation"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          <div
            onClick={() => navigate('/')}
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
          >
            <h1 className="text-lg font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent select-none truncate max-w-[200px]">
              {user?.city ? `קהילת ${user.city}` : 'קהילת טרמפיקציה'}
            </h1>
          </div>
        </div>

      </header>

      {/* 3. MAIN CONTENT:
          לוקח את כל המקום שנשאר (flex-1).
          הגלילה קורית *רק* כאן (overflow-y-auto).
          ה-padding-bottom דואג שהתוכן האחרון לא יוסתר על ידי הפס של האייפון.
      */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 pb-[env(safe-area-inset-bottom)]">
        {/* ה-div הזה נותן רווח פנימי לתוכן עצמו */}
        <div className="w-full min-h-full">
          <Outlet />
        </div>
      </main>

      <Sidebar
        onLogout={logout}
        user={user}
      />
    </div>
  );
}