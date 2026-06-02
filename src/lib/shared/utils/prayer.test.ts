import { describe, it, expect } from 'vitest';
import { getPrayerLabel } from './prayer.js';

describe('getPrayerLabel', () => {
	it("returns Ba'da Maghrib for 'maghrib'", () => {
		expect(getPrayerLabel('maghrib')).toBe("Ba'da Maghrib");
	});

	it("returns Ba'da Subuh for 'subuh'", () => {
		expect(getPrayerLabel('subuh')).toBe("Ba'da Subuh");
	});

	it("returns Ba'da Dzuhur for 'dzuhr'", () => {
		expect(getPrayerLabel('dzuhr')).toBe("Ba'da Dzuhur");
	});

	it("returns Ba'da Ashar for 'asr'", () => {
		expect(getPrayerLabel('asr')).toBe("Ba'da Ashar");
	});

	it("returns Ba'da Isya for 'isha'", () => {
		expect(getPrayerLabel('isha')).toBe("Ba'da Isya");
	});

	it("returns Waktu Dhuha for 'dhuha'", () => {
		expect(getPrayerLabel('dhuha')).toBe('Waktu Dhuha');
	});

	it('is case-insensitive', () => {
		expect(getPrayerLabel('MAGHRIB')).toBe("Ba'da Maghrib");
		expect(getPrayerLabel('Subuh')).toBe("Ba'da Subuh");
	});

	it('returns null for null input', () => {
		expect(getPrayerLabel(null)).toBeNull();
	});

	it('returns null for undefined input', () => {
		expect(getPrayerLabel(undefined)).toBeNull();
	});

	it('passes through unknown keys as-is', () => {
		expect(getPrayerLabel('jum_at')).toBe('jum_at');
		expect(getPrayerLabel('unknown_prayer')).toBe('unknown_prayer');
	});
});
