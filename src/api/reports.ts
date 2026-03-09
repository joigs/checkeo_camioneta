import { API_BASE } from "../config";

export type LogRow = {
    fecha: string;
    user: { id: number; rut: string; nombre: string; correo: string };
    morning: { done: boolean; at?: string | null };
    evening: { done: boolean; at?: string | null };
};

async function handle(r: Response) {
    const t = await r.text().catch(() => "");
    if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
    return t ? JSON.parse(t) : {};
}

export async function fetchLogsBetween(jwt: string, startISO: string, endISO: string): Promise<LogRow[]> {
    const r = await fetch(`${API_BASE}/reports/pausas?start=${startISO}&end=${endISO}`, {
        headers: { Authorization: `Bearer ${jwt}` },
    });
    return handle(r);
}

export function buildPdfUrl(jwt: string, startISO: string, endISO: string) {
    return `${API_BASE}/reports/pausas.pdf?start=${startISO}&end=${endISO}&auth=${encodeURIComponent(jwt)}`;
}
