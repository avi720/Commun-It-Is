import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- הוסף את זה: פונקציה לפורמט תאריך נסיעה ---
export function formatRideTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  
  // איפוס שעות לצורך השוואת ימים בלבד
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const rideDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const timeStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  if (rideDateOnly.getTime() === today.getTime()) {
    return `היום ב-${timeStr}`;
  } else if (rideDateOnly.getTime() === tomorrow.getTime()) {
    return `מחר ב-${timeStr}`;
  } else {
    // ימים אחרים: "יום ראשון ב-14:00"
    return d.toLocaleDateString('he-IL', { weekday: 'long' }) + ` ב-${timeStr}`;
  }
}