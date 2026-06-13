import React, { useState } from 'react';
import { Users, Store, Settings, Shield, Megaphone } from 'lucide-react';
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
        <div className="w-full h-full flex flex-col text-white pb-20">
            {/* F36: title block uses min-w-0 + truncate inside flex to prevent the long community name from pushing past the viewport edge */}
            <div className="p-4 bg-slate-800/50 border-b border-slate-700">
                <h1 className="text-xl font-bold flex items-center gap-2 text-amber-400 min-w-0">
                    <Shield className="w-6 h-6 shrink-0" aria-hidden="true" />
                    <span className="truncate">ניהול קהילה: {community?.name || 'טוען...'}</span>
                </h1>
                <button
                    onClick={() => setShowMsgModal(true)}
                    className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg mt-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
                >
                    <Megaphone className="w-4 h-4" aria-hidden="true" />
                    שלח הודעה לכולם
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
