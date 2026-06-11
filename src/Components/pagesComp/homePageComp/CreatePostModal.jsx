import React, { useState, useRef, useEffect, useId } from 'react';
import { X, Image as ImageIcon, Loader2, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/Components/ui/button";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";
import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
    const { user, session } = useAppData();
    const [content, setContent] = useState('');
    const [isCommitte, setIsCommitte] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null); // הקובץ עצמו
    const [previewUrl, setPreviewUrl] = useState(null);  // תצוגה מקדימה
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    const fileInputRef = useRef(null);
    const toggleLabelId = useId();

    const hasUnsavedContent = content.trim().length > 0 || selectedFile !== null;

    // guarded close: ask before discarding draft content/image
    const attemptClose = () => {
        if (hasUnsavedContent) {
            setShowDiscardConfirm(true);
        } else {
            onClose();
        }
    };

    const confirmDiscard = () => {
        setShowDiscardConfirm(false);
        setContent('');
        clearImage();
        onClose();
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                attemptClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, hasUnsavedContent]);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
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
            const formData = new FormData();
            formData.append('content', content);
            formData.append('is_committee', isCommitte);
            if (user?.community_id) {
                formData.append('community_id', user.community_id);
            }
            if (selectedFile) {
                formData.append('image', selectedFile);
            }
            await avior.entities.Post.create(formData, session);
            setContent('');
            clearImage();
            onPostCreated();
            onClose();

        } catch (error) {
            console.error("Failed to create post:", error);
            toast.error("שגיאה ביצירת הפוסט");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={attemptClose}
            >
                <div
                    className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* כותרת */}
                    <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
                        <h3 className="font-bold text-white">יצירת פוסט חדש</h3>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="סגור חלון יצירת פוסט" title="סגור חלון יצירת פוסט" className="text-slate-400 hover:text-white rounded-full">
                            <X className="w-5 h-5" aria-hidden="true" />
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
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="hidden"
                            />

                            {previewUrl ? (
                                <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-48 bg-black">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        aria-label="הסר תמונה"
                                        title="הסר תמונה"
                                        className="absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/60 rounded-full text-white hover:bg-red-600/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                                    >
                                        <Trash2 className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                </div>
                            ) : (
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

                        {/* שורת toggle משנית — קיימת רק לחברי ועד */}
                        {user?.community_role === 'committee' && (
                            <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <span id={toggleLabelId} className="text-sm text-amber-500 select-none">
                                    פרסם כהודעת ועד
                                </span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isCommitte}
                                    aria-labelledby={toggleLabelId}
                                    onClick={() => setIsCommitte((v) => !v)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${isCommitte ? 'bg-amber-500' : 'bg-slate-700'}`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${isCommitte ? '-translate-x-5' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                        )}

                        {/* פעולה ראשית — תמיד מלאת רוחב, לא זזה כשה-toggle נעלם */}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={!content.trim() || isSubmitting}
                                className="w-full bg-teal-700 hover:bg-teal-800 text-white p-5"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="text-sm">פרסם</span>
                                        <Send className="w-4 h-4" aria-hidden="true" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmDialog
                open={showDiscardConfirm}
                onOpenChange={setShowDiscardConfirm}
                title="לבטל את הפוסט?"
                description="התוכן שכתבת יימחק. להמשיך?"
                confirmLabel="כן, בטל"
                cancelLabel="המשך עריכה"
                onConfirm={confirmDiscard}
                destructive={true}
            />
        </>
    );
}
