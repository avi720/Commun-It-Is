import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "./button";
import { Input } from "./input";

/**
 * דיאלוג אישור controlled — מחליף את `window.confirm()`.
 *
 * הקורא מנהל את ה-state של open/onOpenChange, ומקבל את onConfirm להפעלת
 * הפעולה אחרי שהמשתמש אישר. עבור פעולות הרסניות (מחיקת חשבון, שליחה לכל
 * הקהילה) — destructive=true צובע את כפתור האישור באדום.
 *
 * confirmText (אופציונלי, F17): כשמועבר — דורש שהמשתמש יקליד את הטקסט המדויק
 * כדי להפעיל את כפתור האישור. חיכוך כנגד muscle-memory בפעולה בלתי הפיכה.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "אישור",
    cancelLabel = "ביטול",
    onConfirm,
    destructive = false,
    confirmText,
}) {
    const [typed, setTyped] = React.useState("");
    const requireType = typeof confirmText === "string" && confirmText.length > 0;
    const matches = typed.trim() === confirmText;
    const inputId = React.useId();

    // איפוס הקלדה כשהדיאלוג נסגר — דרך onOpenChange wrapper במקום useEffect,
    // כדי לא להפר את חוקי react-hooks/set-state-in-effect.
    const handleOpenChange = React.useCallback((next) => {
        if (!next) setTyped("");
        onOpenChange?.(next);
    }, [onOpenChange]);

    return (
        <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <AlertDialog.Content
                    dir="rtl"
                    className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                    <AlertDialog.Title className="mb-2 text-lg font-bold text-white">
                        {title}
                    </AlertDialog.Title>
                    {description && (
                        <AlertDialog.Description className="mb-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                            {description}
                        </AlertDialog.Description>
                    )}
                    {requireType && (
                        <div className="mb-6 space-y-2">
                            <label htmlFor={inputId} className="block text-sm text-slate-300">
                                כדי לאשר, הקלד <span className="font-mono font-bold text-red-400">{confirmText}</span>
                            </label>
                            <Input
                                id={inputId}
                                type="text"
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                autoComplete="off"
                                className="border-2 border-slate-700 bg-slate-950 text-white focus:border-red-500 focus-visible:ring-red-500 focus-visible:ring-offset-slate-900"
                            />
                        </div>
                    )}
                    <div className="flex flex-row-reverse gap-3 justify-start">
                        <AlertDialog.Action asChild>
                            <Button
                                variant={destructive ? "destructive" : "default"}
                                onClick={onConfirm}
                                disabled={requireType && !matches}
                                className={
                                    destructive
                                        ? ""
                                        : "bg-teal-700 hover:bg-teal-800 text-white"
                                }
                            >
                                {confirmLabel}
                            </Button>
                        </AlertDialog.Action>
                        <AlertDialog.Cancel asChild>
                            <Button variant="ghost" className="text-slate-300 hover:text-white">
                                {cancelLabel}
                            </Button>
                        </AlertDialog.Cancel>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
}
