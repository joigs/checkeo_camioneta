import { API_BASE } from "../config";

function buildUrl(path: string) {
    return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function postJson<T>(path: string, body: any, headers: Record<string,string> = {}): Promise<T> {
    const r = await fetch(buildUrl(path), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });
    const text = await r.text().catch(() => "");
    if (!r.ok) {
        let errorMsg = text;
        try {
            const parsed = JSON.parse(text);
            if (parsed.error) errorMsg = parsed.error;
            else if (parsed.errors) errorMsg = parsed.errors.join(", ");
        } catch(e) {}
        throw new Error(errorMsg || `HTTP ${r.status}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
}

export async function getJson<T>(path: string, token?: string): Promise<T> {
    const r = await fetch(buildUrl(path), {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const text = await r.text().catch(() => "");
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}: ${text}`);
    return (text ? JSON.parse(text) : {}) as T;
}

export async function putJson<T>(path: string, body: any, headers: Record<string,string> = {}): Promise<T> {
    const r = await fetch(buildUrl(path), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });
    const text = await r.text().catch(() => "");
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}: ${text}`);
    return (text ? JSON.parse(text) : {}) as T;
}

export async function patchJson<T>(path: string, body: any = {}, headers: Record<string,string> = {}): Promise<T> {
    const r = await fetch(buildUrl(path), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });
    const text = await r.text().catch(() => "");
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}: ${text}`);
    return (text ? JSON.parse(text) : {}) as T;
}