import React from "react";
import { motion } from "framer-motion";
import { Car, MapPin, Clock, User } from "lucide-react";
import { formatRideTime } from "@/lib/utils"; // <--- הייבוא החשוב

export default function RideCard({ ride, currentTime }) {

    // חישוב צבע לפי הזמן (דחוף = אדום, רחוק = ירוק)
    // currentTime נדרש מהפרנט; אין fallback ל-Date.now() כדי לשמור על הרכיב טהור.
    const getTimeColor = () => {
        const now = currentTime instanceof Date ? currentTime : new Date(currentTime);
        const departure = new Date(ride.departure_time);
        const diffMinutes = (departure - now) / 1000 / 60;

        if (diffMinutes < 0) return "from-red-900/50 to-red-800/50 border-red-500/30"; // עבר זמן
        if (diffMinutes < 60) return "from-orange-900/50 to-amber-800/50 border-orange-500/30"; // קרוב (שעה)
        return "from-slate-800 to-slate-800 border-slate-700"; // רגיל
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="group">

            <div className={`w-full px-2 relative bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border transition-all hover:border-slate-500 ${getTimeColor()}`}>

                {/* פס צבעוני עדין בצד */}
                <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-gradient-to-b from-teal-500 to-blue-600" />

                <div className="p-4 flex flex-col gap-4">

                    {/* שורה עליונה: נהג וזמן */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            {/* אייקון משתמש */}
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 shadow-inner">
                                <User className="w-5 h-5 text-teal-400" />
                            </div>

                            {/* מיכל לטקסט - מסודר בעמודה */}
                            <div className="flex flex-col">

                                {/* שורה 1: שם ומושבים */}
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold text-white leading-tight">
                                        {ride.driver_name},
                                    </span>
                                    <span className="text-sm text-slate-300 leading-tight tabular-nums">
                                        מקומות פנויים: {ride.seats}
                                    </span>
                                </div>

                                {/* שורה 2: זמן יציאה */}
                                {/* F37: tabular-nums keeps the ticking countdown ("N דקות") from jittering column width */}
                                <div className="flex items-center gap-1.5 pt-1 text-teal-400 text-sm font-medium tabular-nums">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatRideTime(ride.departure_time, currentTime)}
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* מסלול: מאיפה לאן (Visual Timeline) */}
                    <div className="relative pr-4">
                        {/* קו מחבר */}
                        <div className="absolute top-2 right-[5px] bottom-2 w-0.5 bg-slate-700 rounded-full" />

                        {/* מוצא */}
                        <div className="flex items-start gap-3 mb-3 relative">
                            <div className="w-3 h-3 rounded-full bg-slate-900 border-2 border-teal-500 z-10 mt-1.5 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                            <div>
                                <p className="text-xs text-slate-500 mb-0.5">יוצא מ:</p>
                                <p className="text-slate-200 font-medium text-base leading-snug">
                                    {ride.location || "לא צוין מיקום"}
                                </p>
                            </div>
                        </div>

                        {/* יעד */}
                        <div className="flex items-start gap-3 relative">
                            <MapPin className="w-4 h-4 text-orange-500 z-10 mt-1" />
                            <div>
                                <p className="text-xs text-slate-500 mb-0.5">נוסע ל:</p>
                                <p className="text-white font-bold text-lg leading-snug shadow-black drop-shadow-sm">
                                    {ride.destination}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}