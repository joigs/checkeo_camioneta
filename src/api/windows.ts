import { API_BASE } from "../config";

export type PauseWindow = {
    id: number;
    moment: "morning" | "evening";
    hour: number;
    minute: number;
    enabled: boolean;
    server_now?: string;
    duration_minutes?: number;
};

let lastServerNow: string | null = null;

export function getLastServerNow(): string | null {
    return lastServerNow;
}

export async function fetchPauseWindows(token: string): Promise<PauseWindow[]> {
    const r = await fetch(`${API_BASE}/pause_windows`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(await r.text());
    const json = await r.json();
    if (Array.isArray(json) && json.length > 0 && typeof json[0].server_now === "string") {
        lastServerNow = json[0].server_now;
    } else {
        lastServerNow = null;
    }
    return json as PauseWindow[];
}
