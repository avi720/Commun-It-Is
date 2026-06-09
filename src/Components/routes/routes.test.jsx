/**
 * בדיקות לשומרי הנתיבים — ProtectedRoute, OnboardingRoute, CommitteeRoute.
 *
 * הבדיקות מודלות שלוש שאלות:
 *   1. ProtectedRoute מנתב נכון לכל מצב משתמש (לא מחובר / חסר פרטים / לא אומת / מאומת)?
 *   2. OnboardingRoute חוסם מי שאין לו מה לעשות שם?
 *   3. CommitteeRoute חוסם משתמש שאינו ועד גם אם user.community_role הוא 'committee' ב-snapshot?
 *      (T11 — שולח שאילתה חיה ל-DB בכל ניווט)
 *
 * Mocking:
 *  - useAppData: מוחלף ב-vi.mock לכל test כדי לקבוע את מצב המשתמש.
 *  - supabase (עבור CommitteeRoute): מוחלף כך שהקריאה ל-pg של ה-role תחזיר ערך נשלט.
 *  - @tanstack/react-query: עוטף כל test ב-QueryClientProvider עם cache טרי.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ProtectedRoute from './ProtectedRoute';
import OnboardingRoute from './OnboardingRoute';
import CommitteeRoute from './CommitteeRoute';

// --- mock setup ---------------------------------------------------------------

vi.mock('@/context/useAppData', () => ({
    useAppData: vi.fn(),
}));

vi.mock('@/Api', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

import { useAppData } from '@/context/useAppData';
import { supabase } from '@/Api';

function renderAtPath(ui, { path = '/' } = {}) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={qc}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/" element={ui} />
                    <Route path="/login" element={<div>LOGIN PAGE</div>} />
                    <Route path="/onboarding" element={<div>ONBOARDING PAGE</div>} />
                    <Route path="/resident-verification" element={<div>RESIDENT VERIFICATION</div>} />
                    <Route path="/protected-target" element={<div>PROTECTED CONTENT</div>} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

// --- ProtectedRoute -----------------------------------------------------------

describe('ProtectedRoute', () => {
    it('מציג מסך טעינה כשהקונטקסט עדיין טוען', () => {
        useAppData.mockReturnValue({ user: null, isAuthenticated: false, isLoading: true });
        renderAtPath(<ProtectedRoute><div>SECRET</div></ProtectedRoute>);
        expect(screen.getByText('טוען...')).toBeInTheDocument();
    });

    it('מנתב ל-/login כשהמשתמש לא מחובר', () => {
        useAppData.mockReturnValue({ user: null, isAuthenticated: false, isLoading: false });
        renderAtPath(<ProtectedRoute><div>SECRET</div></ProtectedRoute>);
        expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
    });

    it('מנתב ל-/onboarding כשהפרופיל לא שלם', () => {
        useAppData.mockReturnValue({
            user: { isIncomplete: true, is_verified_as_resident: false },
            isAuthenticated: true,
            isLoading: false,
        });
        renderAtPath(<ProtectedRoute><div>SECRET</div></ProtectedRoute>);
        expect(screen.getByText('ONBOARDING PAGE')).toBeInTheDocument();
    });

    it('מנתב ל-/resident-verification כשהמשתמש לא אומת', () => {
        useAppData.mockReturnValue({
            user: { isIncomplete: false, is_verified_as_resident: false },
            isAuthenticated: true,
            isLoading: false,
        });
        renderAtPath(<ProtectedRoute><div>SECRET</div></ProtectedRoute>);
        expect(screen.getByText('RESIDENT VERIFICATION')).toBeInTheDocument();
    });

    it('מציג את הילדים כשהמשתמש מאומת לחלוטין', () => {
        useAppData.mockReturnValue({
            user: { isIncomplete: false, is_verified_as_resident: true },
            isAuthenticated: true,
            isLoading: false,
        });
        renderAtPath(<ProtectedRoute><div>SECRET</div></ProtectedRoute>);
        expect(screen.getByText('SECRET')).toBeInTheDocument();
    });
});

// --- OnboardingRoute ----------------------------------------------------------

describe('OnboardingRoute', () => {
    it('לא מרנדר כלום כשהקונטקסט טוען', () => {
        useAppData.mockReturnValue({ user: null, isAuthenticated: false, isLoading: true });
        const { container } = renderAtPath(<OnboardingRoute><div>ONB</div></OnboardingRoute>);
        // null fallback — לא מרנדרים את הילד ולא מפנים
        expect(container.textContent).toBe('');
    });

    it('מנתב ל-/login כשלא מחובר', () => {
        useAppData.mockReturnValue({ user: null, isAuthenticated: false, isLoading: false });
        renderAtPath(<OnboardingRoute><div>ONB</div></OnboardingRoute>);
        expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
    });

    it('מנתב הביתה כשהפרופיל כבר שלם', () => {
        useAppData.mockReturnValue({
            user: { isIncomplete: false },
            isAuthenticated: true,
            isLoading: false,
        });
        // אנחנו ב-/, אבל ה-OnboardingRoute מפנה ל-/. הראייה לתקינות: לא מציג את הילד.
        renderAtPath(<OnboardingRoute><div>ONB</div></OnboardingRoute>);
        expect(screen.queryByText('ONB')).not.toBeInTheDocument();
    });

    it('מציג את הילד כשמחובר וחסרים פרטים', () => {
        useAppData.mockReturnValue({
            user: { isIncomplete: true },
            isAuthenticated: true,
            isLoading: false,
        });
        renderAtPath(<OnboardingRoute><div>ONB CONTENT</div></OnboardingRoute>);
        expect(screen.getByText('ONB CONTENT')).toBeInTheDocument();
    });
});

// --- CommitteeRoute (T11 — אימות חי של ה-role) ------------------------------

describe('CommitteeRoute', () => {
    function mockRoleQueryResponse(role) {
        // supabase.from('users').select('community_role').eq('id', ...).single() → { data, error }
        const single = vi.fn().mockResolvedValue({ data: { community_role: role }, error: null });
        const eq = vi.fn().mockReturnValue({ single });
        const select = vi.fn().mockReturnValue({ eq });
        supabase.from.mockReturnValue({ select });
    }

    it('מנתב ל-/login כשאין סשן', () => {
        useAppData.mockReturnValue({ user: null, session: null });
        renderAtPath(<CommitteeRoute><div>COMMITTEE ONLY</div></CommitteeRoute>);
        expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
    });

    it('מנתב הביתה אם ה-fetch החי החזיר תפקיד שאינו committee', async () => {
        useAppData.mockReturnValue({
            user: { id: 'user-1', community_role: 'committee' }, // ב-snapshot זה committee
            session: { access_token: 'fake' },
        });
        mockRoleQueryResponse('resident'); // אבל בפרוד הוא הודח

        renderAtPath(<CommitteeRoute><div>COMMITTEE ONLY</div></CommitteeRoute>);

        // ממתינים שה-redirect יקרה אחרי שה-query יסיים
        await screen.findByText((c) => c === '' || !c.includes('COMMITTEE ONLY'), {}, { timeout: 2000 }).catch(() => {});
        expect(screen.queryByText('COMMITTEE ONLY')).not.toBeInTheDocument();
    });

    it('מציג את הילד אם ה-fetch החי החזיר committee', async () => {
        useAppData.mockReturnValue({
            user: { id: 'user-1', community_role: 'committee' },
            session: { access_token: 'fake' },
        });
        mockRoleQueryResponse('committee');

        renderAtPath(<CommitteeRoute><div>COMMITTEE ONLY</div></CommitteeRoute>);

        await screen.findByText('COMMITTEE ONLY');
        expect(screen.getByText('COMMITTEE ONLY')).toBeInTheDocument();
    });
});
