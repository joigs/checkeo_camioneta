import { API_BASE } from "../config";

export async function getTodayLog(token: string) {
    const r = await fetch(`${API_BASE}/daily_logs/today`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

export async function markMoment(token: string, moment: "morning" | "evening") {
    const r = await fetch(`${API_BASE}/daily_logs/mark?moment=${moment}&version_cliente=2`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

export async function notifyOpened(token: string, moment: "morning" | "evening") {
    await fetch(`${API_BASE}/reminders/opened`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ moment }),
    });
}
