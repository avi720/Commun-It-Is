import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const SUPPORT_EMAIL = 'avi.paz159@gmail.com';
const LAST_UPDATED = '16 ביוני 2026';

function PolicySection({ title, children }) {
    return (
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <div className="text-slate-300 text-sm leading-relaxed space-y-2">
                {children}
            </div>
        </div>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <div className="p-4 max-w-2xl mx-auto pb-20 overflow-y-auto h-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                        מדיניות פרטיות
                    </h1>
                    <p className="text-slate-400">קצר, בעברית פשוטה, וכן.</p>
                </div>

                <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-teal-400" />
                        מה אנחנו עושים עם המידע שלך
                    </h2>

                    <p className="text-slate-300 text-sm leading-relaxed">
                        Commun-It-Is היא אפליקציית קהילה קטנה שמפעיל מפתח עצמאי.
                        המסמך הזה מסביר איזה מידע נאסף, למה, ומה אפשר לעשות איתו.
                    </p>

                    <PolicySection title="איזה מידע אנחנו אוספים">
                        <ul className="list-disc pr-5 space-y-1">
                            <li>שם מלא</li>
                            <li>כתובת אימייל</li>
                            <li>מספר טלפון</li>
                            <li>כתובת מגורים בקהילה</li>
                            <li>עיר</li>
                            <li>גיל</li>
                            <li>תמונת פרופיל (אופציונלי)</li>
                            <li>פוסטים שאת/ה מפרסם/ת</li>
                            <li>בקשות והצעות לטרמפים</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="למה אנחנו אוספים את זה">
                        <p>
                            כדי שהאפליקציה תעבוד: כדי לזהות אותך בקהילה,
                            כדי להראות פוסטים וטרמפים לתושבים הרלוונטיים,
                            וכדי לאפשר לתושבים לפנות אחד לשני דרך ספר הטלפונים.
                        </p>
                    </PolicySection>

                    <PolicySection title="עם מי משתפים">
                        <p>
                            המידע שלך נגיש רק לחברים באותה קהילה שבה את/ה רשום/ה,
                            לפי הגדרות הפרטיות שאת/ה מגדיר/ה בעצמך
                            (למשל הופעה בספר הטלפונים, ומי רואה את הכתובת שלך).
                        </p>
                        <p>
                            אנחנו לא מוכרים מידע, ולא משתפים אותו עם מפרסמים או צדדים שלישיים מסחריים.
                        </p>
                    </PolicySection>

                    <PolicySection title="אבטחה">
                        <p>
                            ההתחברות מאובטחת באמצעות Supabase Auth, התקשורת עם השרת
                            מתבצעת ב-HTTPS, וגישה לנתונים נאכפת בצד השרת באמצעות
                            מדיניות RLS (Row Level Security) — כלומר, אם אין לך הרשאה
                            לראות נתון מסוים, הוא פשוט לא נשלח לדפדפן שלך.
                        </p>
                    </PolicySection>

                    <PolicySection title="הזכויות שלך">
                        <ul className="list-disc pr-5 space-y-1">
                            <li>לראות את כל הפרטים שלך במסך הפרופיל</li>
                            <li>לערוך כל פרט מתוך מסך ההגדרות</li>
                            <li>לבחור מי רואה את הכתובת והטלפון שלך</li>
                            <li>למחוק את החשבון לצמיתות — כפתור &quot;מחיקת חשבון&quot; באזור המסוכן שבהגדרות</li>
                        </ul>
                        <p>
                            מחיקת חשבון מוחקת גם את הפוסטים, הטרמפים והפרטים שלך מהמערכת.
                        </p>
                    </PolicySection>

                    <PolicySection title="שירותים חיצוניים שאנחנו משתמשים בהם">
                        <ul className="list-disc pr-5 space-y-1">
                            <li><span className="font-medium text-white">Supabase</span> — מסד הנתונים וההתחברות</li>
                            <li><span className="font-medium text-white">Firebase</span> — שליחת התראות Push</li>
                            <li><span className="font-medium text-white">Google OAuth</span> — אופציונלי, רק אם בחרת להתחבר עם גוגל</li>
                            <li><span className="font-medium text-white">Sentry</span> — מעקב אחרי שגיאות בקוד, כדי לתקן באגים מהר יותר</li>
                        </ul>
                        <p>
                            לכל שירות יש מדיניות פרטיות משלו. אנחנו שולחים להם רק את המידע
                            המינימלי שדרוש כדי שהשירות יעבוד.
                        </p>
                    </PolicySection>

                    <PolicySection title="יצירת קשר בענייני פרטיות">
                        <p>
                            לכל שאלה, בקשה למחיקה ידנית או בעיה — אפשר לפנות אליי במייל:
                        </p>
                        <p>
                            <a
                                href={`mailto:${SUPPORT_EMAIL}`}
                                className="text-teal-400 hover:text-teal-300 underline"
                                dir="ltr"
                            >
                                {SUPPORT_EMAIL}
                            </a>
                        </p>
                    </PolicySection>

                    <p className="text-center text-xs text-slate-500 pt-2">
                        תאריך עדכון אחרון: {LAST_UPDATED}
                    </p>
                </section>
            </motion.div>
        </div>
    );
}
