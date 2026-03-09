// src/utils/rut.ts

export function onlyDigits(s: string): string {
    return (s || "").replace(/\D+/g, "");
}

export function formatWithDots(digits: string): string {
    const clean = onlyDigits(digits);
    if (!clean) return "";
    const rev = clean.split("").reverse().join("");
    const chunked = rev.match(/.{1,3}/g)?.join(".") ?? rev;
    return chunked.split("").reverse().join("");
}

export function computeDv(digits: string): string {
    const clean = onlyDigits(digits);
    if (!clean) return "";

    let sum = 0;
    let mult = 2;
    for (let i = clean.length - 1; i >= 0; i--) {
        sum += parseInt(clean[i], 10) * mult;
        mult = mult === 7 ? 2 : mult + 1;
    }
    const res = 11 - (sum % 11);
    if (res === 11) return "0";
    if (res === 10) return "K";
    return String(res);
}

export function buildRutNormalized(digits: string): string {
    const clean = onlyDigits(digits);
    if (!clean) return "";
    const dv = computeDv(clean);
    return `${clean}-${dv}`;
}
