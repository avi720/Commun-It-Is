import React from 'react';
import { Menu } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './mainlayoutComp/Sidebar';
import { useAppData } from '../context/AppContext';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const navigate = useNavigate();

  const { user, logout } = useAppData();

 return (
    <div className="flex flex-col h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      
      <header className="flex-none h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 z-30 relative shadow-sm">
        
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <Menu className="w-6 h-6 text-white" />
        </button>

        {/* כותרת לחיצה שחוזרת לבית */}
        <div 
            onClick={() => navigate('/')} 
            className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
        >
           <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent select-none">
             {user?.city ? `קהילת ${user.city}` : 'קהילת טרמפיקציה'}
           </h1>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
        <Outlet />
      </main>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onLogout={logout}
        user={user}
      />
    </div>
  );
}