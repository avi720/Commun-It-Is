import { avior } from "@/Api";
import React, { useEffect, useRef, useState } from 'react';
import { Users, Search, Check } from 'lucide-react';
import { Input } from "@/Components/ui/input";

export default function CommunitiesList({ selectedCommunityName, setSelectedCommunityName }) {

  const [communities, setCommunities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  // טעינת רשימת הקהילות בטעינת הדף
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const data = await avior.entities.communities.getAll();
        setCommunities(data || []);
      } catch (err) {
        console.error("Failed to fetch communities", err);
      }
    };
    fetchCommunities();
  }, []);

  // סגירת הרשימה בלחיצה מחוץ לרכיב (mirrors CitySelect pattern)
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // סינון הקהילות לפי מונח החיפוש
  const filteredCommunities = communities.filter(c =>
    c.name.includes(searchTerm)
  );

  return (
    <div ref={wrapperRef} className="space-y-2 relative">
      <label className="text-sm text-teal-400 font-medium flex items-center gap-2">
        <Users className="w-4 h-4" />
        בחר את הקהילה שלך
      </label>

      <div className="relative">
        <Search className="absolute right-3 top-3.5 w-5 h-5 text-slate-500" />
        <Input
          type="text"
          value={searchTerm || selectedCommunityName} // מציג את השם שנבחר או מה שמקלידים
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedCommunityName(''); // איפוס בחירה אם מתחילים להקליד
            setShowDropdown(true);
          }}
          onFocus={() => {
            setSearchTerm(''); // איפוס כדי לראות את הכל בפוקוס
            setShowDropdown(true);
          }}
          placeholder="חפש את שם הקהילה..."
          className="bg-slate-950 border-slate-800 rounded-xl pr-10 text-white"
        />
      </div>

      {showDropdown && (searchTerm || communities.length > 0) && (
        <div className="absolute z-10 w-full bg-slate-800 border border-slate-700 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-2xl">
          {filteredCommunities.length === 0 ? (
            <div className="p-3 text-slate-400 text-center text-sm">לא נמצאו קהילות</div>
          ) : (
            filteredCommunities.map(community => (
              <div
                key={community.id}
                onClick={() => {
                  setSelectedCommunityName(community.name);
                  setSearchTerm('');
                  setShowDropdown(false);
                }}
                className="p-3 hover:bg-slate-700 cursor-pointer text-white border-b border-slate-700/50 last:border-0 flex justify-between items-center"
              >
                <span>{community.name}</span>
                {selectedCommunityName === community.name && <Check className="w-4 h-4 text-teal-500" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}