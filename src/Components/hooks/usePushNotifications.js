import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { avior } from '@/Api';

export const usePushNotifications = (session) => {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const initPush = async () => {
            try {
                await PushNotifications.addListener('registration', token => {
                    localStorage.setItem('fcm_token', token.value);
                    if (session?.access_token) {
                        avior.notifications.updateToken(token.value, session)
                            .catch(err => console.error("Token upload failed:", err));
                    }
                });

                await PushNotifications.addListener('registrationError', err => {
                    console.error('Registration error: ', err.error);
                });

                await PushNotifications.addListener('pushNotificationReceived', notification => {
                    toast(notification.title || 'הודעה חדשה', {
                        description: notification.body,
                        duration: 8000,
                    });
                });

                let permStatus = await PushNotifications.checkPermissions();
                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }
                if (permStatus.receive === 'granted') {
                    await PushNotifications.register();
                }
            } catch (e) {
                console.error("Push init error:", e);
            }
        };
        initPush();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, [session]);
};
