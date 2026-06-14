import React from 'react';
import { Info, FileText } from 'lucide-react';

// __APP_VERSION__ is replaced at build time by Vite (define) — falls back to
// 'dev' in local dev. The replacement is wired in vite.config.js if available;
// otherwise we read it from package.json via Vite's import.meta.env if exposed.
const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

export default function AboutSection() {
    return (
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-400" />
                מידע ותמיכה
            </h2>

            <div className="space-y-2">
                <a
                    href="/privacy-policy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-900 transition-colors text-slate-200"
                >
                    <FileText className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    <span className="text-sm">מדיניות פרטיות</span>
                </a>
            </div>

            <p className="text-center text-xs text-slate-500 pt-2">
                Commun-it-is • גרסה {VERSION}
            </p>
        </section>
    );
}
