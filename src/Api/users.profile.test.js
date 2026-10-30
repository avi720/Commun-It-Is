import { beforeEach, describe, expect, it, vi } from 'vitest';

const eq = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn(() => ({ eq })));
const getUser = vi.hoisted(() => vi.fn());

vi.mock('./config', () => ({
    supabase: {
        auth: { getUser },
        from: vi.fn(() => ({ update })),
    },
    API_URL: '/api',
    getAuthHeaders: () => ({}),
}));

import { supabase } from './config';
import { createProfile, pickProfileFields } from './users';

describe('pickProfileFields', () => {
    it('keeps profile fields and drops role, email, and verification', () => {
        expect(pickProfileFields({
            firstName: 'Avi',
            lastName: 'Paz',
            city: 'Haifa',
            address: '1',
            phone: '0520000000',
            age: '30',
            community_role: 'committee',
            email: 'a@b.c',
            is_verified_as_resident: true,
            community_id: 'x',
            id: 'other',
        })).toEqual({
            firstName: 'Avi',
            lastName: 'Paz',
            city: 'Haifa',
            address: '1',
            phone: '0520000000',
            age: 30,
        });
    });

    it('rejects a non-integer age', () => {
        expect(() => pickProfileFields({ age: '30.5' })).toThrow(/גיל/);
    });
});

describe('createProfile', () => {
    beforeEach(() => {
        eq.mockReset();
        eq.mockResolvedValue({ error: null });
        update.mockClear();
        supabase.from.mockClear();
        getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    });

    it('writes only the whitelisted fields for the signed-in user', async () => {
        await createProfile({
            firstName: 'Avi',
            age: '41',
            community_role: 'committee',
        });
        expect(supabase.from).toHaveBeenCalledWith('users');
        expect(update).toHaveBeenCalledWith({ firstName: 'Avi', age: 41 });
        expect(eq).toHaveBeenCalledWith('id', 'user-1');
    });
});
