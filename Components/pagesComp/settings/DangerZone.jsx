import React from 'react';
import { LogOut, Trash2, AlertTriangle } from 'lucide-react';

export default function DangerZone({ onLogout, onReset }) {
    return (
        <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 space-y-4 mt-8">
            <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                אזור מסוכן
            </h2>

            <div className="flex flex-col gap-3">
                <button 
                    onClick={onLogout}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                    <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> התנתק מהמערכת</span>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded">רק יציאה</span>
                </button>

                <button 
                    onClick={onReset}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-red-900/30 text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-all"
                >
                    <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> איפוס ומחיקת נתונים</span>
                    <span className="text-xs bg-red-950/50 px-2 py-1 rounded border border-red-900/30">זהירות</span>
                </button>
            </div>
        </div>
    );
}