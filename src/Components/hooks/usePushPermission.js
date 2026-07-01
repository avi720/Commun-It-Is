import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

let PushModule = null;

async function loadPush() {
    if (!PushModule) {
        PushModule = (await import('@capacitor/push-notifications')).PushNotifications;
    }
    return PushModule;
}

export function usePushPermission() {
    const isNative = Capacitor.isNativePlatform();
    const [permission, setPermission] = useState(isNative ? 'unknown' : 'unsupported');

    useEffect(() => {
        if (!isNative) return;
        let cancelled = false;
        (async () => {
            try {
                const push = await loadPush();
                const { receive } = await push.checkPermissions();
                if (!cancelled) setPermission(receive);
            } catch {
                if (!cancelled) setPermission('unsupported');
            }
        })();
        return () => { cancelled = true; };
    }, [isNative]);

    const requestPermission = useCallback(async () => {
        if (!isNative) return false;
        try {
            const push = await loadPush();
            const { receive } = await push.requestPermissions();
            setPermission(receive);
            if (receive === 'granted') {
                await push.register();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [isNative]);

    const recheck = useCallback(async () => {
        if (!isNative) return;
        try {
            const push = await loadPush();
            const { receive } = await push.checkPermissions();
            setPermission(receive);
        } catch {
            setPermission('unsupported');
        }
    }, [isNative]);

    return { permission, requestPermission, recheck };
}
