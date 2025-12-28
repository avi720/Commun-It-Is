import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";

export default function VerificationSuccess() {

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
            <Card className="w-full max-w-md bg-slate-900 border-teal-500/50 border shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center border-2 border-teal-500 shadow-lg shadow-teal-500/20">
                        <CheckCircle2 className="w-10 h-10 text-teal-400" />
                    </div>
                    <CardTitle className="text-2xl text-white">כתובת המייל אומתה בהצלחה!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <p className="text-slate-300 text-lg">
                        אתה יכול <span className="font-bold text-teal-400">לסגור את החלון הזה</span> ולחזור לאפליקציה כדי להמשיך.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}