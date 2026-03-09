// src/notifications/notification.ts
import notifee, { AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

export async function setupAndroidChannel() {
    await notifee.createChannel({
        id: 'pausas',
        name: 'Pausas activas',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [0, 300, 250, 300],
        visibility: AndroidVisibility.PUBLIC,
        bypassDnd: true,
    });
}

export async function registerForPush(): Promise<string | null> {
    try {
        await notifee.requestPermission();

        const token = await messaging().getToken(); // FCM token del dispositivo
        return token || null;
    } catch {
        return null;
    }
}


export function addNotificationResponseListener(cb: (data: any) => void) {
    const unsub = notifee.onForegroundEvent(async (event) => {
        if (event.type === EventType.PRESS) {
            const data = event.detail.notification?.data || {};
            try { cb(data); } catch {}
        }
    });
    return () => unsub();
}
