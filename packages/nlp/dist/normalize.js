"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeNumber = normalizeNumber;
const HINDI_NUMBERS = {
    shunya: 0, zero: 0,
    ek: 1, one: 1,
    do: 2, two: 2,
    teen: 3, three: 3,
    chaar: 4, char: 4, four: 4,
    paanch: 5, panch: 5, five: 5,
    chhah: 6, che: 6, six: 6,
    saat: 7, seven: 7,
    aath: 8, eight: 8,
    nau: 9, nine: 9,
    das: 10, ten: 10,
    gyarah: 11, eleven: 11,
    barah: 12, twelve: 12,
    terah: 13, thirteen: 13,
    chaudah: 14, fourteen: 14,
    pandrah: 15, fifteen: 15,
    solah: 16, sixteen: 16,
    satrah: 17, seventeen: 17,
    atharah: 18, eighteen: 18,
    unnish: 19, nineteen: 19,
    bees: 20, twenty: 20,
    tees: 30, thirty: 30,
    chalees: 40, forty: 40,
    pachaas: 50, fifty: 50,
    saath: 60, sixty: 60,
    sattar: 70, seventy: 70,
    assi: 80, assii: 80, eighty: 80,
    nabbe: 90, nawwe: 90, ninety: 90,
    sau: 100, hundred: 100,
};
const MULTIPLIERS = {
    sau: 100, hundred: 100,
    hazaar: 1000, hazar: 1000, thousand: 1000,
    lakh: 100000, lac: 100000,
    crore: 10000000, karod: 10000000, cr: 10000000,
    k: 1000,
};
const NOISE_WORDS = new Set([
    'rupaye', 'rupeya', 'rupay', 'rupy',
    'paisa', 'paise',
    'rupaiya', 'rupayein',
    'only', 'hi', 'hii', 'heh',
]);
function normalizeHyphens(text) {
    return text.replace(/-/g, ' ');
}
function stripCurrencyPrefix(text) {
    return text
        .replace(/^₹\s*/, '')
        .replace(/^Rs\.?\s*/i, '')
        .replace(/^R\s+/, '')
        .replace(/,/g, '')
        .trim();
}
function findValue(text) {
    const cleaned = text.toLowerCase().trim();
    if (HINDI_NUMBERS[cleaned] !== undefined)
        return HINDI_NUMBERS[cleaned];
    return null;
}
function stripTrailingNoise(text) {
    const parts = text.toLowerCase().trim().split(/\s+/);
    while (parts.length > 0 && NOISE_WORDS.has(parts[parts.length - 1])) {
        parts.pop();
    }
    return parts.join(' ');
}
function parseCompoundHindi(text) {
    let cleaned = text.toLowerCase().trim();
    cleaned = stripTrailingNoise(cleaned);
    const parts = cleaned.split(/\s+/);
    if (parts.length === 0)
        return null;
    if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const mult = MULTIPLIERS[parts[1]];
        if (!isNaN(num) && mult !== undefined)
            return num * mult;
    }
    if (parts.length === 1) {
        const kMatch = parts[0].match(/^(\d+(?:\.\d+)?)k$/);
        if (kMatch)
            return parseFloat(kMatch[1]) * 1000;
    }
    if (parts.length === 2) {
        const base = findValue(parts[0]);
        const mult = MULTIPLIERS[parts[1]];
        if (base !== null && mult !== undefined)
            return base * mult;
        if (base !== null && base >= 10) {
            if (MULTIPLIERS[parts[1]] !== undefined)
                return base * MULTIPLIERS[parts[1]];
        }
    }
    if (parts.length === 3) {
        const first = findValue(parts[0]);
        const isHundred = parts[1] === 'sau' || parts[1] === 'hundred';
        const last = findValue(parts[2]);
        if (first !== null && isHundred) {
            const hundredResult = first * 100;
            if (last !== null)
                return hundredResult + last;
            return hundredResult;
        }
        const base = findValue(parts[0]);
        const mult = MULTIPLIERS[parts[1]];
        const extra = findValue(parts[2]);
        if (base !== null && mult !== undefined) {
            return base * mult + (extra ?? 0);
        }
    }
    if (parts.length === 4) {
        const part0 = findValue(parts[0]);
        const part2 = findValue(parts[2]);
        if (part0 !== null && MULTIPLIERS[parts[1]] && part2 !== null && (parts[3] === 'sau' || parts[3] === 'hundred')) {
            return part0 * MULTIPLIERS[parts[1]] + part2 * 100;
        }
    }
    return null;
}
function normalizeNumber(input) {
    if (typeof input !== 'string')
        return null;
    const trimmed = input.trim();
    if (trimmed.length === 0)
        return null;
    let cleaned = normalizeHyphens(trimmed);
    const rMatch = cleaned.match(/^R\s*(\d+(?:\.\d+)?)$/);
    if (rMatch)
        return parseFloat(rMatch[1]);
    const stripped = cleaned.replace(/[₹,\s]/g, '');
    const directNum = parseFloat(stripped);
    if (!isNaN(directNum) && /^\d+(\.\d+)?$/.test(stripped)) {
        return directNum;
    }
    const kMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*[kK]$/);
    if (kMatch)
        return parseFloat(kMatch[1]) * 1000;
    cleaned = stripCurrencyPrefix(cleaned);
    const compound = parseCompoundHindi(cleaned);
    if (compound !== null)
        return compound;
    const noNoise = stripTrailingNoise(cleaned);
    const single = findValue(noNoise);
    if (single !== null)
        return single;
    const plainNum = parseFloat(cleaned);
    if (!isNaN(plainNum))
        return plainNum;
    return null;
}
//# sourceMappingURL=normalize.js.map