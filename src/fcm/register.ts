import messaging from '@react-native-firebase/messaging';
import { putJson } from '../api/http';

export async function registerFcmToken(userId: string) {
    try {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            const token = await messaging().getToken();
            await putJson(`usuarios/actualizar_token`, { push_token: token }, { Authorization: `Bearer ${userId}` });
        }
    } catch (e) {
    }
}