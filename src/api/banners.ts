// src/api/banners.ts
import { API_BASE } from "../config";

export type Banner = {
    id: number;
    kind: "inline" | "modal";
    message: string;
    link_url?: string | null;
    link_label?: string | null;
    enabled: boolean;
    admin_only: boolean;
    created_at: string;
    version: number;
};

export type BannersResp = {
    inline: Banner | null;
    modal: Banner | null;
};

export async function fetchBanners(token: string): Promise<BannersResp> {
    const clientVersion = 2;
    const r = await fetch(`${API_BASE}/banners?version_cliente=${clientVersion}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}
