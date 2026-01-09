import React, { useState, useEffect, useRef } from "react";
import { avior } from "../Api/Client";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { useAppData } from '../context/AppContext';
import PublicDisplayHeader from "../Components/pagesComp/publicdisplay/PublicDisplayHeader";
import RideCard from "../Components/pagesComp/publicdisplay/RideCard";
import RideDetailsModal from "../Components/pagesComp/publicdisplay/RideDetailsModal";
import NoRidesMessage from "../Components/pagesComp/publicdisplay/NoRidesMessage";

export default function PublicDisplay() {
    const { user } = useAppData();
    const [selectedRide, setSelectedRide] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const containerRef = useRef(null);

    // --- עדכון הזמן הנוכחי כל שנייה ---
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- שליפת נסיעות עם סינון ותזמון מחדש ---
    const { data: rides = [] } = useQuery({
        queryKey: ['rides'],
        queryFn: async () => {
            const allRides = await avior.entities.Ride.list(user.city);
            return allRides;
        },
        refetchInterval: 5000, 
        initialData: []
    });

    // חישוב תצוגת זמן ונקודת צבע לכל נסיעה
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
        <div className="h-full flex flex-col overflow-hidden relative">

            <div className=" px-8 flex-shrink-0">
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
                                className="grid grid-cols-1 gap-6 w-full"
                            >
                                {rides.map((ride) => (
                                    <div
                                        key={ride.id}
                                        onClick={() => setSelectedRide(ride)} // עדכון ה-State בעת לחיצה
                                        className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]" // הוספת אנימציית לחיצה קטנה ב-CSS
                                    >
                                        <RideCard
                                            key={ride.id}
                                            ride={ride}
                                            currentTime={currentTime}
                                            getTimeDisplay={getTimeDisplay}
                                            getTimeColor={getTimeColor}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {selectedRide && (
                            <RideDetailsModal 
                                ride={selectedRide} 
                                onClose={() => setSelectedRide(null)} 
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}