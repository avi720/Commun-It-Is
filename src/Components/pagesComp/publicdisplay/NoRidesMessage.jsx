import React from "react";
import { motion } from "framer-motion";
import { Car, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/Components/ui/button";

export default function NoRidesMessage() {
    return (
        <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center max-w-md md:max-w-lg mx-auto"
        >
            <div className="w-32 h-32 mx-auto mb-8 bg-white/10 rounded-full flex items-center justify-center">
                <Car className="w-16 h-16 text-slate-500" aria-hidden="true" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-300 mb-4">
                אין טרמפים כרגע
            </h2>
            <p className="text-slate-400 text-sm mb-6">
                אף אחד לא פרסם נסיעה לאחרונה. אתה יכול להיות הראשון!
            </p>
            <Button asChild>
                <Link to="/send-ride">
                    <Send className="w-4 h-4" aria-hidden="true" />
                    שתף נסיעה
                </Link>
            </Button>
        </motion.div>
    );
}
