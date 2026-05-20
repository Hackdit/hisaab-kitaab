"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const normalize_js_1 = require("../normalize.js");
(0, vitest_1.describe)('normalizeNumber', () => {
    (0, vitest_1.it)('parses plain integers', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('42')).toBe(42);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('0')).toBe(0);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('1000')).toBe(1000);
    });
    (0, vitest_1.it)('parses plain floats', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('42.5')).toBe(42.5);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('0.99')).toBe(0.99);
    });
    (0, vitest_1.it)('handles ₹ symbol prefix', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('₹1,500')).toBe(1500);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('₹500')).toBe(500);
    });
    (0, vitest_1.it)('handles ₹ with commas', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('₹1,500')).toBe(1500);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('₹12,000')).toBe(12000);
    });
    (0, vitest_1.it)('handles "R" prefix', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('R500')).toBe(500);
    });
    (0, vitest_1.it)('parses K suffix as thousands', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('5K')).toBe(5000);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('10k')).toBe(10000);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('2.5K')).toBe(2500);
    });
    (0, vitest_1.it)('parses single Hindi number words', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('paanch')).toBe(5);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('das')).toBe(10);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('bees')).toBe(20);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('pachaas')).toBe(50);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('sau')).toBe(100);
    });
    (0, vitest_1.it)('parses compound Hindi numbers (number + multiplier)', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('paanch sau')).toBe(500);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('do hazaar')).toBe(2000);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('das hazaar')).toBe(10000);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('pachaas hazaar')).toBe(50000);
    });
    (0, vitest_1.it)('parses "aath sau pachaas" (hundreds + tens)', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('aath sau pachaas')).toBe(850);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('chhah sau saat')).toBe(607);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('nau sau nabbe')).toBe(990);
    });
    (0, vitest_1.it)('parses "1.5 lakh" style', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('1.5 lakh')).toBe(150000);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('2 lakh')).toBe(200000);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('1.5 crore')).toBe(15000000);
    });
    (0, vitest_1.it)('parses hyphenated Hindi numbers', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('paanch-sau')).toBe(500);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('do-hazaar')).toBe(2000);
    });
    (0, vitest_1.it)('handles "rupaye" in text', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('aath sau pachaas rupaye')).toBe(850);
    });
    (0, vitest_1.it)('returns null for empty/whitespace input', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('')).toBeNull();
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('   ')).toBeNull();
    });
    (0, vitest_1.it)('returns null for non-numeric non-Hindi input', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('abc')).toBeNull();
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('chawal')).toBeNull();
    });
    (0, vitest_1.it)('returns null for null/undefined input', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)(null)).toBeNull();
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)(undefined)).toBeNull();
    });
    (0, vitest_1.it)('parses "shunya" as zero', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('shunya')).toBe(0);
    });
    (0, vitest_1.it)('parses Hindi numbers for 11-19', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('gyarah')).toBe(11);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('barah')).toBe(12);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('solah')).toBe(16);
    });
    (0, vitest_1.it)('handles English lakh spelling', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('2 lac')).toBe(200000);
    });
    (0, vitest_1.it)('handles karod/crore', () => {
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('1 karod')).toBe(10000000);
        (0, vitest_1.expect)((0, normalize_js_1.normalizeNumber)('2 crore')).toBe(20000000);
    });
});
//# sourceMappingURL=normalize.test.js.map