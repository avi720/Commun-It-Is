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
            list: rides.list,
        },

        // Users
        User: {
            createProfile: users.createProfile,
            update: (userId, userData, session) => users.update(userId, userData, session),
            delete: (userId, session) => users.deleteUser(userId, session),
        },

        // Posts
        Post: {
            list: posts.list,
            create: posts.create,
        },

        // Communities
        communities: {
            getAll: communities.getAll,
            joinByName: communities.joinByName,
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
