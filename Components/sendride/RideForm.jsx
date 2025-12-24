import React, { useEffect } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Car, MapPin, Send } from "lucide-react";
import TimeSelection from "./TimeSelection";

export default function RideForm({
    driverName,
    setDriverName,
    destination,
    setDestination,
    departureMinutes,
    setDepartureMinutes,
    onSubmit,
    isSubmitting
}) {
    // מילוי אוטומטי של פרטי הנהג
    useEffect(() => {
        // מנסים לקרוא את פרטי המשתמש מהזיכרון
        const savedUser = localStorage.getItem('tremp_userData');
        
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                const fullName = `${user.firstName} ${user.lastName}`;
                
                // בדיקה אם השדה ריק לפני שדורסים אותו (כדי לא להפריע אם המשתמש כבר הקליד)
                if (!driverName) {
                    setDriverName(fullName);
                }
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
    }, []); // רץ רק פעם אחת כשהטופס עולה

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* שדה מי אני */}
            <div className="space-y-3">
                <Label htmlFor="driver" className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <Car className="w-5 h-5 text-teal-600" />
                    מי אני?
                </Label>
                <Input
                    id="driver"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder='לדוגמה: "חנן, אבא של יעל"'
                    className="text-lg py-6 border-2 focus:border-teal-500 transition-all"
                    required
                />
            </div>

            {/* שדה לאן */}
            <div className="space-y-3">
                <Label htmlFor="destination" className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    לאן אני נוסע?
                </Label>
                <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder='לדוגמה: "לרכבת מלאכי" או "לקסטינה"'
                    className="text-lg py-6 border-2 focus:border-teal-500 transition-all"
                    required
                />
            </div>

            {/* שדה מתי */}
            <TimeSelection
                selectedTime={departureMinutes}
                onSelectTime={setDepartureMinutes}
            />

            {/* כפתור שליחה */}
            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-7 text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
            >
                {isSubmitting ? (
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        שולח...
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Send className="w-6 h-6" />
                        שלח הודעה
                    </div>
                )}
            </Button>
        </form>
    );
}