import React from 'react';
import { motion } from 'framer-motion';
import { Info, User, Mail, MessageCircle, Github } from 'lucide-react';

// __APP_VERSION__ is replaced at build time by Vite (define) — falls back to
// 'dev' in local dev.
const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

const WHATSAPP_URL = 'https://wa.me/972500000000';
const GITHUB_ISSUES_URL = 'https://github.com/avi720/Commun-It-Is/issues';
const SUPPORT_EMAIL = 'avi.paz159@gmail.com';

function SectionCard({ icon: Icon, title, children }) {
    return (
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Icon className="w-5 h-5 text-teal-400" />
                {title}
            </h2>
            <div className="text-slate-300 text-sm leading-relaxed space-y-3">
                {children}
            </div>
        </section>
    );
}

export default function AboutPage() {
    return (
        <div className="p-4 max-w-2xl mx-auto pb-20 overflow-y-auto h-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                        מידע ותמיכה
                    </h1>
                    <p className="text-slate-400">קצת עלינו, ואיך לפנות אלינו</p>
                </div>

                <SectionCard icon={Info} title="על האפליקציה">
                    <p>
                        Commun-It-Is היא אפליקציית קהילה לתושבים — מקום אחד שבו אפשר לשתף פוסטים,
                        להציע ולבקש טרמפים, לעיין בספר הטלפונים של הבניין או השכונה,
                        ולקבל עדכונים מוועד הקהילה.
                    </p>
                    <p>
                        המטרה היא לעזור לקהילות קטנות לדבר אחת עם השנייה בצורה פשוטה,
                        בלי קבוצות וואטסאפ שמתפוצצות ובלי לוחות מודעות שכבר אף אחד לא קורא.
                    </p>
                </SectionCard>

                <SectionCard icon={User} title="מי אני">
                    <p>
                        שמי אבי פז, מפתח עצמאי. בניתי את Commun-It-Is בהתחלה לקהילה שלי,
                        ובהמשך פתחתי אותה גם לקהילות אחרות שמעוניינות.
                    </p>
                    <p>
                        אני כותב את הקוד לבד, ידנית — כל פיצ׳ר, כל פיקסל. בלי צוות ובלי &quot;סטארטאפ&quot;.
                        זה אומר שהקצב לפעמים איטי, אבל גם שאני באמת מקשיב למה שצריך מהמשתמשים בפועל.
                    </p>
                    <p>
                        אם משהו לא עובד, חסר לכם פיצ׳ר, או שיש לכם רעיון לשיפור — אשמח לשמוע.
                        הדרכים ליצירת קשר נמצאות בהמשך הדף.
                    </p>
                </SectionCard>

                <SectionCard icon={Mail} title="יצירת קשר">
                    <div className="space-y-2">
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-900 transition-colors text-slate-200"
                        >
                            <Mail className="w-4 h-4 text-teal-400" aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">אימייל</div>
                                <div className="text-xs text-slate-400 break-all" dir="ltr">{SUPPORT_EMAIL}</div>
                            </div>
                        </a>

                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-900 transition-colors text-slate-200"
                        >
                            <MessageCircle className="w-4 h-4 text-teal-400" aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">וואטסאפ</div>
                                <div className="text-xs text-slate-400">להודעות מהירות ותמיכה</div>
                            </div>
                        </a>

                        <a
                            href={GITHUB_ISSUES_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-900 transition-colors text-slate-200"
                        >
                            <Github className="w-4 h-4 text-teal-400" aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">דיווח על באג / רעיון</div>
                                <div className="text-xs text-slate-400">פתיחת issue ב-GitHub</div>
                            </div>
                        </a>
                    </div>
                </SectionCard>

                <p className="text-center text-xs text-slate-500 pt-2">
                    Commun-it-is • גרסה {VERSION}
                </p>
            </motion.div>
        </div>
    );
}
