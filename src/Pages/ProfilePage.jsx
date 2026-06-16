import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { useAppData } from '../context/useAppData';
import { avior } from '../Api';

import ProfileHeader from '../Components/pagesComp/profile/ProfileHeader';
import ProfileStats from '../Components/pagesComp/profile/ProfileStats';
import ProfileTabs from '../Components/pagesComp/profile/ProfileTabs';
import MyPostsGrid from '../Components/pagesComp/profile/MyPostsGrid';
import MyPostsScroll from '../Components/pagesComp/profile/MyPostsScroll';
import MyRidesList from '../Components/pagesComp/profile/MyRidesList';

export default function ProfilePage() {
    const { user, session } = useAppData();
    const [activeTab, setActiveTab] = useState('posts');
    const [searchParams, setSearchParams] = useSearchParams();
    const openPostId = searchParams.get('post') || null;

    const setOpenPostId = useCallback((id) => {
        if (id) {
            setSearchParams({ post: id }, { preventScrollReset: true });
        } else {
            setSearchParams({}, { preventScrollReset: true });
        }
    }, [setSearchParams]);

    const postsQuery = useQuery({
        queryKey: ['profile-posts', user?.id],
        queryFn: () => avior.entities.Post.list(session, { authorId: user?.id }),
        enabled: !!user?.id,
    });

    const ridesQuery = useQuery({
        queryKey: ['profile-rides', user?.id],
        queryFn: () =>
            avior.entities.Ride.list(session, { userId: user?.id, upcoming: false }),
        enabled: !!user?.id,
    });

    const posts = postsQuery.data || [];
    const rides = ridesQuery.data || [];

    const { offers, requests } = useMemo(() => {
        const o = [], r = [];
        for (const ride of rides) {
            (ride.type === 'request' ? r : o).push(ride);
        }
        return { offers: o, requests: r };
    }, [rides]);

    const joinedYear = user?.created_at
        ? new Date(user.created_at).getFullYear()
        : undefined;

    return (
        <div className="p-4 max-w-2xl mx-auto pb-20 overflow-y-auto h-full">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                <ProfileHeader user={user} />

                <ProfileStats
                    postCount={postsQuery.isLoading ? null : posts.length}
                    rideCount={ridesQuery.isLoading ? null : rides.length}
                    joinedYear={joinedYear}
                />

                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                    <ProfileTabs active={activeTab} onChange={setActiveTab} />

                    <div className="p-3">
                        {activeTab === 'posts' && (
                            <div role="tabpanel" id="tab-panel-posts" aria-labelledby="tab-posts">
                                {postsQuery.isLoading ? (
                                    <div className="text-center text-slate-400 py-10">טוען פוסטים…</div>
                                ) : (
                                    <MyPostsGrid posts={posts} onOpen={setOpenPostId} />
                                )}
                            </div>
                        )}

                        {activeTab === 'rides' && (
                            <div role="tabpanel" id="tab-panel-rides" aria-labelledby="tab-rides">
                                {ridesQuery.isLoading ? (
                                    <div className="text-center text-slate-400 py-10">טוען טרמפים…</div>
                                ) : (
                                    <MyRidesList
                                        offers={offers}
                                        requests={requests}
                                        queryKey={['profile-rides', user?.id]}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {openPostId && (
                <MyPostsScroll
                    posts={posts}
                    focusPostId={openPostId}
                    onClose={() => window.history.back()}
                    queryKey={['profile-posts', user?.id]}
                />
            )}
        </div>
    );
}
