import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Loader2, Send, Trash2 } from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { avior } from '@/Api/Client';
import { useAppData } from '@/context/AppContext';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
    const { user, session } = useAppData();
    const [content, setContent] = useState('');
    const [isCommitte, setIsCommitte] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null); // הקובץ עצמו
    const [previewUrl, setPreviewUrl] = useState(null);  // תצוגה מקדימה
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef(null);

    // אם המודל סגור, לא נרנדר כלום
    if (!isOpen) return null;

    // פונקציה שמטפלת בבחירת קובץ
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // יצירת URL מקומי לתצוגה מקדימה
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const clearImage = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            // יצירת FormData - אריזה מיוחדת לקבצים וטקסט
            const formData = new FormData();
            //formData.append('user_id', session);
            formData.append('content', content); // שליחת התוכן
            formData.append('is_committee', isCommitte); // שליחת סוג הפוסט
            if (user?.community_id) {
                formData.append('community_id', user.community_id);
            }
            if (selectedFile) {
                formData.append('image', selectedFile); // שליחת הקובץ
            }
            console.log("Submitting post with data:");
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            // שליחה לשרת (חובה להעביר את ה-session לאימות מול ה-backend)
            await avior.entities.Post.create(formData, session);
            // איפוס הטופס וסגירה
            setContent('');
            clearImage();
            onPostCreated(); // רענון הפיד בדף הבית
            onClose();

        } catch (error) {
            console.error("Failed to create post:", error);
            alert("שגיאה ביצירת הפוסט");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* כותרת */}
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
                    <h3 className="font-bold text-white">יצירת פוסט חדש</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* טופס */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="מה קורה בקהילה? שתף אותנו..."
                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none text-base"
                        autoFocus
                    />

                    {/* אזור התמונה */}
                    <div>
                        {/* אינפוט נסתר לקבצים */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*" // רק תמונות
                            className="hidden"
                        />

                        {/* אם יש תמונה - מציגים אותה עם אפשרות מחיקה */}
                        {previewUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-48 bg-black">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-red-600/80 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            // כפתור הוספת תמונה
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-dashed border-slate-600 bg-slate-900/50 hover:bg-slate-800 text-slate-400 py-8 flex flex-col gap-2 h-auto"
                            >
                                <ImageIcon className="w-6 h-6" />
                                <span>הוסף תמונה מהגלריה</span>
                            </Button>
                        )}
                    </div>

                    {/* כפתורי פעולה */}
                    <div className="flex justify-between gap-3 pt-2">

                        {/* הצגת אפשרות פרסום רשמי רק לחברי ועד */}
                        {user?.community_role === 'committee' && (
                            <div className="flex items-center gap-2 pt-2.5 pb-2.5 pl-3 bg-amber-500/10 rounded-lg border border-amber-500/20 mb-4">
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name="toggle"
                                        id="official-toggle"
                                        checked={isCommitte}
                                        onChange={(e) => setIsCommitte(e.target.checked)}
                                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:bg-amber-500"
                                        style={{ right: isCommitte ? '0' : 'auto', left: isCommitte ? 'auto' : '0' }}
                                    />
                                    <label
                                        htmlFor="official-toggle"
                                        className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${isCommitte ? 'bg-amber-500/50' : 'bg-slate-700'}`}
                                    ></label>
                                </div>
                                <label htmlFor="official-toggle" className="text-sm text-amber-500 cursor-pointer">
                                    פרסם כהודעת ועד
                                </label>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={!content.trim() || isSubmitting}
                            className="bg-teal-600 hover:bg-teal-700 text-white p-5"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    <label className="text-sm">פרסם</label>
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}