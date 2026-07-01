import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { avior } from '@/Api';

export const usePushNotifications = (session) => {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // DIAGNOSTIC: visible toasts so we can see on-phone where the flow
        // breaks. Remove once user_devices row appears reliably.
        const dbg = (msg) => toast(msg, { duration: 6000 });

        const uploadToken = async (tokenValue, why) => {
            if (!session?.access_token) {
                dbg(`no session, skip upload (${why})`);
                return;
            }
            try {
                dbg(`uploading (${why})`);
                await avior.notifications.updateToken(tokenValue, session);
                dbg(`upload OK (${why})`);
            } catch (err) {
                dbg(`upload FAIL: ${err?.message || err}`);
            }
        };

        const initPush = async () => {
            try {
                dbg(`push init, session=${session?.access_token ? 'yes' : 'no'}`);

                await PushNotifications.addListener('registration', (token) => {
                    localStorage.setItem('fcm_token', token.value);
                    dbg(`reg event, token=${token.value.slice(0, 12)}…`);
                    uploadToken(token.value, 'event');
                });

                await PushNotifications.addListener('registrationError', (err) => {
                    dbg(`reg ERROR: ${err.error}`);
                });

                await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    toast(notification.title || 'הודעה חדשה', {
                        description: notification.body,
                        duration: 8000,
                    });
                });

                let permStatus = await PushNotifications.checkPermissions();
                dbg(`perm check = ${permStatus.receive}`);
                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                    dbg(`perm req = ${permStatus.receive}`);
                }
                if (permStatus.receive === 'granted') {
                    await PushNotifications.register();
                    dbg('register() done');
                } else {
                    dbg(`perm not granted, stopping`);
                    return;
                }

                // Race cover: token may have been saved in a previous run
                // when session wasn't ready yet.
                const saved = localStorage.getItem('fcm_token');
                if (saved) {
                    dbg(`ls token found, len=${saved.length}`);
                    uploadToken(saved, 'localStorage');
                } else {
                    dbg('ls token empty');
                }
            } catch (e) {
                dbg(`init EXC: ${e?.message || e}`);
            }
        };
        initPush();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, [session]);
};
