import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Pencil, Shield, Award } from 'lucide-react';

function badgesFor(user) {
    const out = [];
    if (user?.community_role === 'committee') {
        out.push({
            label: 'חבר ועד',
            icon: Shield,
            className: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        });
    }
    // "תושב ותיק" — 12+ months since joining
    if (user?.created_at) {
        const ageMs = Date.now() - new Date(user.created_at).getTime();
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        if (ageMs >= oneYearMs) {
            out.push({
                label: 'תושב ותיק',
                icon: Award,
                className: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
            });
        }
    }
    return out;
}

export default function ProfileHeader({ user }) {
    const navigate = useNavigate();
    const initials = `${(user?.firstName || '?')[0] || ''}${(user?.lastName || '')[0] || ''}`.toUpperCase();
    const badges = badgesFor(user);

    return (
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 pt-8">
            {/* Top-right: gear → /settings (like Instagram/TikTok) */}
            <button
                onClick={() => navigate('/settings')}
                aria-label="הגדרות"
                title="הגדרות"
                className="absolute top-3 left-3 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
                <Settings className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="flex flex-col items-center gap-4 text-center">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-3xl font-bold text-white shrink-0">
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span aria-hidden="true">{initials || '?'}</span>
                    )}
                </div>

                {/* Name */}
                <h2 className="text-2xl font-bold text-white">
                    {user?.firstName} {user?.lastName}
                </h2>

                {/* Badges */}
                {badges.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {badges.map((b) => {
                            const Icon = b.icon;
                            return (
                                <span
                                    key={b.label}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${b.className}`}
                                >
                                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                                    {b.label}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Bio */}
                {user?.bio && (
                    <p className="text-sm text-slate-300 max-w-md whitespace-pre-wrap">
                        {user.bio}
                    </p>
                )}

                {/* Edit button */}
                <button
                    onClick={() => navigate('/profile/edit')}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    עריכת פרופיל
                </button>
            </div>
        </div>
    );
}
