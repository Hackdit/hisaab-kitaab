// ──────────────────────────────────────────
// Indian Number Normalization
// Handles: ₹1,500, paanch sau, 1.5 lakh,
// das hazaar, 5K, aath sau pachaas, etc.
// ──────────────────────────────────────────

const HINDI_NUMBERS: Record<string, number> = {
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

const MULTIPLIERS: Record<string, number> = {
  sau: 100, hundred: 100,
  hazaar: 1000, hazar: 1000, thousand: 1000,
  lakh: 100000, lac: 100000,
  crore: 10000000, karod: 10000000, cr: 10000000,
  k: 1000,
};

// Words that should be ignored when they appear after the number expression
const NOISE_WORDS = new Set([
  'rupaye', 'rupeya', 'rupay', 'rupy',
  'paisa', 'paise',
  'rupaiya', 'rupayein',
  'only', 'hi', 'hii', 'heh',
]);

function normalizeHyphens(text: string): string {
  return text.replace(/-/g, ' ');
}

function stripCurrencyPrefix(text: string): string {
  return text
    .replace(/^₹\s*/, '')
    .replace(/^Rs\.?\s*/i, '')
    .replace(/^R\s+/, '')
    .replace(/,/g, '')
    .trim();
}

function findValue(text: string): number | null {
  const cleaned = text.toLowerCase().trim();
  if (HINDI_NUMBERS[cleaned] !== undefined) return HINDI_NUMBERS[cleaned];
  return null;
}

/** Drop trailing noise words and return the shortened text plus whether anything was dropped. */
function stripTrailingNoise(text: string): string {
  const parts = text.toLowerCase().trim().split(/\s+/);
  while (parts.length > 0 && NOISE_WORDS.has(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join(' ');
}

/**
 * Parse a Hindi number expression. Works on already-cleaned text (no ₹/commas).
 * Examples: "paanch sau", "do hazaar", "aath sau pachaas", "1.5 lakh"
 */
function parseCompoundHindi(text: string): number | null {
  let cleaned = text.toLowerCase().trim();
  // Strip trailing noise words like "rupaye", "paisa"
  cleaned = stripTrailingNoise(cleaned);

  const parts = cleaned.split(/\s+/);
  if (parts.length === 0) return null;

  // "1.5 lakh" style (numeric + multiplier)
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const mult = MULTIPLIERS[parts[1]];
    if (!isNaN(num) && mult !== undefined) return num * mult;
  }

  // "5K" (already handled upstream but catch here too)
  if (parts.length === 1) {
    const kMatch = parts[0].match(/^(\d+(?:\.\d+)?)k$/);
    if (kMatch) return parseFloat(kMatch[1]) * 1000;
  }

  // Two-part word expression: "paanch sau", "do hazaar", "pachaas hazaar"
  if (parts.length === 2) {
    const base = findValue(parts[0]);
    const mult = MULTIPLIERS[parts[1]];

    // "paanch sau" — 5 * 100 = 500
    if (base !== null && mult !== undefined) return base * mult;

    // "pachaas hazaar" — tens-word * 1000
    // pachaas = 50, which is >= 10 and acts as a multiplier base
    if (base !== null && base >= 10) {
      // Try matching part[1] as a known multiplier
      if (MULTIPLIERS[parts[1]] !== undefined) return base * MULTIPLIERS[parts[1]];
      // Otherwise fall through
    }
  }

  // Three-part: "chhah sau pachaas" (650)
  if (parts.length === 3) {
    const first = findValue(parts[0]);
    const isHundred = parts[1] === 'sau' || parts[1] === 'hundred';
    const last = findValue(parts[2]);

    if (first !== null && isHundred) {
      const hundredResult = first * 100;
      if (last !== null) return hundredResult + last;
      return hundredResult;
    }

    // "ek hazaar pachaas" (1050)
    const base = findValue(parts[0]);
    const mult = MULTIPLIERS[parts[1]];
    const extra = findValue(parts[2]);
    if (base !== null && mult !== undefined) {
      return base * mult + (extra ?? 0);
    }
  }

  // Four-part: "do hazaar paanch sau" (2500)
  if (parts.length === 4) {
    const part0 = findValue(parts[0]);
    const part2 = findValue(parts[2]);
    if (part0 !== null && MULTIPLIERS[parts[1]] && part2 !== null && (parts[3] === 'sau' || parts[3] === 'hundred')) {
      return part0 * MULTIPLIERS[parts[1]] + part2 * 100;
    }
  }

  return null;
}

/**
 * Normalize Indian number expressions to a plain number.
 *
 * Examples:
 *   "₹1,500"       -> 1500
 *   "paanch sau"    -> 500
 *   "1.5 lakh"      -> 150000
 *   "das hazaar"    -> 10000
 *   "5K"            -> 5000
 *   "aath sau pachaas" -> 850
 */
export function normalizeNumber(input: string): number | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  let cleaned = normalizeHyphens(trimmed);

  // Handle "R500", "R 500" pattern (common Indian shorthand for ₹)
  const rMatch = cleaned.match(/^R\s*(\d+(?:\.\d+)?)$/);
  if (rMatch) return parseFloat(rMatch[1]);

  // Try direct integer/float parse first (after stripping ₹ and commas)
  const stripped = cleaned.replace(/[₹,\s]/g, '');
  const directNum = parseFloat(stripped);
  if (!isNaN(directNum) && /^\d+(\.\d+)?$/.test(stripped)) {
    return directNum;
  }

  // Try "5K", "10k" pattern
  const kMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*[kK]$/);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;

  // Strip currency prefix symbols
  cleaned = stripCurrencyPrefix(cleaned);

  // Try compound Hindi expressions
  const compound = parseCompoundHindi(cleaned);
  if (compound !== null) return compound;

  // Try single Hindi number word
  const noNoise = stripTrailingNoise(cleaned);
  const single = findValue(noNoise);
  if (single !== null) return single;

  // Try plain number after all stripping
  const plainNum = parseFloat(cleaned);
  if (!isNaN(plainNum)) return plainNum;

  return null;
}