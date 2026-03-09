const BASE = "http://192.168.100.153:3002/ventas/pausa/api/v1";

export type LoginResp = { token: string; admin: boolean; creado: boolean };
export type Me = { id: number; nombre: string; rut: string; admin: boolean };

async function req(path: string, init?: RequestInit) {
    const res = await fetch(`${BASE}${path}`, init);
    if (!res.ok) throw new Error(await res.text());
    return res;
}

export async function login(rut: string): Promise<LoginResp> {
    const r = await req("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut }),
    });
    return r.json();
}

export async function me(token: string): Promise<Me> {
    const r = await req("/app_users/me", { headers: { Authorization: `Bearer ${token}` } });
    return r.json();
}

export async function getToday(token: string) {
    const r = await req("/daily_logs/today", { headers: { Authorization: `Bearer ${token}` } });
    return r.json() as Promise<{ fecha: string; morning: { done: boolean }; evening: { done: boolean } }>;
}

export async function mark(token: string, moment: "morning" | "evening") {
    const r = await req(`/daily_logs/mark?moment=${moment}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
    });
    return r.json();
}

export async function setPushToken(token: string, userId: number, expoPushToken: string) {
    const r = await fetch(`${BASE}/app_users/${userId}/push_token`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ expo_push_token: expoPushToken }),
    });
    if (!(r.status === 204 || r.ok)) throw new Error(await r.text());
}

export async function notifyOpened(token: string, moment: "morning" | "evening") {
    await req("/reminders/opened", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ moment }),
    });
}
