import React, { useState } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Car, MapPin, Send, Loader2, Clock, Users } from "lucide-react";
import { formatRideTime } from "@/lib/utils";
import Location from "./rideform/location";

// חישוב מסגרת הזמנים ההתחלתית — היום, +שבוע, וגם תאריך/שעה ראשוניים
// מתוך departureTime. רץ פעם אחת ב-mount דרך lazy useState (במקום useEffect).
function getInitialBounds(departureTime) {
    const target = departureTime || new Date();
    const offset = target.getTimezoneOffset() * 60000;
    const localISO = (new Date(target - offset)).toISOString().slice(0, -1);

    const now = new Date();
    const nowLocal = (new Date(now - offset)).toISOString().slice(0, -1);

    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    const nextWeekLocal = (new Date(nextWeek - offset)).toISOString().slice(0, -1);

    return {
        initialDate: localISO.split('T')[0],
        initialTime: localISO.split('T')[1].slice(0, 5),
        minDate: nowLocal.split('T')[0],
        maxDate: nextWeekLocal.split('T')[0],
    };
}

export default function RideForm({
    user, // מקבלים את המשתמש מהאבא
    driverName,
    setDriverName,
    location, // שדה המוצא
    setLocation,
    destination,
    setDestination,
    seats,
    setSeats,
    departureTime,
    setDepartureTime,
    onSubmit,
    isSubmitting
}) {
    // bounds מחושב פעם אחת ב-mount דרך lazy initializer. אין צורך ב-useEffect:
    // dateStr/timeStr נשארים mutable, minDate/maxDate הם קבועים לכל הסשן.
    const [bounds] = useState(() => getInitialBounds(departureTime));
    const [dateStr, setDateStr] = useState(bounds.initialDate);
    const [timeStr, setTimeStr] = useState(bounds.initialTime);
    const { minDate, maxDate } = bounds;

    // פונקציה שמאחדת תאריך ושעה ומעדכנת את האבא
    const updateParentTime = (newDateStr, newTimeStr) => {
        if (newDateStr && newTimeStr) {
            const newDate = new Date(`${newDateStr}T${newTimeStr}`);
            setDepartureTime(newDate);
        }
    };

    const handleDateChange = (e) => {
        const val = e.target.value;
        setDateStr(val);
        updateParentTime(val, timeStr);
    };

    const handleTimeChange = (e) => {
        const val = e.target.value;
        setTimeStr(val);
        updateParentTime(dateStr, val);
    };

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {/* שדה מי אני */}
            <div className="space-y-1">
                <Label htmlFor="driver" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Car className="w-4 h-4 text-teal-400" />
                    מי נוהג?
                </Label>
                <Input
                    id="driver"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder='שם הנהג...'
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-teal-500"
                    required
                />
            </div>

            {/* שדה מאיפה (עם טאבים) */}
            <div className="space-y-1">
                <Location user={user} location={location} setLocation={setLocation} />
            </div>

            {/* שדה לאן */}
            <div className="space-y-1">
                <Label htmlFor="destination" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    לאן אני נוסע? (יעד)
                </Label>
                <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder='לדוגמה: רכבת מרכז...'
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-teal-500"
                    required
                />
            </div>

            {/* שדה מספר מושבים */}
            <div className="space-y-1">
                <Label htmlFor="seats" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-400" />
                    מספר מושבים פנויים
                </Label>
                <Input
                    id="seats"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    placeholder='לדוגמה: 4'
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-teal-500"
                    required
                />
            </div>

            {/* מתי יוצאים (החלק המעודכן) */}
            <div className="space-y-1">
                <Label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400" />
                    מתי יוצאים?
                </Label>

                <div className="flex gap-2">
                    {/* שדה תאריך */}
                    <div className="relative flex-1">
                        <input
                            type="date"
                            value={dateStr}
                            min={minDate}
                            max={maxDate}
                            onChange={handleDateChange}
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-teal-500 text-center"
                            required
                        />
                    </div>

                    {/* שדה שעה */}
                    <div className="relative flex-1">
                        <input
                            type="time"
                            value={timeStr}
                            onChange={handleTimeChange}
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-teal-500 text-center text-lg tracking-wide"
                            required
                        />
                    </div>
                </div>

                {/* תצוגת טקסט חכמה */}
                <div className="text-sm text-teal-400 text-center font-bold mt-2 bg-teal-950/30 p-2 rounded-lg border border-teal-900/50">
                    {departureTime ? formatRideTime(departureTime) : '...'}
                </div>
            </div>

            {/* כפתור שליחה */}
            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 shadow-lg text-white border-0"
            >
                {isSubmitting ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        שולח...
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        פרסם נסיעה <Send className="w-5 h-5" />
                    </div>
                )}
            </Button>
        </form>
    );
}