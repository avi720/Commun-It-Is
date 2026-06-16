// Main API client module - exports avior object and supabase client
import { supabase } from './config';
import * as auth from './auth';
import * as rides from './rides';
import * as users from './users';
import * as posts from './posts';
import * as communities from './communities';
import * as phonebook from './phonebook';
import * as notifications from './notifications';

// Export supabase client for direct use
export { supabase };

// Export avior object with the same structure as before
// Functions that require authentication now accept session as an optional parameter
export const avior = {
    // Authentication
    auth: {
        signUp: auth.signUp,
        login: auth.login,
        signInWithGoogle: auth.signInWithGoogle,
    },

    entities: {
        // Rides
        Ride: {
            create: (rideData, session) => rides.create(rideData, session),
            // list now accepts an options object as second arg:
            // { userId, type: 'offer'|'request', upcoming: boolean }
            list: (session, options) => rides.list(session, options),
            update: (rideId, patch, session) => rides.update(rideId, patch, session),
            delete: (rideId, session) => rides.remove(rideId, session),
        },

        // Users
        User: {
            createProfile: users.createProfile,
            update: (userId, userData, session) => users.update(userId, userData, session),
            delete: (userId, session) => users.deleteUser(userId, session),
            uploadAvatar: (file, session) => users.uploadAvatar(file, session),
            deleteAvatar: (session) => users.deleteAvatar(session),
            changePassword: (params, session) => users.changePassword(params, session),
        },

        // Posts
        Post: {
            // list now accepts { authorId } as second arg
            list: (session, options) => posts.list(session, options),
            create: (formData, session) => posts.create(formData, session),
            update: (postId, formData, session) => posts.update(postId, formData, session),
            delete: (postId, session) => posts.remove(postId, session),
        },

        // Communities
        communities: {
            getAll: communities.getAll,
            joinByName: communities.joinByName,
            // Multi-community v1
            listMyMemberships: (session) => communities.listMyMemberships(session),
            joinByCode: (code, session) => communities.joinByCode(code, session),
            switchActive: (id, session) => communities.switchActive(id, session),
            leave: (id, session) => communities.leave(id, session),
        },
    },

    // Phonebook
    phonebook: {
        getContacts: phonebook.getContacts,
    },

    // Notifications
    notifications: {
        sendToCommunity: (title, body, communityId, senderName, session) =>
            notifications.sendToCommunity(title, body, communityId, senderName, session),
        updateToken: (token, session) => notifications.updateToken(token, session),
        getHistory: notifications.getHistory,
    },
};
