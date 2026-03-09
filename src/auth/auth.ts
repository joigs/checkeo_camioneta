// src/auth/auth.ts
import { API_BASE } from "../config";

type LoginOk = { token: string; admin: boolean; creado: boolean };
type LoginFail = { error: string; error_code?: "password_required" | "invalid_password" | string; admin?: boolean };
export type LoginResp = LoginOk;

export type MeResp = {
    id: number; nombre: string; rut: string; correo: string;
    admin: boolean; activo: boolean; estado: boolean; creado: boolean;
};

async function handleWithCodes(r: Response) {
    const text = await r.text().catch(() => "");
    let json: any = undefined;
    try { json = text ? JSON.parse(text) : undefined; } catch {}
    if (!r.ok) {
        const err = new Error((json?.error as string) || text || `HTTP ${r.status}`) as Error & { code?: string };
        if (json?.error_code) (err as any).code = json.error_code;
        throw err;
    }
    return json ?? {};
}

export async function loginByRut(rut: string, password?: string): Promise<LoginResp> {
    const r = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password ? { rut, password } : { rut }),
    });
    return handleWithCodes(r);
}

export async function fetchMe(token: string): Promise<MeResp> {
    const r = await fetch(`${API_BASE}/app_users/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const json = await handleWithCodes(r);
    return json as MeResp;
}

export type RegisterPayload = { nombre: string; rut: string; correo: string };

export async function registerUser(payload: RegisterPayload) {
    const r = await fetch(`${API_BASE}/app_users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_user: payload }),
    });
    return handleWithCodes(r);
}
