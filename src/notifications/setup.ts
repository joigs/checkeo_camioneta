// src/notifications/setup.ts
import notifee, {
    AndroidCategory,
    AndroidColor,
    AndroidImportance,
    EventType,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

const CH_ONGOING = 'pausas_ongoing';
const GROUP_ID   = 'pausas_group';
const ONGOING_ID = 'pausas_ongoing_id';

type StrMap = Record<string, string>;
const toStrMap = (input?: { [k: string]: any } | null): StrMap | undefined => {
    if (!input) return undefined;
    const out: StrMap = {};
    for (const [k, v] of Object.entries(input)) {
        out[k] = typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v);
    }
    return out;
};

async function ensureChannel() {
    await notifee.createChannel({
        id: CH_ONGOING,
        name: 'Pausas (fija)',
        importance: AndroidImportance.HIGH,
        sound: 'hollow',
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
        lights: true,
        lightColor: AndroidColor.BLUE,
        bypassDnd: true,
    });
}

async function displayOngoingFromData(data?: StrMap) {
    const title = data?.title ?? 'Pausa activa';
    const body  = data?.body  ?? '¡Hora de tu pausa!';
    await ensureChannel();

    await notifee.displayNotification({
        id: ONGOING_ID,
        title,
        body,
        android: {
            channelId: CH_ONGOING,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.ALARM,
            lightUpScreen: true,
            loopSound: true,
            ongoing: true,
            groupId: GROUP_ID,
            groupSummary: false,
            autoCancel: false,
            pressAction: { id: 'default' },
            smallIcon: 'ic_launcher',
            sound: 'hollow',
            vibrationPattern: [300, 500, 300, 500],
            lights: ['#0000FF', 300, 600],
        },
        ios: {
            threadId: GROUP_ID,
            sound: 'default',
            interruptionLevel: 'timeSensitive',
            foregroundPresentationOptions: {
                badge: true,
                sound: true,
                banner: true,
                list: true,
            },
        },
    });
}

export async function clearAllNotifications() {
    try {
        await notifee.cancelAllNotifications();
        await notifee.cancelDisplayedNotifications();
    } catch {}
}

export async function initNotifications() {
    try {
        await notifee.requestPermission({
            alert: true,
            badge: true,
            sound: true,
            carPlay: true,
            provisional: false,
            announcement: false,
        });
    } catch {}

    messaging().onMessage(async (msg) => {
        const data = toStrMap(msg?.data);
        await displayOngoingFromData(data);
    });

    notifee.onForegroundEvent(async ({ type }) => {
        if (type === EventType.PRESS) {
            await clearAllNotifications();
        }
    });
}

messaging().setBackgroundMessageHandler(async (msg) => {
    const data = toStrMap(msg?.data);
    await displayOngoingFromData(data);
});

notifee.onBackgroundEvent(async ({ type }) => {
    if (type === EventType.PRESS) {
        await clearAllNotifications();
    }
});

export async function clearOngoingPausa() {
    await clearAllNotifications();
}
