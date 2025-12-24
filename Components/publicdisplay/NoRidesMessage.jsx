import React from "react";
import { motion } from "framer-motion";
import { Car } from "lucide-react";

export default function NoRidesMessage() {
    return (
        <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center py-32"
        >
            <div className="w-32 h-32 mx-auto mb-8 bg-white/10 rounded-full flex items-center justify-center">
                <Car className="w-16 h-16 text-white/40" />
            </div>
            <h2 className="text-4xl font-bold text-white/60 mb-4">
                אין טרמפים כרגע
            </h2>
            <p className="text-2xl text-white/40">
                מחכים לנהגים...
            </p>
        </motion.div>
    );
}