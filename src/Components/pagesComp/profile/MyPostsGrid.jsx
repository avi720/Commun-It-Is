import React, { useState } from 'react';
import { Image as ImageIcon, ImageOff } from 'lucide-react';

function PostThumb({ post }) {
    const [imgFailed, setImgFailed] = useState(false);

    if (post.image_url && !imgFailed) {
        return (
            <>
                <img
                    src={post.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImgFailed(true)}
                />
                <div className="absolute top-1 right-1 bg-black/40 rounded-full p-1">
                    <ImageIcon className="w-3 h-3 text-white" aria-hidden="true" />
                </div>
            </>
        );
    }

    if (post.image_url && imgFailed) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-slate-800 text-slate-400">
                <ImageOff className="w-6 h-6" aria-hidden="true" />
                {post.content && (
                    <span className="text-[10px] line-clamp-3 px-2 text-center whitespace-pre-wrap break-words">
                        {post.content}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full p-2 flex items-center justify-center text-center">
            <span className="text-xs text-slate-300 line-clamp-5 whitespace-pre-wrap break-words">
                {post.content}
            </span>
        </div>
    );
}

export default function MyPostsGrid({ posts, onOpen }) {
    if (!posts || posts.length === 0) {
        return (
            <div className="text-center text-slate-400 py-12">
                עדיין לא פרסמת פוסטים בקהילה.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
            {posts.map((p) => (
                <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpen(p.id)}
                    className="aspect-square bg-slate-800 border border-slate-700/50 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:z-10 relative overflow-hidden"
                    aria-label={`פתח פוסט: ${(p.content || '').slice(0, 40)}`}
                >
                    <PostThumb post={p} />
                </button>
            ))}
        </div>
    );
}
