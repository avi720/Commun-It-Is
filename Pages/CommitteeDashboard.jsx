import React, { useState, useEffect } from 'react';
import { Users, Store, Settings, Check, X, Shield, Filter } from 'lucide-react';
import { supabase, avior } from '../Api/Client';
import { useAppData } from '../context/AppContext';

export default function CommitteeDashboard() {
    const [activeTab, setActiveTab] = useState('businesses');
    const [loading, setLoading] = useState(true);
    const { user } = useAppData();

    const [showMsgModal, setShowMsgModal] = useState(false);
    const [msgData, setMsgData] = useState({ title: '', body: '' });

    // Data States
    const [pendingBusinesses, setPendingBusinesses] = useState([]);
    const [residents, setResidents] = useState([]);
    const [communitySettings, setCommunitySettings] = useState(null);

    // Filter State: 'all' | 'verified' | 'unverified'
    const [residentFilter, setResidentFilter] = useState('all');

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
                .eq('is_verified_by_committee', false);

            setPendingBusinesses(busData || []);

            // 2. Fetch Residents
            const { data: resData } = await supabase
                .from('users')
                .select('*')
                .eq('community_id', user.community_id)
                .order('created_at', { ascending: false }); // החדשים ביותר ראשונים

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
            setPendingBusinesses(prev => prev.filter(b => b.id !== businessId));
            alert("העסק אושר בהצלחה!");
        }
    };

    // פעולה: שינוי סטטוס תושב (Toggle)
    const toggleResidentStatus = async (residentId, currentStatus) => {
        const newStatus = !currentStatus;

        // עדכון אופטימי (מיידי) בממשק
        setResidents(prev => prev.map(r =>
            r.id === residentId ? { ...r, is_verified_as_resident: newStatus } : r
        ));

        // שליחה לשרת
        const { error } = await supabase
            .from('users')
            .update({ is_verified_as_resident: newStatus })
            .eq('id', residentId);

        if (error) {
            console.error("Error updating resident status:", error);
            // אם נכשל, נחזיר את המצב לקדמותו
            setResidents(prev => prev.map(r =>
                r.id === residentId ? { ...r, is_verified_as_resident: currentStatus } : r
            ));
            alert("אירעה שגיאה בעדכון הסטטוס");
        }
    };

    // סינון הרשימה לפי הבחירה
    const filteredResidents = residents.filter(resident => {
        if (residentFilter === 'all') return true;
        if (residentFilter === 'verified') return resident.is_verified_as_resident;
        if (residentFilter === 'unverified') return !resident.is_verified_as_resident;
        return true;
    });

    const handleSendNotification = async () => {
        if (!msgData.title || !msgData.body) return alert("חובה למלא כותרת ותוכן");

        if (confirm("לשלוח את ההודעה לכל חברי הקהילה?")) {
            try {
                await avior.notifications.sendToCommunity(
                    msgData.title,
                    msgData.body,
                    user.community_id,
                    "ועד הקהילה"
                );
                alert("ההודעה נשלחה בהצלחה! 🚀");
                setShowMsgModal(false);
                setMsgData({ title: '', body: '' });
            } catch (e) {
                alert("שגיאה בשליחה");
            }
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
                <button
                    onClick={() => setShowMsgModal(true)}
                    className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
                >
                    📢 שלח הודעה לכולם
                </button>
            </div>

            {/* טאבים למעבר */}
            <div className="flex p-2 gap-2 overflow-x-auto border-b border-slate-800">
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
                    label="ניהול תושבים"
                />
                <TabButton
                    active={activeTab === 'settings'}
                    onClick={() => setActiveTab('settings')}
                    icon={<Settings className="w-4 h-4" />}
                    label="הגדרות"
                />
            </div>

            {/* תוכן ראשי */}
            <div className="flex-1 overflow-y-auto pt-4 px-2">
                {loading ? (
                    <div className="text-center p-10 text-slate-400">טוען נתונים...</div>
                ) : (
                    <>
                        {/* --- טאב עסקים --- */}
                        {activeTab === 'businesses' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-300 px-2">עסקים שממתינים לאישור</h2>
                                {pendingBusinesses.length === 0 ? (
                                    <div className="p-6 bg-slate-800 rounded-xl text-center text-slate-400 mx-2">
                                        אין עסקים חדשים לאישור כרגע 🎉
                                    </div>
                                ) : (
                                    pendingBusinesses.map(business => (
                                        <div key={business.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center mx-2">
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

                        {/* --- טאב תושבים (הטבלה המאוחדת) --- */}
                        {activeTab === 'residents' && (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4">
                                    <h2 className="text-lg font-semibold text-slate-300">
                                        תושבי הקהילה ({filteredResidents.length})
                                    </h2>

                                    {/* כפתורי סינון */}
                                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                                        <FilterButton
                                            active={residentFilter === 'all'}
                                            onClick={() => setResidentFilter('all')}
                                            label="הכל"
                                        />
                                        <FilterButton
                                            active={residentFilter === 'unverified'}
                                            onClick={() => setResidentFilter('unverified')}
                                            label="ממתינים לאישור"
                                            alert={residents.some(r => !r.is_verified_as_resident)}
                                        />
                                        <FilterButton
                                            active={residentFilter === 'verified'}
                                            onClick={() => setResidentFilter('verified')}
                                            label="מאושרים"
                                        />
                                    </div>
                                </div>

                                <div className="w-full overflow-x-auto bg-slate-800 rounded-xl border border-slate-700 shadow-sm mx-auto max-w-[98%]">
                                    <table className="min-w-max w-full text-sm text-right text-slate-300">
                                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">סטטוס (לחץ לשינוי)</th>
                                                <th className="px-4 py-3 font-semibold">שם מלא</th>
                                                <th className="px-4 py-3 font-semibold">פרטים</th>
                                                <th className="px-4 py-3 font-semibold">יצירת קשר</th>
                                                <th className="px-4 py-3 font-semibold">תפקיד</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {filteredResidents.map((resident) => (
                                                <tr key={resident.id} className="hover:bg-slate-700/50 transition-colors">

                                                    {/* עמודת סטטוס לחיצה */}
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <button
                                                            onClick={() => toggleResidentStatus(resident.id, resident.is_verified_as_resident)}
                                                            className={`
                                                                flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all active:scale-95
                                                                ${resident.is_verified_as_resident
                                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                                                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}
                                                            `}
                                                        >
                                                            {resident.is_verified_as_resident ? (
                                                                <><Check className="w-3 h-3" /> מאושר</>
                                                            ) : (
                                                                <><X className="w-3 h-3" /> לא מאושר</>
                                                            )}
                                                        </button>
                                                    </td>

                                                    <td className="px-4 py-3 font-medium text-white">
                                                        {resident.firstName} {resident.lastName}
                                                        <div className="text-xs text-slate-500 font-normal mt-0.5">גיל: {resident.age || '-'}</div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="text-xs text-slate-400">{resident.city}</div>
                                                        <div className="text-xs text-slate-500">{resident.address}</div>
                                                    </td>

                                                    <td className="px-4 py-3" dir="ltr">
                                                        <div className="text-xs">{resident.phone}</div>
                                                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{resident.email}</div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        {resident.community_role === 'committee' ? (
                                                            <span className="text-amber-500 text-xs font-bold border border-amber-500/20 px-2 py-0.5 rounded-full bg-amber-500/10">
                                                                ועד
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500 text-xs">תושב</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {filteredResidents.length === 0 && (
                                        <div className="p-12 text-center text-slate-500">
                                            לא נמצאו תושבים בקטגוריה זו
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- טאב הגדרות --- */}
                        {activeTab === 'settings' && (
                            <div className="space-y-4 px-2">
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
            {showMsgModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-700">
                        <h3 className="text-xl font-bold text-white mb-4">שליחת הודעה לקהילה</h3>
                        <input
                            className="w-full bg-slate-800 text-white p-3 rounded mb-3 border border-slate-700"
                            placeholder="כותרת ההודעה"
                            value={msgData.title}
                            onChange={e => setMsgData({ ...msgData, title: e.target.value })}
                        />
                        <textarea
                            className="w-full bg-slate-800 text-white p-3 rounded mb-4 h-32 border border-slate-700"
                            placeholder="תוכן ההודעה..."
                            value={msgData.body}
                            onChange={e => setMsgData({ ...msgData, body: e.target.value })}
                        />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowMsgModal(false)} className="text-gray-400">ביטול</button>
                            <button onClick={handleSendNotification} className="bg-teal-600 text-white px-6 py-2 rounded">שלח</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// כפתור טאב ראשי
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

// כפתור סינון קטן
function FilterButton({ active, onClick, label, alert }) {
    return (
        <button
            onClick={onClick}
            className={`
                px-3 py-1.5 rounded-md text-xs font-medium transition-all relative
                ${active
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
            `}
        >
            {label}
            {alert && !active && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
        </button>
    );
}