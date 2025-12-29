import { useState } from "react";
import { Home, Navigation, Loader2 } from "lucide-react";   
    
export default function LocationForm({
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
    return(
        handleCurrentLocation, fillHomeAddress, isLoadingLocation, location, originMode
    );
}