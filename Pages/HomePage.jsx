import React from 'react';
import { useOutletContext } from 'react-router-dom'; // <--- הוק חדש
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Building, Users, Star } from 'lucide-react';

export default function HomePage() {
  // מושכים את המידע שהעברנו ב-Outlet
  const { user } = useOutletContext();
  
  // הגנה למקרה שהמידע עוד לא נטען
  const userName = user ? user.firstName : "חבר";

  return (
    <div className="space-y-6 px-4 pb-24">
      <div className="text-center space-y-2 mt-4">
        <h1 className="text-3xl font-bold text-teal-400">היי, {userName}! 👋</h1>
        <p className="text-slate-400">ברוכים הבאים לקהילה שלך</p>
      </div>

      {/* ... שאר הקוד נשאר אותו דבר ... */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <Building className="w-8 h-8 text-indigo-400" />
            <span className="text-sm font-medium text-white">הבניין שלי</span>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <Users className="w-8 h-8 text-pink-400" />
            <span className="text-sm font-medium text-white">חברי הקהילה</span>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            חדשות הקהילה
          </CardTitle>
        </CardHeader>
        <CardContent className="text-slate-400 text-sm">
          כאן יופיעו עדכונים על אירועים קרובים, הודעות ועד ועוד...
        </CardContent>
      </Card>
    </div>
  );
}