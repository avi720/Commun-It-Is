import React, { useState } from 'react';
import { Car, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { avior } from '@/Api';
import { useAppData } from '@/context/useAppData';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';

function formatWhen(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleString('he-IL', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

function RideRow({ ride, onEdit, onDelete, busy }) {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                    {ride.location} ← {ride.destination}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                    {formatWhen(ride.departure_time)} • {ride.seats} מקומות
                </div>
            </div>
            <div className="flex items-center gap-1">
                {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" aria-hidden="true" />
                ) : (
                    <>
                        <button
                            onClick={onEdit}
                            aria-label="ערוך טרמפ"
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                            onClick={onDelete}
                            aria-label="מחק טרמפ"
                            className="p-2 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

function EditRideForm({ ride, onCancel, onSave, busy }) {
    const [seats, setSeats] = useState(ride.seats || 1);
    const [location, setLocation] = useState(ride.location || '');
    const [destination, setDestination] = useState(ride.destination || '');
    const [departure, setDeparture] = useState(
        ride.departure_time ? ride.departure_time.slice(0, 16) : '',
    );

    const submit = (e) => {
        e.preventDefault();
        onSave({
            seats: Number(seats),
            location,
            destination,
            departure_time: new Date(departure).toISOString(),
        });
    };

    return (
        <form onSubmit={submit} className="bg-slate-900 border border-teal-700 rounded-xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
                <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    placeholder="מ-"
                    required
                />
                <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    placeholder="ל-"
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <input
                    type="datetime-local"
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    required
                />
                <input
                    type="number"
                    min={1}
                    max={8}
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    required
                />
            </div>
            <div className="flex gap-2">
                <button type="submit" disabled={busy} className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-sm disabled:opacity-50">שמור</button>
                <button type="button" onClick={onCancel} disabled={busy} className="px-3 py-1 rounded bg-slate-700 text-white text-sm">ביטול</button>
            </div>
        </form>
    );
}

export default function MyRidesList({ offers, requests, queryKey }) {
    const { session } = useAppData();
    const qc = useQueryClient();
    const [editingId, setEditingId] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const doDelete = async (ride) => {
        setBusyId(ride.id);
        try {
            await avior.entities.Ride.delete(ride.id, session);
            qc.invalidateQueries({ queryKey });
            toast.success('הטרמפ נמחק');
            setConfirmDelete(null);
        } catch (err) {
            console.error(err);
            toast.error('מחיקת הטרמפ נכשלה');
        } finally {
            setBusyId(null);
        }
    };

    const doUpdate = async (rideId, patch) => {
        setBusyId(rideId);
        try {
            await avior.entities.Ride.update(rideId, patch, session);
            qc.invalidateQueries({ queryKey });
            toast.success('הטרמפ עודכן');
            setEditingId(null);
        } catch (err) {
            console.error(err);
            toast.error('עדכון הטרמפ נכשל');
        } finally {
            setBusyId(null);
        }
    };

    const renderSection = (title, Icon, rides) => (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Icon className="w-4 h-4 text-teal-400" aria-hidden="true" />
                {title}
            </h3>
            {rides.length === 0 ? (
                <div className="text-xs text-slate-500 px-2">אין כרגע.</div>
            ) : (
                <div className="space-y-2">
                    {rides.map((r) => (
                        <React.Fragment key={r.id}>
                            {editingId === r.id ? (
                                <EditRideForm
                                    ride={r}
                                    busy={busyId === r.id}
                                    onCancel={() => setEditingId(null)}
                                    onSave={(patch) => doUpdate(r.id, patch)}
                                />
                            ) : (
                                <RideRow
                                    ride={r}
                                    busy={busyId === r.id}
                                    onEdit={() => setEditingId(r.id)}
                                    onDelete={() => setConfirmDelete(r)}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 mt-4">
            {renderSection('טרמפים שאני מציע', Car, offers || [])}
            {renderSection('טרמפים שאני מחפש', Search, requests || [])}

            <ConfirmDialog
                open={!!confirmDelete}
                onOpenChange={(v) => !v && setConfirmDelete(null)}
                title="מחיקת טרמפ"
                description="הטרמפ יוסר לצמיתות מלוח הטרמפים."
                confirmText="מחק"
                confirmLabel="כן, מחק"
                cancelLabel="ביטול"
                destructive
                onConfirm={() => confirmDelete && doDelete(confirmDelete)}
            />
        </div>
    );
}
