import React, { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './mainlayoutComp/Sidebar';
import { useAppData } from '../context/useAppData';
import { supabase } from '../Api';

export default function MainLayout() {
  const navigate = useNavigate();

  // logout removed from Sidebar — it lives at the bottom of /settings now.
  const { user } = useAppData();

  // Header label: show the ACTIVE community's name, not the user's city. With
  // multi-community membership the user can switch active communities; the
  // header must follow the active one (otherwise the label keeps showing the
  // city the user lives in regardless of which community they're viewing).
  // Falls back to user.city for the rare case where the lookup fails.
  const { data: activeCommunity } = useQuery({
    queryKey: ['active-community', user?.community_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('name')
        .eq('id', user.community_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.community_id,
    staleTime: 60_000,
  });
  // Strip a leading "קהילת" from the community name to avoid "קהילת קהילת X"
  // when the operator named their community "קהילת ..." literally.
  const formatLabel = (raw) => {
    if (!raw) return null;
    const trimmed = raw.trim();
    return trimmed.startsWith('קהילת ') ? trimmed : `קהילת ${trimmed}`;
  };
  const headerLabel =
    formatLabel(activeCommunity?.name) ||
    formatLabel(user?.city) ||
    'קהילת טרמפיקציה';

  // מצב הסיידבר חי כאן (מקומית) ולא ב-AppContext כדי שדפים שלא צריכים אותו
  // לא ירונדרו מחדש בכל פתיחה/סגירה. דפים שכן צריכים (למשל HomePage שמדמדם
  // את ה-FAB מאחורי הסיידבר) מקבלים אותו דרך useOutletContext().
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    // F25: h-dvh (dynamic viewport height) avoids iOS Safari address-bar jumps that h-screen produced.
    // F45: at md+ the sidebar is persistent (rendered always in-flow), so main shifts with md:mr-64.
    <div className="flex flex-col h-dvh w-full bg-[#0f172a] text-white overflow-hidden">

      <header className="md:mr-64 w-auto flex-none z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 pt-[env(safe-area-inset-top)] shadow-sm transition-all duration-300">

        {/* ה-div הפנימי: מחזיק את הכפתורים בגובה קבוע ונוח לאצבע */}
        <div className="h-14 w-full flex items-center justify-between px-4">

          <button
            onClick={toggleSidebar}
            aria-label="פתח תפריט"
            title="פתח תפריט"
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-800 rounded-full transition-colors active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <Menu className="w-6 h-6 text-white" aria-hidden="true" />
          </button>

          <div
            onClick={() => navigate('/')}
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
          >
            <h1 className="text-lg font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent select-none truncate max-w-[200px] md:max-w-[360px]">
              {headerLabel}
            </h1>
          </div>
        </div>

      </header>

      {/* 3. MAIN CONTENT:
          לוקח את כל המקום שנשאר (flex-1).
          הגלילה קורית *רק* כאן (overflow-y-auto).
          ה-padding-bottom דואג שהתוכן האחרון לא יוסתר על ידי הפס של האייפון.
      */}
      <main className="md:mr-64 flex-1 overflow-y-auto overflow-x-hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 pb-[env(safe-area-inset-bottom)]">
        {/* ה-div הזה נותן רווח פנימי לתוכן עצמו */}
        <div className="w-full min-h-full">
          <Outlet context={{ isSidebarOpen }} />
        </div>
      </main>

      <Sidebar
        user={user}
        isSidebarOpen={isSidebarOpen}
        closeSidebar={closeSidebar}
      />
    </div>
  );
}