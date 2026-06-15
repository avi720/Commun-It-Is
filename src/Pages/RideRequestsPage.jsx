import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { avior } from '../Api';
import { useAppData } from '../context/useAppData';
import RideCard from '../Components/pagesComp/publicdisplay/RideCard';
import RideDetailsModal from '../Components/pagesComp/publicdisplay/RideDetailsModal';

/**
 * /ride-requests — community board of "I'm looking for a ride" posts.
 *
 * Uses the same RideCard primitive as the live offers board (PublicDisplay).
 * Server-filtered to `type=request` and the existing 10-minute grace window
 * (upcoming=true) so requests that already departed are pruned.
 */
export default function RideRequestsPage() {
    const { session } = useAppData();
    const navigate = useNavigate();
    const [selectedRide, setSelectedRide] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { data: rides = [], isLoading } = useQuery({
        queryKey: ['ride-requests'],
        queryFn: () =>
            avior.entities.Ride.list(session, { type: 'request', upcoming: true }),
        enabled: !!session,
        refetchInterval: 5000,
        initialData: [],
    });

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Search className="w-5 h-5 text-amber-400" aria-hidden="true" />
                        בקשות טרמפ
                    </h1>
                    <p className="text-xs text-slate-400">
                        תושבים בקהילה שמחפשים טרמפ עכשיו
                    </p>
                </div>
                <button
                    onClick={() => navigate('/send-ride')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                >
                    <PlusCircle className="w-4 h-4" aria-hidden="true" />
                    פרסם בקשה
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {isLoading ? (
                    <div className="text-center text-slate-400 py-10">טוען בקשות…</div>
                ) : rides.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-slate-400 py-16 px-4"
                    >
                        <Search className="w-10 h-10 mx-auto mb-3 text-slate-600" aria-hidden="true" />
                        <p className="text-sm">אף אחד לא מחפש טרמפ כרגע.</p>
                        <p className="text-xs text-slate-500 mt-2">
                            אתה הראשון? לחץ &quot;פרסם בקשה&quot; כדי לעדכן את הקהילה.
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {rides.map((ride) => (
                                <div
                                    key={ride.id}
                                    onClick={() => setSelectedRide(ride)}
                                    className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    <RideCard ride={ride} currentTime={currentTime} />
                                </div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedRide && (
                    <RideDetailsModal
                        ride={selectedRide}
                        onClose={() => setSelectedRide(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
