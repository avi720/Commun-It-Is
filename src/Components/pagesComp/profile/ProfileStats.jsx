import React from 'react';

export default function ProfileStats({ postCount, rideCount, joinedYear }) {
    const stats = [
        { value: postCount ?? '—', label: 'פוסטים' },
        { value: rideCount ?? '—', label: 'טרמפים' },
        { value: joinedYear ?? '—', label: 'הצטרף/ה' },
    ];

    return (
        <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
                <div
                    key={s.label}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center"
                >
                    <div className="text-2xl font-bold text-teal-400">{s.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                </div>
            ))}
        </div>
    );
}
