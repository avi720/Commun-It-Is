import React from "react";
import { Card, CardContent } from "@/Components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SuccessNotification({ isVisible }) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                    exit={{ opacity: 0, y: -50, scale: 0.9, x: "-50%" }}
                    className="fixed bottom-8 left-1/2 z-50"
                >
                    <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl border-none">
                        <CardContent className="flex items-center gap-4 py-6 px-8">
                            <CheckCircle2 className="w-8 h-8" />
                            <div>
                                <p className="text-xl font-bold">ההודעה נשלחה בהצלחה!</p>
                                <p className="text-green-100">הנוסעים רואים את ההודעה שלך</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}