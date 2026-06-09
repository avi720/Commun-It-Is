import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppData } from '../context/AppContext';
import { avior } from '../Api';
import { Search, Phone, MessageCircle } from 'lucide-react';

export default function PhoneBook() {
    const { user } = useAppData();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: contacts = [], isLoading } = useQuery({
        queryKey: ['phonebook', user?.community_id],
        queryFn: () => avior.phonebook.getContacts(user.community_id),
        enabled: !!user?.community_id,
        // ספר טלפונים יציב יחסית — staleTime ארוך מהדיפולט חוסך רענונים.
        staleTime: 60_000,
    });

    // סינון בזמן אמת לפי חיפוש — נגזר ב-useMemo כדי שלא נחזיק state כפול לרשימה.
    const filteredContacts = useMemo(() => {
        if (!searchTerm) return contacts;
        const term = searchTerm.toLowerCase();
        return contacts.filter(contact => {
            const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
            return fullName.includes(term);
        });
    }, [contacts, searchTerm]);

    // פונקציית עזר לפורמט וואצאפ (הופך 054 ל-97254)
    const openWhatsApp = (phone) => {
        if (!phone) return;
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '972' + cleanPhone.substring(1);
        }
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white pb-20 p-4">
            <div className="sticky top-0 bg-slate-900 z-10 pb-4">
                <h1 className="text-2xl font-bold mb-4 text-center text-teal-400">ספר טלפונים קהילתי 📖</h1>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="חפש שכן..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 pr-10 focus:outline-none focus:border-teal-500 text-white"
                    />
                    <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center mt-10 text-slate-400">טוען אנשי קשר...</div>
            ) : (
                <div className="space-y-3">
                    {filteredContacts.length === 0 ? (
                        <div className="text-center mt-10 text-slate-500">
                            {searchTerm ? 'לא נמצאו תוצאות' : 'אין עדיין אנשי קשר בספר הקהילתי'}
                        </div>
                    ) : (
                        filteredContacts.map((contact) => (
                            <div key={contact.id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between border border-slate-700 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-xl font-bold text-teal-400">
                                        {contact.firstName?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{contact.firstName} {contact.lastName}</h3>
                                        <p className="text-sm text-slate-400">{contact.city || 'תושב'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="p-3 bg-slate-700 rounded-full text-green-400 hover:bg-green-500/20 transition-colors"
                                    >
                                        <Phone className="w-5 h-5" />
                                    </a>
                                    <button
                                        onClick={() => openWhatsApp(contact.phone)}
                                        className="p-3 bg-slate-700 rounded-full text-teal-400 hover:bg-teal-500/20 transition-colors"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
