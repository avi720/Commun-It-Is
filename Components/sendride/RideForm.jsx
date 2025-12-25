import React, { useState, useEffect } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Car, MapPin, Send, Home, Navigation, Loader2, Clock} from "lucide-react";
import { formatRideTime } from "@/lib/utils";

export default function RideForm({
    user, // מקבלים את המשתמש מהאבא
    driverName,
    setDriverName,
    location, // שדה המוצא
    setLocation,
    destination,
    setDestination,
    departureTime,
    setDepartureTime,
    onSubmit,
    isSubmitting
}) {
    // מצבים פנימיים לניהול ה-UI של המיקום
    const [originMode, setOriginMode] = useState('manual'); 
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    // ניהול נפרד של השדות בטופס (מחרוזות)
    const [dateStr, setDateStr] = useState(""); 
    const [timeStr, setTimeStr] = useState("");
    const [minDate, setMinDate] = useState("");
    const [maxDate, setMaxDate] = useState("");

    // אתחול ראשוני
    useEffect(() => {
        const target = departureTime || new Date();
        
        // התאמה לאזור זמן מקומי (ישראל) כדי שהתאריך ב-input יהיה נכון
        const offset = target.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(target - offset)).toISOString().slice(0, -1);
        
        setDateStr(localISOTime.split('T')[0]);
        setTimeStr(localISOTime.split('T')[1].slice(0, 5));

        // חישוב גבולות (היום עד עוד שבוע)
        const now = new Date();
        const nowLocal = (new Date(now - offset)).toISOString().slice(0, -1);
        setMinDate(nowLocal.split('T')[0]);
        
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        const nextWeekLocal = (new Date(nextWeek - offset)).toISOString().slice(0, -1);
        setMaxDate(nextWeekLocal.split('T')[0]);

    }, []); // רץ רק פעם אחת בטעינה

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

    // פונקציה למילוי כתובת הבית
    const fillHomeAddress = (e) => {
        e.preventDefault(); // מניעת רענון
        if (user?.city && user?.address) {
            setLocation(`${user.address}, ${user.city}`);
        } else if (user?.address) {
            setLocation(user.address);
        }
        setOriginMode('home');
    };

    // פונקציה למציאת מיקום נוכחי (GPS)
    const handleCurrentLocation = (e) => {
        e.preventDefault();
        setOriginMode('gps');
        setIsLoadingLocation(true);
        setLocation("מאתר מיקום...");

        if (!navigator.geolocation) {
            alert("הדפדפן לא תומך במיקום");
            setIsLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // המרה לכתובת בעברית דרך OpenStreetMap
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=he`,
                        { headers: { 'User-Agent': 'TrempikatziaApp/1.0' } }
                    );
                    const data = await response.json();
                    
                    // ניסיון לקחת את שם הרחוב והעיר
                    let address = data.address.road || data.address.pedestrian || '';
                    if (data.address.house_number) address += ' ' + data.address.house_number;
                    if (data.address.city || data.address.town || data.address.village) {
                        address += ', ' + (data.address.city || data.address.town || data.address.village);
                    }
                    
                    // אם לא הצלחנו להרכיב, ניקח את הכתובת המלאה שחזרה
                    if (address.length < 5) address = data.display_name.split(',')[0];

                    setLocation(address);
                } catch (error) {
                    console.error("Error fetching address:", error);
                    setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                } finally {
                    setIsLoadingLocation(false);
                }
            },
            (error) => {
                console.error(error);
                alert("לא הצלחנו למצוא את המיקום");
                setIsLoadingLocation(false);
                setLocation("");
            }
        );
    };

    return (
        <div onSubmit={onSubmit} className="space-y-6">
            {/* שדה מי אני */}
            <div className="space-y-2">
                <Label htmlFor="driver" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Car className="w-4 h-4 text-teal-400" />
                    מי אני?
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
            <div className="space-y-3">
                <Label htmlFor="location" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    מאיפה אני נוסע?
                </Label>

                {/* כפתורי בחירה מהירה */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                    <button
                        onClick={fillHomeAddress}
                        className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-all ${
                            originMode === 'home' 
                            ? 'bg-slate-700 text-white shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Home className="w-4 h-4" />
                        מהבית
                    </button>
                    <button
                        onClick={handleCurrentLocation}
                        className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-all ${
                            originMode === 'gps' 
                            ? 'bg-teal-600 text-white shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {isLoadingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                        מיקום נוכחי
                    </button>
                </div>

                <Input
                    id="location"
                    value={location}
                    onChange={(e) => {
                        setLocation(e.target.value);
                        setOriginMode('manual');
                    }}
                    placeholder='או הקלד כתובת...'
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-teal-500"
                    required
                />
            </div>

            {/* שדה לאן */}
            <div className="space-y-2">
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

            {/* מתי יוצאים (החלק המעודכן) */}
            <div className="space-y-2">
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
                className="w-full py-6 text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 shadow-lg text-white border-0"
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
        </div>
    );
}