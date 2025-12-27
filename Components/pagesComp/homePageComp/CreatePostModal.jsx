import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Loader2, Send, Trash2 } from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { avior } from '../../../Api/Client';
import { useAppData } from '../../../context/AppContext';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
    const { user } = useAppData();
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
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
            formData.append('user_id', user.id); // שליחת user_id
            formData.append('content', content); // שליחת התוכן
            
            if (selectedFile) {
                formData.append('image', selectedFile); // שליחת הקובץ
            }
            // שליחה לשרת
            await avior.entities.Post.create(formData);
            // איפוס הטופס וסגירה
            setContent('');
            setImageUrl('');
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
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">
                            ביטול
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={!content.trim() || isSubmitting}
                            className="bg-teal-600 hover:bg-teal-700 text-white min-w-[100px]"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    <span>פרסם</span>
                                    <Send className="w-4 h-4 mr-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}