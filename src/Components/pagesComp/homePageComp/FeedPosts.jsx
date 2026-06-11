import React from 'react';
import { MessageCircle, User, Share2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";

export default function FeedPosts({ post }) {
    const is_committee = post.is_committee;
    // פונקציה לניקוי מספר הטלפון והכנת הקישור
    const handleWhatsAppClick = () => {
        if (!post.users || !post.users.phone) {
            toast.error("למפרסם זה אין מספר טלפון מעודכן");
            return;
        }

        // 1. ניקוי המספר (הסרת מקפים, רווחים וכו')
        let phone = post.users.phone.replace(/\D/g, '');

        // המרה לפורמט בינלאומי (אם מתחיל ב-0, מחליפים ב-972)
        if (phone.startsWith('0')) {
            phone = '972' + phone.substring(1);
        }

        // 2. הכנת ההודעה המוכנה מראש
        const postLink = `${window.location.origin}/#post-${post.id}`;
        const text = `${postLink}\n\nהיי ${post.users.firstName},\n ראיתי את הפוסט שלך בקהילה, אשמח לשמוע פרטים נוספים.`;

        // 3. פתיחת ווצאפ
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <Card id={`post-${post.id}`} className={`rounded-none mb-4 overflow-hidden border
                ${is_committee
                ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-none'
                : 'bg-slate-800 border-none'}
                >`}>
            {/* כותרת: פרטי המפרסם */}
            <div className="p-4 flex items-center gap-3 border-none">
                {/* אייקון משתמש */}
                {is_committee ? (
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center border-none shadow-lg shadow-amber-500/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                ) : post.users?.avatar_url ? (
                    <img src={post.users.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-none" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-teal-400 select-none" aria-hidden="true">
                        {post.users?.firstName?.[0] || '?'}
                    </div>
                )}

                <div>
                    <h3 className={`font-bold text-sm ${is_committee ? 'text-amber-400' : 'text-white'}`}>
                        {is_committee ? 'ועד הקהילה' : `${post.users?.firstName} ${post.users?.lastName}`}
                    </h3>
                    <p className="text-xs text-slate-400">
                        {new Date(post.created_at).toLocaleDateString('he-IL')}
                    </p>
                </div>
            </div>

            {/* תוכן הפוסט */}
            <div className="p-0">
                {post.image_url && (
                    <div className="w-full h-64 bg-slate-900">
                        {/* כאן תבוא תמונה - כרגע שמתי פלייסהולדר אם התמונה לא נטענת */}
                        <img
                            src={post.image_url}
                            alt="Post content"
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                )}
                <div className="p-4">
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                    </p>
                </div>
            </div>

            {/* כפתורי פעולה */}
            <div className="p-3 bg-slate-900/50 border-none flex justify-between items-center">
                <Button
                    variant="ghost"
                    className="text-green-400 hover:text-green-300 hover:bg-green-900/20 flex-1 gap-2"
                    onClick={handleWhatsAppClick}
                >
                    <MessageCircle className="w-5 h-5" />
                    הגב ב-WhatsApp
                </Button>

                {/* כפתור שיתוף כללי (אופציונלי) */}
                <Button variant="ghost" size="icon" aria-label="שתף פוסט" title="שתף פוסט" className="text-slate-400">
                    <Share2 className="w-4 h-4" aria-hidden="true" />
                </Button>
            </div>
        </Card>
    );
}