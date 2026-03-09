import { API_BASE } from "../config";

export async function api<T = any>(
    path: string,
    opts: RequestInit = {},
    token?: string
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(opts.headers as Record<string, string> | undefined),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}
