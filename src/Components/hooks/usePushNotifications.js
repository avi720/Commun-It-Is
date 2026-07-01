import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { avior } from '@/Api';

export const usePushNotifications = (session) => {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const uploadToken = (tokenValue) => {
            if (!session?.access_token) return;
            avior.notifications.updateToken(tokenValue, session)
                .catch((err) => console.error('Token upload failed:', err));
        };

        const initPush = async () => {
            try {
                await PushNotifications.addListener('registration', (token) => {
                    localStorage.setItem('fcm_token', token.value);
                    uploadToken(token.value);
                });

                await PushNotifications.addListener('registrationError', (err) => {
                    console.error('Push registration error:', err.error);
                });

                await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    toast(notification.title || 'הודעה חדשה', {
                        description: notification.body,
                        duration: 8000,
                    });
                });

                let permStatus = await PushNotifications.checkPermissions();
                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }
                if (permStatus.receive !== 'granted') return;

                await PushNotifications.register();

                // Cover the race where register() fired in a previous run before
                // session was ready: the token is in localStorage, upload it now.
                const saved = localStorage.getItem('fcm_token');
                if (saved) uploadToken(saved);
            } catch (e) {
                console.error('Push init error:', e);
            }
        };
        initPush();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, [session]);
};
