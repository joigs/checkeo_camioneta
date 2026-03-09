// src/api/users.ts
import { API_BASE } from "../config";

async function handle(r: Response) {
    const t = await r.text().catch(() => "");
    if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
    return t ? JSON.parse(t) : {};
}

export type AppUser = {
    id: number; nombre: string; rut: string; correo: string;
    admin: boolean; activo: boolean; estado: boolean; creado: boolean;
};

export async function listUsers(jwt: string): Promise<AppUser[]> {
    const r = await fetch(`${API_BASE}/app_users`, { headers: { Authorization: `Bearer ${jwt}` } });
    return handle(r);
}

export async function listPending(jwt: string): Promise<AppUser[]> {
    const r = await fetch(`${API_BASE}/app_users/pending`, { headers: { Authorization: `Bearer ${jwt}` } });
    return handle(r);
}

export async function approveUser(jwt: string, id: number): Promise<void> {
    const r = await fetch(`${API_BASE}/app_users/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!r.ok) throw new Error(await r.text());
}

export async function deleteUser(jwt: string, id: number): Promise<void> {
    const r = await fetch(`${API_BASE}/app_users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!r.ok) throw new Error(await r.text());
}

export async function setActive(jwt: string, id: number, activo: boolean): Promise<{ id: number; activo: boolean }> {
    const r = await fetch(`${API_BASE}/app_users/${id}/active?activo=${activo ? "true" : "false"}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${jwt}` },
    });
    return handle(r);
}

export async function saveFcmToken(jwt: string, userId: number, fcmToken: string): Promise<void> {
    const r = await fetch(`${API_BASE}/app_users/${userId}/push_token`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fcm_token: fcmToken }),
    });
    if (!r.ok && r.status !== 204) throw new Error(await r.text());
}
