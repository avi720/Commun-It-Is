import React, { useState, useEffect, useRef } from "react";
import { base44 } from "../Api/Client"; 
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import PublicDisplayHeader from "../Components/publicdisplay/PublicDisplayHeader";
import RideCard from "../Components/publicdisplay/RideCard";
import NoRidesMessage from "../Components/publicdisplay/NoRidesMessage";
import CurrentTimeDisplay from "../Components/publicdisplay/CurrentTimeDisplay";

export default function PublicDisplay() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { data: rides = [] } = useQuery({
        queryKey: ['rides'],
        queryFn: async () => {
            const allRides = await base44.entities.Ride.list('-created_date');
            const now = new Date();
            return allRides.filter(ride => {
                const departureTime = new Date(ride.departure_time);
                return now < new Date(departureTime.getTime() + 10 * 60 * 1000);
            }).sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
        },
        refetchInterval: 5000, 
        initialData: []
    });

    // --- לוגיקת גלילה מתוקנת ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isAutoScrollEnabled || rides.length === 0) return;

        let scrollInterval;
        let resetTimeout;
        let restartTimeout; // 1. המשתנה החדש שעוקב אחרי ההפעלה מחדש

        const startScrolling = () => {
            if (container.scrollHeight <= container.clientHeight) return;

            scrollInterval = setInterval(() => {
                // בדיקה אם הגענו לתחתית
                if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {
                    clearInterval(scrollInterval);
                    
                    resetTimeout = setTimeout(() => {
                        container.scrollTo({ top: 0, behavior: 'smooth' });
                        
                        // 2. כאן התיקון: שמרנו את הטיימר הזה למשתנה
                        restartTimeout = setTimeout(() => {
                            startScrolling();
                        }, 2000);

                    }, 2000);
                } else {
                    container.scrollTop += 2; 
                }
            }, 40); 
        };

        startScrolling();

        // 3. ניקוי יסודי: מוחקים את כל סוגי הטיימרים כשמכבים את הכפתור
        return () => {
            clearInterval(scrollInterval);
            clearTimeout(resetTimeout);
            clearTimeout(restartTimeout); // חיסול ה"זומבי"
        };
    }, [isAutoScrollEnabled, rides.length]);

    const getTimeDisplay = (departureTime) => {
        const diffMinutes = Math.floor((new Date(departureTime) - currentTime) / 1000 / 60);
        if (diffMinutes <= 0) return `יצא לפני: ${Math.abs(diffMinutes)} דק'`;
        if (diffMinutes < 1) return "יוצא עכשיו";
        return `יוצא בעוד: ${diffMinutes} דקות`;
    };

    const getTimeColor = (departureTime) => {
        const diffMinutes = Math.floor((new Date(departureTime) - currentTime) / 1000 / 60);
        if (diffMinutes <= 0) return "from-red-500 to-rose-600";
        if (diffMinutes <= 5) return "from-amber-500 to-orange-600";
        return "from-teal-500 to-cyan-600";
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 overflow-hidden relative">
            
            {/* כפתור גלילה אוטומטית */}
            {rides.length > 0 && (
                <div 
                    onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
                    className="fixed top-10 left-10 z-50 flex items-center gap-4 px-5 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-xl cursor-pointer hover:bg-black/60 transition-all select-none group"
                >
                    <span className="text-white/90 font-medium text-lg">גלילה אוטומטית</span>
                    <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${
                        isAutoScrollEnabled ? 'bg-teal-500' : 'bg-slate-600 group-hover:bg-slate-500'
                    }`}>
                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                            isAutoScrollEnabled ? '-translate-x-6' : 'translate-x-0'
                        }`} />
                    </div>
                </div>
            )}

            <div className="pt-8 px-8 flex-shrink-0">
                <PublicDisplayHeader />
            </div>

            <div className="flex-1 overflow-hidden relative min-h-0">
                <div 
                    ref={containerRef} 
                    className={`h-full overflow-y-auto scroll-smooth px-8 ${
                        rides.length === 0 ? "flex items-center justify-center" : ""
                    }`}
                >
                    <AnimatePresence mode="popLayout">
                        {rides.length === 0 ? (
                            <NoRidesMessage />
                        ) : (
                            <div 
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full"
                                style={{ paddingBottom: '30px' }} 
                            >
                                {rides.map((ride) => (
                                    <RideCard
                                        key={ride.id}
                                        ride={ride}
                                        currentTime={currentTime}
                                        getTimeDisplay={getTimeDisplay}
                                        getTimeColor={getTimeColor}
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex-shrink-0">
                <CurrentTimeDisplay currentTime={currentTime} />
            </div>
        </div>
    );
}