import { useState } from "react";
import { Home, Navigation, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";

export default function Location({
    user,
    location,
    setLocation
}) {
    // מצבים פנימיים לניהול ה-UI של המיקום
    const [originMode, setOriginMode] = useState('manual');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // פונקציה למילוי כתובת הבית מהפרופיל   
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
            toast.error("הדפדפן לא תומך במיקום");
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
                toast.error("לא הצלחנו למצוא את המיקום");
                setIsLoadingLocation(false);
                setLocation("");
            }
        );
    };
    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor="location" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                מאיפה אני נוסע?
            </Label>

            {/* כפתורי בחירה מהירה */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                    onClick={fillHomeAddress}
                    className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-all ${originMode === 'home'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Home className="w-4 h-4" />
                    מהבית
                </button>
                <button
                    onClick={handleCurrentLocation}
                    className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-all ${originMode === 'gps'
                        ? 'bg-teal-700 text-white shadow-sm'
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
    );
}