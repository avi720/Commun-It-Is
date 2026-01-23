import React from "react";
import { motion } from "framer-motion";
//import { Car, Users } from "lucide-react";

export default function PublicDisplayHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
        >
            <p className="text-2xl text-teal-200 mt-3 font-medium">
                טרמפים זמינים עכשיו
            </p>
        </motion.div>
    );
}