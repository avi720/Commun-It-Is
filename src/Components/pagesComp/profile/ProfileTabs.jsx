import React from 'react';
import { Grid3x3, Car } from 'lucide-react';

const TABS = [
    { key: 'posts', label: 'פוסטים', icon: Grid3x3 },
    { key: 'rides', label: 'טרמפים', icon: Car },
];

export default function ProfileTabs({ active, onChange }) {
    return (
        <div role="tablist" aria-label="תוכן הפרופיל" className="flex border-b border-slate-700">
            {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = active === t.key;
                return (
                    <button
                        key={t.key}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`tab-panel-${t.key}`}
                        id={`tab-${t.key}`}
                        onClick={() => onChange(t.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-inset
                            ${isActive
                                ? 'text-teal-400 border-teal-400'
                                : 'text-slate-400 border-transparent hover:text-white'}
                        `}
                    >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}

export const PROFILE_TAB_KEYS = TABS.map((t) => t.key);
