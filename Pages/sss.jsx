import React, { useState, useEffect } from 'react';
import { Users, Store, Settings, Check, X, Shield, Filter } from 'lucide-react';
import { supabase } from '../Api/Client';
import { useAppData } from '../context/AppContext';


export default function CommitteeDashboard() {
    const [activeTab, setActiveTab] = useState('businesses');
    const [loading, setLoading] = useState(true);
    const { user } = useAppData();
    // Data States
    const [pendingBusinesses, setPendingBusinesses] = useState([]);
    const [residents, setResidents] = useState([]);
    const [communitySettings, setCommunitySettings] = useState(null);

    useEffect(() => {
        if (user?.community_id) {
            fetchAllData();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Pending Businesses
            const { data: busData } = await supabase
                .from('businesses')
                .select('*')
                .eq('community_id', user.community_id)
                .eq('is_verified_by_committee', false); // רק אלו שלא אושרו

            setPendingBusinesses(busData || []);

            // 2. Fetch Residents
            const { data: resData } = await supabase
                .from('users') // שים לב: אנחנו שולפים מ-public.users
                .select('*')
                .eq('community_id', user.community_id);

            setResidents(resData || []);

            // 3. Fetch Community Settings
            const { data: comData } = await supabase
                .from('communities')
                .select('*')
                .eq('id', user.community_id)
                .single();

            setCommunitySettings(comData);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // פעולה: אישור עסק
    const approveBusiness = async (businessId) => {
        const { error } = await supabase
            .from('businesses')
            .update({ is_verified_by_committee: true })
            .eq('id', businessId);

        if (!error) {
            // הסר את העסק מהרשימה המקומית
            setPendingBusinesses(prev => prev.filter(b => b.id !== businessId));
            alert("העסק אושר בהצלחה! כעת הוא יופיע עם וי כחול בחיפוש.");
        }
    };

    if (!user || user.community_role !== 'committee') {
        return <div className="p-8 text-center text-red-400">אין לך הרשאה לצפות בדף זה.</div>;
    }

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 text-white pb-20">

            {/* כותרת הדשבורד */}
            <div className="p-4 bg-slate-800/50 border-b border-slate-700">
                <h1 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                    <Shield className="w-6 h-6" />
                    ניהול קהילה: {communitySettings?.name || 'טוען...'}
                </h1>
            </div>

            {/* טאבים למעבר */}
            <div className="flex p-2 gap-2 overflow-x-auto">
                <TabButton
                    active={activeTab === 'businesses'}
                    onClick={() => setActiveTab('businesses')}
                    icon={<Store className="w-4 h-4" />}
                    label={`אישור עסקים (${pendingBusinesses.length})`}
                />
                <TabButton
                    active={activeTab === 'residents'}
                    onClick={() => setActiveTab('residents')}
                    icon={<Users className="w-4 h-4" />}
                    label="תושבים"
                />
                <TabButton
                    active={activeTab === 'settings'}
                    onClick={() => setActiveTab('settings')}
                    icon={<Settings className="w-4 h-4" />}
                    label="הגדרות"
                />
            </div>

            {/* תוכן ראשי */}
            <div className="flex-1 overflow-y-auto pt-4">
                {loading ? (
                    <div className="text-center p-10 text-slate-400">טוען נתונים...</div>
                ) : (
                    <>
                        {/* --- טאב עסקים --- */}
                        {activeTab === 'businesses' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-300">עסקים שממתינים לאישור</h2>
                                {pendingBusinesses.length === 0 ? (
                                    <div className="p-6 bg-slate-800 rounded-xl text-center text-slate-400">
                                        אין עסקים חדשים לאישור כרגע 🎉
                                    </div>
                                ) : (
                                    pendingBusinesses.map(business => (
                                        <div key={business.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-lg">{business.name}</h3>
                                                <p className="text-sm text-slate-400">{business.category} • {business.phone}</p>
                                                <p className="text-xs text-slate-500 mt-1">{business.description}</p>
                                            </div>
                                            <button
                                                onClick={() => approveBusiness(business.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg"
                                            >
                                                <Check className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* --- טאב תושבים (תצוגת טבלה) --- */}
                        {activeTab === 'residents' && (
                            <div className="space-y-4">
                                <h2 className="pr-4 text-lg font-semibold text-slate-300">
                                    תושבי הקהילה ({residents.length})
                                </h2>


                                {/* המיכל הזה הוא גם המסגרת המעוצבת וגם האחראי על הגלילה */}
                                <div className="w-max overflow-x-auto bg-slate-800 rounded-xl border border-slate-700 shadow-sm">

                                    {/* min-w-max מכריח את הטבלה להיות ברוחב התוכן שלה, מה שמפעיל את הגלילה */}
                                    <table className="min-w-max w-full text-sm text-right text-slate-300">
                                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
                                            <tr>
                                                <th className="px-6 py-4 whitespace-nowrap font-semibold">שם מלא</th>
                                                <th className="px-6 py-4 whitespace-nowrap font-semibold">יישוב</th>
                                                <th className="px-6 py-4 whitespace-nowrap font-semibold">כתובת</th>
                                                <th className="px-6 py-4 whitespace-nowrap font-semibold">טלפון</th>
                                                <th className="px-6 py-4 whitespace-nowrap font-semibold">אימייל</th>
                                                <th className="px-6 py-4 whitespace-nowrap font-semibold">גיל</th>
                                                <th className="px-6 py-4 whitespace-nowrap font-semibold">תפקיד</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {residents.map((resident, index) => (
                                                <tr
                                                    key={resident.id || index}
                                                    className="hover:bg-slate-700/50 transition-colors"
                                                >
                                                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                                        {resident.firstName} {resident.lastName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {resident.city || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {resident.address || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" dir="ltr">
                                                        {resident.phone || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {resident.email || 'לא זמין'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {resident.age || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {resident.community_role === 'committee' ? (
                                                            <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full text-xs border border-amber-500/20 font-medium">
                                                                ועד
                                                            </span>
                                                        ) : (
                                                            <span className="bg-slate-700/80 text-slate-300 px-2 py-1 rounded-full text-xs">
                                                                תושב
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* הודעה אם אין נתונים */}
                                    {residents.length === 0 && (
                                        <div className="p-12 text-center text-slate-500">
                                            לא נמצאו תושבים ברשימה
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- טאב הגדרות --- */}
                        {activeTab === 'settings' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-300">הגדרות הקהילה</h2>
                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                    <label className="block text-sm text-slate-400 mb-1">שם הקהילה</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={communitySettings?.name || ''}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white opacity-50"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        * כרגע לא ניתן לשנות שם קהילה באופן עצמאי.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// רכיב עזר לכפתור טאב
function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`
        flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm
        ${active
                    ? 'bg-amber-500 text-white font-bold shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
      `}
        >
            {icon}
            {label}
        </button>
    );
}