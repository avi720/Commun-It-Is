import React from "react";
import { Label } from "@/Components/ui/label";
import { Clock } from "lucide-react";

export default function TimeSelection({ selectedTime, onSelectTime }) {
    const timeOptions = [
        { value: 2, label: "בעוד 2 דקות" },
        { value: 5, label: "בעוד 5 דקות" },
        { value: 10, label: "בעוד 10 דקות" },
        { value: 15, label: "בעוד 15 דקות" }
    ];

    return (
        <div className="space-y-3">
            <Label className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                מתי תגיע לנק' האיסוף?
            </Label>
            <div className="grid grid-cols-4 gap-3">
                {timeOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onSelectTime(option.value)}
                        className={`py-4 px-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 ${selectedTime === option.value
                            ? "bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}