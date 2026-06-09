import React, { useState } from 'react';
import { Users, Store, Settings, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../Api';
import { useAppData } from '../context/useAppData';
import BusinessesTab from '@/Components/pagesComp/committeeDashboard/BusinessesTab';
import ResidentsTab from '@/Components/pagesComp/committeeDashboard/ResidentsTab';
import CommunitySettingsTab from '@/Components/pagesComp/committeeDashboard/CommunitySettingsTab';
import SendCommitteeMessageModal from '@/Components/pagesComp/committeeDashboard/SendCommitteeMessageModal';

/**
 * דשבורד ועד — קליפה דקה. כל טאב הוא קומפוננטה נפרדת עם useQuery משלו.
 * הקליפה מחזיקה רק את:
 *  - מצב הטאב הפעיל
 *  - שם הקהילה לכותרת (useQuery קל ל-cache 'community')
 *  - ספירה של עסקים שעדיין צריך לאשר (לכותרת הטאב — מתעדכן דרך callback מהטאב)
 *  - state של מודאל השליחה לקהילה
 */
export default function CommitteeDashboard() {
    const { user } = useAppData();
    const [activeTab, setActiveTab] = useState('businesses');
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [businessesCount, setBusinessesCount] = useState(0);

    const communityId = user?.community_id;

    const { data: community } = useQuery({
        queryKey: ['community', communityId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('communities')
                .select('name')
                .eq('id', communityId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!communityId,
    });

    if (!user || user.community_role !== 'committee') {
        return <div className="p-8 text-center text-red-400">אין לך הרשאה לצפות בדף זה.</div>;
    }

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 text-white pb-20">
            <div className="p-4 bg-slate-800/50 border-b border-slate-700">
                <h1 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                    <Shield className="w-6 h-6" />
                    ניהול קהילה: {community?.name || 'טוען...'}
                </h1>
                <button
                    onClick={() => setShowMsgModal(true)}
                    className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg mt-2"
                >
                    📢 שלח הודעה לכולם
                </button>
            </div>

            <div className="flex p-2 gap-2 overflow-x-auto border-b border-slate-800">
                <TabButton
                    active={activeTab === 'businesses'}
                    onClick={() => setActiveTab('businesses')}
                    icon={<Store className="w-4 h-4" />}
                    label={`ניהול עסקים (${businessesCount})`}
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

            <div className="flex-1 overflow-y-auto pt-4 px-2">
                {activeTab === 'businesses' && (
                    <BusinessesTab communityId={communityId} onCountChange={setBusinessesCount} />
                )}
                {activeTab === 'residents' && <ResidentsTab communityId={communityId} />}
                {activeTab === 'settings' && <CommunitySettingsTab communityId={communityId} />}
            </div>

            <SendCommitteeMessageModal
                open={showMsgModal}
                onClose={() => setShowMsgModal(false)}
                communityId={communityId}
            />
        </div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm ${
                active
                    ? 'bg-amber-500 text-white font-bold shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
        >
            {icon}
            {label}
        </button>
    );
}
