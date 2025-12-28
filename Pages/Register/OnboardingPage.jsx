import { avior } from "../../Api/Client";
import React, { useState } from 'react';
import { User, MapPin, Calendar, CheckCircle, Home, Lock, Phone, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../../context/AppContext';
import CitySelect from '../../Components/common/CitySelect';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";

// מקבלים את initialAuth (אימייל וסיסמה) מהדף הקודם
export default function OnboardingPage() {
  const { user, refresh } = useAppData();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    city: '',
    address: '',
    age: '',
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

        // בדיקות תקינות (Validations)
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    // 1. בדיקת תו מיוחד (בודק אם יש לפחות אחד מהתווים האלו)
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    // 2. בדיקת מספר (בודק אם יש ספרה 0-9)
    const numberRegex = /\d/;

    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (!specialCharRegex.test(formData.password)) {
        setError('הסיסמה חייבת להכיל לפחות תו מיוחד אחד (!@#$...)');
        return;
    }

    if (!numberRegex.test(formData.password)) {
        setError('הסיסמה חייבת להכיל לפחות מספר אחד');
        return;
    }

    if (formData.phone.length < 10 || formData.phone.length > 10) {
      setError('מספר טלפון לא תקין');
      return;
    }
    // איחוד הנתונים: מה שמילאנו עכשיו + האימייל והסיסמה מהשלב הקודם
    const completeData = {
      id : user.id,
      ...formData,
    };

    try {
      await avior.entities.User.createProfile(completeData);
      console.log("שולח נתונים מלאים לשרת...", completeData);
      
      // לאחר יצירת הפרופיל, נבצע כניסה אוטומטית ונשמור את הנתונים ב-localStorage
      const loginResponse = await avior.entities.User.login(completeData.email, completeData.password);
      localStorage.setItem('tremp_userData', JSON.stringify(loginResponse));

      console.log("המשתמש נוצר ונשמר בהצלחה!");
      await refresh();
      navigate('/'); // הפניה לדף הבית לאחר ההרשמה

    } catch (error) {
        console.error("שגיאה בשמירת המשתמש:", error);
        alert("הייתה בעיה בשמירת הפרטים. נסה שוב.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="text-xl text-center text-teal-400">השלמת פרופיל</CardTitle>
          <p className="text-center text-slate-400 text-sm">שלב 2 מתוך 2: פרטים אישיים</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 mr-1">סיסמה</label>
              <div className="relative">
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="password" 
                  className="w-full p-2 pr-9 rounded bg-slate-900 border border-slate-700 text-white text-sm focus:ring-1 focus:ring-teal-500"
                  placeholder="לדוגמא: abcd1!"
                  required
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 mr-1">סיסמה</label>
              <div className="relative">
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="password" 
                  className="w-full p-2 pr-9 rounded bg-slate-900 border border-slate-700 text-white text-sm focus:ring-1 focus:ring-teal-500"
                  placeholder="אימות סיסמה"
                  required
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 mr-1">שם פרטי</label>
                <div className="relative">
                  <User className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="text" 
                    className="w-full p-2 pr-9 rounded bg-slate-900 border border-slate-700 text-white text-sm focus:ring-1 focus:ring-teal-500"
                    placeholder="לדוגמא: אביאור"
                    required
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 mr-1">שם משפחה</label>
                <input 
                  type="text" 
                  className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-sm focus:ring-1 focus:ring-teal-500"
                  placeholder="לדוגמא: פז"
                  required
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 mr-1">יישוב</label>
              {/* החלפנו את ה-input הרגיל ב-CitySelect */}
                 <div className="relative">
                    <CitySelect 
                        value={formData.city}
                        onChange={(value) => setFormData({...formData, city: value})}
                        placeholder="עיר מגורים"
                    />
                 </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 mr-1">רחוב ומס' בית</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  className="w-full p-2 pr-9 rounded bg-slate-900 border border-slate-700 text-white text-sm focus:ring-1 focus:ring-teal-500"
                  placeholder="לדוגמה: הרימון 12"
                  required
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 mr-1">טלפון</label>
              <div className="relative">
                <Phone className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="tel" 
                  className="w-full p-2 pr-9 rounded bg-slate-900 border border-slate-700 text-white text-sm focus:ring-1 focus:ring-teal-500"
                  placeholder="לדוגמה: 0521234567"
                  required
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 mr-1">גיל</label>
              <div className="relative">
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="number" 
                  min="16"
                  max="120"
                  className="w-full p-2 pr-9 rounded bg-slate-900 border border-slate-700 text-white text-sm focus:ring-1 focus:ring-teal-500"
                  required
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white p-2 rounded-md font-bold transition-all shadow-lg flex justify-center items-center gap-2"
            >
              סיום והרשמה
              <CheckCircle className="w-5 h-5" />
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}