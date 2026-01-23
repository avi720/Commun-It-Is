import React from 'react';
import { LogOut, Trash2, AlertTriangle } from 'lucide-react';

export default function DangerZone({ onReset }) {
    return (
        <div className="bg-red-950/40 border border-red-900 rounded-2xl p-6 space-y-4 mt-8">
            <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                אזור מסוכן
            </h2>

            <div className="flex flex-col gap-3">
                <button 
                    onClick={onReset}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-red-600/40 text-red-200 hover:text-red-300 hover:bg-red-100/5 hover:border-red-600 transition-all"
                >
                    <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> מחיקת חשבון</span>
                </button>
            </div>
        </div>
    );
}