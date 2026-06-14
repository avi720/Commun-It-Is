import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

export default function PostActionsMenu({ onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-label="פעולות על הפוסט"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
                <MoreVertical className="w-5 h-5" aria-hidden="true" />
            </button>
            {open && (
                <div
                    role="menu"
                    className="absolute top-full left-0 mt-1 min-w-[140px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden"
                >
                    <button
                        role="menuitem"
                        onClick={() => { setOpen(false); onEdit?.(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                        ערוך
                    </button>
                    <button
                        role="menuitem"
                        onClick={() => { setOpen(false); onDelete?.(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        מחק
                    </button>
                </div>
            )}
        </div>
    );
}
