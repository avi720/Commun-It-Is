import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const usePushNotifications = () => {
    useEffect(() => {
        const initPush = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    await PushNotifications.addListener('registration', token => {
                        console.info('Push registration success, token: ' + token.value);
                        localStorage.setItem('fcm_token', token.value);
                    });

                    await PushNotifications.addListener('registrationError', err => {
                        console.error('Registration error: ', err.error);
                    });

                    await PushNotifications.addListener('pushNotificationReceived', notification => {
                        alert(`הודעה חדשה:\n${notification.title}\n${notification.body}`);
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
            }
        };
        initPush();

        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };
    }, []);
};