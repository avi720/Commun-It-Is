import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // <--- הוקים לניווט
import { Home, Car, Monitor, Send, Settings, X, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ isOpen, onClose, onLogout }) {
  const [isTrempOpen, setIsTrempOpen] = useState(false);
  
  const navigate = useNavigate(); // פונקציה למעבר דפים
  const location = useLocation(); // איפה אני נמצא עכשיו?
  
  // פונקציית עזר לניווט
  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  // בדיקה אם הנתיב הנוכחי פעיל (לצורך צביעת הכפתור)
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-64 bg-slate-900 border-l border-slate-800 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">תפריט</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          
          {/* דף הבית */}
          <button 
            onClick={() => handleNavigation('/')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/') ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">דף הבית</span>
          </button>

          {/* טרמפיקציה */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsTrempOpen(!isTrempOpen)}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors ${['/rides', '/send'].some(p => location.pathname.includes(p)) ? 'bg-slate-800' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-orange-400" />
                <span className="font-medium">טרמפיקציה</span>
              </div>
              {isTrempOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isTrempOpen && (
              <div className="mr-4 space-y-1 border-r-2 border-slate-700 pr-2">
                <button 
                  onClick={() => handleNavigation('/rides')}
                  className={`w-full flex items-center gap-3 p-2 text-sm rounded-lg transition-colors ${isActive('/rides') ? 'text-teal-400 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
                >
                  <Monitor className="w-4 h-4" />
                  לוח טרמפים
                </button>
                <button 
                  onClick={() => handleNavigation('/send')}
                  className={`w-full flex items-center gap-3 p-2 text-sm rounded-lg transition-colors ${isActive('/send') ? 'text-teal-400 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
                >
                  <Send className="w-4 h-4" />
                  פרסם נסיעה
                </button>
              </div>
            )}
          </div>

        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 space-y-2 bg-slate-900">
          <button 
            onClick={() => handleNavigation('/settings')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/settings') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
            <span>הגדרות</span>
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>התנתק</span>
          </button>
        </div>

      </div>
    </>
  );
}