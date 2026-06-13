//import CitySelect from '../Components/ui/CitySelect';
import React, { useState, useEffect, useRef } from 'react';
import { Map, Loader2, Check } from 'lucide-react';
import { Input } from "@/Components/ui/input";

export default function CitySelect({ value, onChange, placeholder = "בחר יישוב" }) {
    const [query, setQuery] = useState(value || '');
    const [allCities, setAllCities] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    // isLoading עכשיו באמת מתחלף בזמן ה-fetch — בעבר הוא היה מוגדר אבל setIsLoading
    // לא נקרא אף פעם, כך שהלואדר לא הציג כלום (ESLint תפס את זה).
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef(null);

    // 1. טעינת רשימת הערים מהמאגר הממשלתי בעלייה
    useEffect(() => {
        const fetchCities = async () => {
            setIsLoading(true);
            try {
                // משיכת נתונים מ-data.gov.il (רשימת יישובים)
                const resourceId = '5c78e9fa-c2e2-4771-93ff-7f400a12f7ba'; // מזהה המאגר
                const limit = 3000; // יש כ-1200 יישובים, לוקחים מרווח ביטחון
                const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}&limit=${limit}`;

                const response = await fetch(url);
                const data = await response.json();

                // עיבוד הנתונים: שליפת שם היישוב וניקוי רווחים מיותרים
                const cities = data.result.records
                    .map(record => record['שם_ישוב'].trim())
                    .filter(city => city !== 'לא רשום') // מסננים זבל
                    .sort();

                setAllCities(cities);
            } catch (error) {
                console.error("Failed to fetch cities:", error);
                // במקרה של תקלה אפשר להשתמש ברשימה מקומית קטנה לגיבוי אם רוצים
            } finally {
                setIsLoading(false);
            }
        };

        fetchCities();
    }, []);

    // 2. סגירת הרשימה כשלוחצים בחוץ
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // 3. סינון הרשימה בזמן הקלדה
    const handleInputChange = (e) => {
        const userInput = e.target.value;
        setQuery(userInput);
        onChange(userInput); // מעדכן את הטופס הראשי גם אם זה לא מהרשימה (זמנית)

        if (userInput.length > 1) {
            const filtered = allCities.filter(city => 
                city.includes(userInput) // חיפוש גמיש (גם באמצע מילה)
            );
            setSuggestions(filtered);
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const handleSelectCity = (city) => {
        setQuery(city);
        onChange(city); // עדכון הטופס הראשי בערך שנבחר
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <Map className="absolute right-3 top-3 h-5 w-5 text-slate-400 z-10" />
                <Input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="bg-slate-900 border-slate-700 pr-10 text-white rounded-lg focus:border-teal-500"
                    onFocus={() => query.length > 1 && setIsOpen(true)}
                    required
                />
                {isLoading && (
                    <div className="absolute left-3 top-3">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                    </div>
                )}
            </div>

            {/* רשימת ההצעות */}
            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl scrollbar-thin scrollbar-thumb-slate-600">
                    {suggestions.map((city, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelectCity(city)}
                            className="px-4 py-3 text-slate-200 hover:bg-teal-900/30 hover:text-teal-400 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-700/50 last:border-0"
                        >
                            <span>{city}</span>
                            {query === city && <Check className="h-4 w-4 text-teal-500" />}
                        </li>
                    ))}
                </ul>
            )}
            
            {isOpen && suggestions.length === 0 && query.length > 1 && (
                <div className="absolute z-50 w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-sm text-center">
                    לא נמצא יישוב בשם זה
                </div>
            )}
        </div>
    );
}