import React from "react";
import { motion } from "framer-motion";
import { Car, Users } from "lucide-react";

export default function PublicDisplayHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
        >
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-lg px-8 py-2 rounded-3xl shadow-2xl border border-white/20">
                <Car className="w-10 h-10 text-teal-400" />
                <h1 className="text-6xl font-black text-white relative bottom-2.5">טרמפיקציה</h1>
                <Users className="w-10 h-10 text-teal-400" />
            </div>
            <p className="text-2xl text-teal-200 mt-3 font-medium">
                טרמפים זמינים עכשיו
            </p>
        </motion.div>
    );
}