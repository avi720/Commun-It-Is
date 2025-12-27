import React from 'react';
import { MessageCircle, User, Share2 } from 'lucide-react';
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";

export default function FeedPosts({ post }) {
    
    // פונקציה לניקוי מספר הטלפון והכנת הקישור
    const handleWhatsAppClick = () => {
        if (!post.users || !post.users.phone) {
            alert("למפרסם זה אין מספר טלפון מעודכן");
            return;
        }

        // 1. ניקוי המספר (הסרת מקפים, רווחים וכו')
        let phone = post.users.phone.replace(/\D/g, '');
        
        // המרה לפורמט בינלאומי (אם מתחיל ב-0, מחליפים ב-972)
        if (phone.startsWith('0')) {
            phone = '972' + phone.substring(1);
        }

        // 2. הכנת ההודעה המוכנה מראש
        // אנחנו שמים ציטוט קטן מהפוסט כדי שהמפרסם יבין על מה מדובר
        const postSnippet = post.content.length > 30 ? post.content.substring(0, 30) + "..." : post.content;
        const text = `היי ${post.users.firstName}, ראיתי את הפוסט שלך בקהילה: "${postSnippet}" אשמח לשמוע פרטים נוספים.`;

        // 3. פתיחת ווצאפ
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <Card className="bg-slate-800 border-slate-700 overflow-hidden mb-4">
            {/* כותרת: פרטי המפרסם */}
            <div className="p-4 flex items-center gap-3 border-b border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-teal-900/50 flex items-center justify-center border border-teal-700">
                    <User className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-100">
                        {post.users?.firstName} {post.users?.lastName}
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
            <div className="p-3 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center">
                <Button 
                    variant="ghost" 
                    className="text-green-400 hover:text-green-300 hover:bg-green-900/20 flex-1 gap-2"
                    onClick={handleWhatsAppClick}
                >
                    <MessageCircle className="w-5 h-5" />
                    הגב ב-WhatsApp
                </Button>
                
                {/* כפתור שיתוף כללי (אופציונלי) */}
                <Button variant="ghost" size="icon" className="text-slate-400">
                    <Share2 className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
}