import React, { useEffect, useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import FeedPosts from '@/Components/pagesComp/homePageComp/FeedPosts';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';
import PostActionsMenu from './PostActionsMenu';
import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';

/**
 * Full-screen overlay scroll view of the user's posts, opened from
 * MyPostsGrid. Reuses FeedPosts for the card UI; adds a kebab menu with
 * edit/delete for each post (owner-only by definition — these are MY posts).
 */
export default function MyPostsScroll({ posts, focusPostId, onClose, queryKey }) {
    const { session } = useAppData();
    const qc = useQueryClient();
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [busyId, setBusyId] = useState(null);

    // Scroll the focused post into view on mount
    useEffect(() => {
        if (!focusPostId) return;
        const t = setTimeout(() => {
            const el = document.getElementById(`scroll-post-${focusPostId}`);
            el?.scrollIntoView({ behavior: 'auto', block: 'start' });
        }, 30);
        return () => clearTimeout(t);
    }, [focusPostId]);

    const onDelete = async (postId) => {
        setBusyId(postId);
        try {
            await avior.entities.Post.delete(postId, session);
            qc.invalidateQueries({ queryKey });
            toast.success('הפוסט נמחק');
            setConfirmDelete(null);
        } catch (err) {
            console.error(err);
            toast.error('מחיקת הפוסט נכשלה');
        } finally {
            setBusyId(null);
        }
    };

    const onEditSave = async (postId, formData) => {
        setBusyId(postId);
        try {
            await avior.entities.Post.update(postId, formData, session);
            qc.invalidateQueries({ queryKey });
            toast.success('הפוסט עודכן');
            setEditingPostId(null);
        } catch (err) {
            console.error(err);
            toast.error('עדכון הפוסט נכשל');
        } finally {
            setBusyId(null);
        }
    };

    // The overlay deliberately sits BELOW the MainLayout header (z-30) and
    // sidebar (z-50) so the community-name header stays visible and clickable
    // (it routes home). Pattern matches Instagram/TikTok — no extra title bar.
    // `top-14` matches the header's h-14; `md:mr-64` mirrors the sidebar offset
    // the rest of the app uses (Tailwind `mr` in RTL still applies as margin-right).
    return (
        <div className="fixed top-14 right-0 left-0 bottom-0 md:mr-64 z-20 bg-slate-900 overflow-y-auto pt-[env(safe-area-inset-top)]">
            <div className="max-w-2xl mx-auto py-4 px-2">
                <button
                    onClick={onClose}
                    className="mb-3 inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1"
                >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    חזרה לפרופיל
                </button>

                {posts.map((p) => (
                    <div key={p.id} id={`scroll-post-${p.id}`} className="relative">
                        {/* Kebab menu overlay in the top-left of each card */}
                        <div className="absolute top-2 left-2 z-10">
                            {busyId === p.id ? (
                                <div className="p-2">
                                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" aria-hidden="true" />
                                </div>
                            ) : (
                                <PostActionsMenu
                                    onEdit={() => setEditingPostId(p.id)}
                                    onDelete={() => setConfirmDelete(p)}
                                />
                            )}
                        </div>
                        <FeedPosts post={p} />
                        {editingPostId === p.id && (
                            <InlineEditor
                                post={p}
                                onCancel={() => setEditingPostId(null)}
                                onSave={(fd) => onEditSave(p.id, fd)}
                                busy={busyId === p.id}
                            />
                        )}
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={!!confirmDelete}
                onOpenChange={(v) => !v && setConfirmDelete(null)}
                title="מחיקת פוסט"
                description="הפוסט יימחק לצמיתות. לא ניתן לבטל פעולה זו."
                confirmText="מחק"
                confirmLabel="כן, מחק"
                cancelLabel="ביטול"
                destructive
                onConfirm={() => confirmDelete && onDelete(confirmDelete.id)}
            />
        </div>
    );
}

/**
 * Minimal inline editor for a post — text-only edits and the option to
 * remove the image. (Re-uploading an image is uncommon mid-edit; if the
 * user wants a new image they can delete the post and create a new one.)
 */
function InlineEditor({ post, onCancel, onSave, busy }) {
    const [text, setText] = useState(post.content || '');
    const [removeImage, setRemoveImage] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('content', text);
        fd.append('remove_image', removeImage ? 'true' : 'false');
        onSave(fd);
    };

    return (
        <form
            onSubmit={submit}
            className="mb-6 -mt-2 mx-4 p-3 bg-slate-800 border border-teal-700 rounded-xl space-y-2"
        >
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm resize-y"
                required
            />
            {post.image_url && (
                <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                        type="checkbox"
                        checked={removeImage}
                        onChange={(e) => setRemoveImage(e.target.checked)}
                        className="accent-red-500"
                    />
                    הסר את התמונה הנוכחית
                </label>
            )}
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium disabled:opacity-50"
                >
                    שמור
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={busy}
                    className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                >
                    ביטול
                </button>
            </div>
        </form>
    );
}
