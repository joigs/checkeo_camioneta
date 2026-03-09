// src/api/holidays.ts
import { API_BASE } from "../config";

export async function fetchHolidaysBetween(token: string, startISO: string, endISO: string): Promise<string[]> {
    const r = await fetch(`${API_BASE}/holidays/between?start=${startISO}&end=${endISO}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const t = await r.text().catch(() => "");
    if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
    return t ? JSON.parse(t) : [];
}
