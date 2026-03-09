export const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);

export const fmtTime = (d: Date) =>
    new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

export const fmtTimeMaybe = (v?: string | null) => {
    if (!v) return "";
    const dt = new Date(v);
    if (isNaN(dt.getTime())) return "";
    return fmtTime(dt);
};


export const fmtDMY = (d: Date) =>
    new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
        .format(d).replace(/\./g, "-").replace(/\//g, "-");

export const fmtDM = (d: Date) =>
    new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit" })
        .format(d).replace(/\./g, "-").replace(/\//g, "-");
