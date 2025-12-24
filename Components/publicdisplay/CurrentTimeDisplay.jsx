import React from "react";
import { motion } from "framer-motion";

export default function CurrentTimeDisplay({ currentTime }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-5 left-5 bg-white/10 backdrop-blur-lg px-4 py-1 rounded-2xl border border-white/20"
        >
            <p className="text-2xl font-bold text-white">
                {currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
        </motion.div>
    );
}