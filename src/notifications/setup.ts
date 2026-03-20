import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

export async function initNotifications() {
    await notifee.requestPermission();
    await notifee.createChannel({
        id: 'camioneta_alerts',
        name: 'Alertas de Camioneta',
        importance: AndroidImportance.HIGH,
    });
}

export async function displayNotification(title: string, body: string) {
    await notifee.displayNotification({
        title,
        body,
        android: {
            channelId: 'camioneta_alerts',
            smallIcon: 'ic_launcher',
            pressAction: {
                id: 'default',
            },
        },
    });
}

export async function clearAllNotifications() {
    await notifee.cancelAllNotifications();
}

messaging().onMessage(async remoteMessage => {

    if (remoteMessage.notification) {
        await displayNotification(
            remoteMessage.notification.title || 'Nueva Notificación',
            remoteMessage.notification.body || ''
        );
    }
});

messaging().setBackgroundMessageHandler(async remoteMessage => {

});