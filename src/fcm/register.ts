import messaging from "@react-native-firebase/messaging";
import { API_BASE } from "../config";

async function handle(r: Response) {
    const t = await r.text().catch(() => "");
    if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
    return t ? JSON.parse(t) : {};
}

async function saveFcmToken(token: string, userId: number, fcmToken: string) {
    const r = await fetch(`${API_BASE}/app_users/${userId}/push_token`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fcm_token: fcmToken }),
    });
    if (!r.ok && r.status !== 204) await handle(r);
}

export async function ensureFcmRegistered(jwt: string, userId: number) {
    const auth = await messaging().requestPermission();
    const enabled =
        auth === messaging.AuthorizationStatus.AUTHORIZED ||
        auth === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) return;

    const fcm = await messaging().getToken();
    if (!fcm) return;

    await saveFcmToken(jwt, userId, fcm);

    messaging().onTokenRefresh(async (newToken) => {
        try { await saveFcmToken(jwt, userId, newToken); } catch {}
    });
}
