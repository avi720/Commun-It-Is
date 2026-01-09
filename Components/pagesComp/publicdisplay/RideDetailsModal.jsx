// Components/RideDetailsModal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar, User, Phone } from 'lucide-react'; // או כל ספריית אייקונים שיש לך
import { Button } from "@/Components/ui/button";
import { formatRideTime } from "@/lib/utils";
import { formatDate } from 'date-fns';

export default function RideDetailsModal({ ride, onClose }) {
  if (!ride) return null;

  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  // יצירת קישור למפה - דורש API KEY או שימוש בקישור חיפוש פשוט
  // זו גרסה פשוטה של Embed ללא צורך ב-API KEY מורכב לשימוש בסיסי (iframe)
  // הערה: לשימוש מקצועי מומלץ Google Maps Embed API Key
  const mapSrc = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_API_KEY}&origin=${ride.location}&destination=${ride.destination}&mode=driving`;
  // אופציה חינמית ללא API KEY (פחות יפה אבל עובדת):
  // const mapSrc = `https://maps.google.com/maps?q=${ride.location} to ${ride.destination}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()} // מונע סגירה כשלוחצים על המודל עצמו
      >
        {/* כפתור סגירה */}
        <button onClick={onClose} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full z-10">
          <X size={20} />
        </button>

        {/* תמונת מפה / אזור עליון */}
        <div className="h-48 w-full bg-slate-800 relative">
             {/* כאן נכנס ה-Iframe של גוגל */}
             <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                style={{ border: 0 }} 
                src={mapSrc} // כאן משתמשים במשתנה שהגדרנו למעלה
                allowFullScreen 
             ></iframe>
             <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-slate-900 to-transparent h-20" />
        </div>

        {/* תוכן המודל */}
        <div className="p-6 space-y-6">
            
            {/* כותרת ויעד */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">פרטי הנסיעה</h2>
                <div className="flex items-center gap-2 text-teal-400">
                    <MapPin size={18} />
                    <span className="text-lg">{ride.location} ◄ {ride.destination}</span>
                </div>
            </div>

            {/* פרטים נוספים */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg flex items-center gap-3">
                    <User className="text-teal-500" />
                    <div>
                        <div className="text-xs text-slate-400">נהג/ת</div>
                        <div className="text-white font-medium">{ride.driver_name || "אנונימי"}</div>
                    </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg flex items-center gap-3">
                    <Calendar className="text-teal-500" />
                    <div>
                        <div className="text-xs text-slate-400">זמן יציאה</div>
                        <div className="text-white font-medium">
                            {formatRideTime(ride.departure_time)} {/*.toLocaleTimeString('he-IL', { hour: '2-digit', minute:'2-digit' })} */}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* כפתור פעולה */}
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg">
                הצטרף לנסיעה
            </Button>
        </div>
      </motion.div>
    </div>
  );
}