import { describe, it, expect } from 'vitest';
import { normalizeNumber } from '../normalize.js';
describe('normalizeNumber', () => {
    it('parses plain integers', () => {
        expect(normalizeNumber('42')).toBe(42);
        expect(normalizeNumber('0')).toBe(0);
        expect(normalizeNumber('1000')).toBe(1000);
    });
    it('parses plain floats', () => {
        expect(normalizeNumber('42.5')).toBe(42.5);
        expect(normalizeNumber('0.99')).toBe(0.99);
    });
    it('handles ₹ symbol prefix', () => {
        expect(normalizeNumber('₹1,500')).toBe(1500);
        expect(normalizeNumber('₹500')).toBe(500);
    });
    it('handles ₹ with commas', () => {
        expect(normalizeNumber('₹1,500')).toBe(1500);
        expect(normalizeNumber('₹12,000')).toBe(12000);
    });
    it('handles "R" prefix', () => {
        expect(normalizeNumber('R500')).toBe(500);
    });
    it('parses K suffix as thousands', () => {
        expect(normalizeNumber('5K')).toBe(5000);
        expect(normalizeNumber('10k')).toBe(10000);
        expect(normalizeNumber('2.5K')).toBe(2500);
    });
    it('parses single Hindi number words', () => {
        expect(normalizeNumber('paanch')).toBe(5);
        expect(normalizeNumber('das')).toBe(10);
        expect(normalizeNumber('bees')).toBe(20);
        expect(normalizeNumber('pachaas')).toBe(50);
        expect(normalizeNumber('sau')).toBe(100);
    });
    it('parses compound Hindi numbers (number + multiplier)', () => {
        expect(normalizeNumber('paanch sau')).toBe(500);
        expect(normalizeNumber('do hazaar')).toBe(2000);
        expect(normalizeNumber('das hazaar')).toBe(10000);
        expect(normalizeNumber('pachaas hazaar')).toBe(50000);
    });
    it('parses "aath sau pachaas" (hundreds + tens)', () => {
        expect(normalizeNumber('aath sau pachaas')).toBe(850);
        expect(normalizeNumber('chhah sau saat')).toBe(607);
        expect(normalizeNumber('nau sau nabbe')).toBe(990);
    });
    it('parses "1.5 lakh" style', () => {
        expect(normalizeNumber('1.5 lakh')).toBe(150000);
        expect(normalizeNumber('2 lakh')).toBe(200000);
        expect(normalizeNumber('1.5 crore')).toBe(15000000);
    });
    it('parses hyphenated Hindi numbers', () => {
        expect(normalizeNumber('paanch-sau')).toBe(500);
        expect(normalizeNumber('do-hazaar')).toBe(2000);
    });
    it('handles "rupaye" in text', () => {
        expect(normalizeNumber('aath sau pachaas rupaye')).toBe(850);
    });
    it('returns null for empty/whitespace input', () => {
        expect(normalizeNumber('')).toBeNull();
        expect(normalizeNumber('   ')).toBeNull();
    });
    it('returns null for non-numeric non-Hindi input', () => {
        expect(normalizeNumber('abc')).toBeNull();
        expect(normalizeNumber('chawal')).toBeNull();
    });
    it('returns null for null/undefined input', () => {
        expect(normalizeNumber(null)).toBeNull();
        expect(normalizeNumber(undefined)).toBeNull();
    });
    it('parses "shunya" as zero', () => {
        expect(normalizeNumber('shunya')).toBe(0);
    });
    it('parses Hindi numbers for 11-19', () => {
        expect(normalizeNumber('gyarah')).toBe(11);
        expect(normalizeNumber('barah')).toBe(12);
        expect(normalizeNumber('solah')).toBe(16);
    });
    it('handles English lakh spelling', () => {
        expect(normalizeNumber('2 lac')).toBe(200000);
    });
    it('handles karod/crore', () => {
        expect(normalizeNumber('1 karod')).toBe(10000000);
        expect(normalizeNumber('2 crore')).toBe(20000000);
    });
});
//# sourceMappingURL=normalize.test.js.map