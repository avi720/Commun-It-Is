import React, { useState, useEffect } from 'react';
import { useAppData } from '../context/AppContext';
import { Search, Phone, MessageCircle } from 'lucide-react';


export default function PhoneBook() {
    const { user } = useAppData();
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const fetchContacts = async () => {
            if (user?.community_id) {
                try {
                    // קריאה לפונקציה החדשה שיצרנו בקליינט
                    const data = await avior.phonebook.getContacts(user.community_id);
                    setContacts(data);
                } catch (error) {
                    console.error("Failed to load phonebook:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchContacts();
    }, [user]);

    // סינון בזמן אמת לפי חיפוש
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        const filtered = contacts.filter(contact => {
            const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
            return fullName.includes(term);
        });

        setFilteredContacts(filtered);
    };

    // פונקציית עזר לפורמט וואצאפ (הופך 054 ל-97254)
    const openWhatsApp = (phone) => {
        if (!phone) return;
        // מנקה את המספר ממינוסים ורווחים
        let cleanPhone = phone.replace(/\D/g, '');
        // אם מתחיל ב-0, מחליף ל-972
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '972' + cleanPhone.substring(1);
        }
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white pb-20 p-4">

            {/* כותרת וחיפוש */}
            <div className="sticky top-0 bg-slate-900 z-10 pb-4">
                <h1 className="text-2xl font-bold mb-4 text-center text-teal-400">ספר טלפונים קהילתי 📖</h1>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="חפש שכן..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 pr-10 focus:outline-none focus:border-teal-500 text-white"
                    />
                    <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                </div>
            </div>

            {/* רשימת אנשי קשר */}
            {loading ? (
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

                                {/* פרטי איש הקשר */}
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-xl font-bold text-teal-400">
                                        {contact.firstName?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{contact.firstName} {contact.lastName}</h3>
                                        <p className="text-sm text-slate-400">{contact.city || 'תושב'}</p>
                                    </div>
                                </div>

                                {/* כפתורי פעולה */}
                                <div className="flex gap-2">
                                    {/* כפתור חיוג */}
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="p-3 bg-slate-700 rounded-full text-green-400 hover:bg-green-500/20 transition-colors"
                                    >
                                        <Phone className="w-5 h-5" />
                                    </a>

                                    {/* כפתור וואצאפ */}
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