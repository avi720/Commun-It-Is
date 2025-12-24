import React from "react";
import { motion } from "framer-motion";
import { Car, MapPin, Clock } from "lucide-react";

export default function RideCard({ ride, currentTime, getTimeDisplay, getTimeColor }) {
    const timeDisplay = getTimeDisplay(ride.departure_time);

    if (!timeDisplay) return null;

    return (
        <motion.div
            key={ride.id}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="group"
        >
            <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-3xl border-4 border-white/50">
                {/* פס צבעוני עליון */}
                <div className={`h-3 bg-gradient-to-r ${getTimeColor(ride.departure_time)}`} />

                <div className="p-4">
                    {/* שם הנהג */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                            <Car className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">נהג</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {ride.driver_name}
                            </h3>
                        </div>
                    </div>

                    {/* יעד */}
                    <div className="flex items-start gap-4 mb-6 bg-slate-50 rounded-2xl p-6">
                        <MapPin className="w-8 h-8 text-teal-600 flex-shrink-0 mt-1" />
                        <div>
                            <p className="text-sm text-slate-500 font-medium mb-1">יעד</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {ride.destination}
                            </p>
                        </div>
                    </div>

                    {/* זמן יציאה */}
                    <div className={`flex items-center gap-4 bg-gradient-to-r ${getTimeColor(ride.departure_time)} rounded-2xl p-6 text-white shadow-lg`}>
                        <Clock className="w-8 h-8 flex-shrink-0" />
                        <div>
                            <p className="text-sm opacity-90 font-medium mb-1">זמן יציאה</p>
                            <p className="text-3xl font-black">
                                {timeDisplay}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}