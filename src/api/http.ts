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
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}: ${text}`);
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