import { describe, it, expect } from 'vitest';
import {
	formatDate,
	formatTime,
	formatDistance,
	toDateRange,
	getRelativeDateLabel
} from './date.js';

describe('formatDistance', () => {
	it('formats sub-kilometre distances in metres', () => {
		expect(formatDistance(0.5)).toBe('500 m');
	});

	it('formats kilometre distances to one decimal place', () => {
		expect(formatDistance(2.34)).toBe('2.3 km');
	});

	it('treats exactly 1 km as km not m', () => {
		expect(formatDistance(1)).toBe('1.0 km');
	});

	it('rounds metres correctly', () => {
		expect(formatDistance(0.123)).toBe('123 m');
	});
});

describe('formatDate', () => {
	it('returns an Indonesian long date string', () => {
		const result = formatDate('2026-05-15');
		// id-ID long date includes the month name in Indonesian
		expect(result).toContain('2026');
		expect(result).toMatch(/Mei/);
	});
});

describe('formatTime', () => {
	it('returns a 24-hour time string for id-ID', () => {
		// id-ID Intl uses '.' as time separator (CLDR) — e.g. "14.30"
		expect(formatTime('2026-05-15T14:30:00')).toMatch(/^14[.:]30$/);
	});
});

describe('toDateRange', () => {
	it('returns a day range from T00:00:00 to T23:59:59 with a ±HH:MM tz suffix', () => {
		const { date_from, date_to } = toDateRange('2026-05-15');
		expect(date_from).toMatch(/^2026-05-15T00:00:00[+-]\d{2}:\d{2}$/);
		expect(date_to).toMatch(/^2026-05-15T23:59:59[+-]\d{2}:\d{2}$/);
	});

	it('preserves the date string verbatim', () => {
		const { date_from, date_to } = toDateRange('2026-05-15');
		expect(date_from.startsWith('2026-05-15')).toBe(true);
		expect(date_to.startsWith('2026-05-15')).toBe(true);
	});
});

describe('getRelativeDateLabel', () => {
	// Build a fixed local "now" at noon to avoid any midnight/DST edge across TZs.
	// Derive dateStr arguments from now's local calendar fields so toDateString()
	// equality holds on any runner (UTC CI or local +07:00).
	function localDateStr(d: Date, offsetDays = 0): string {
		const copy = new Date(d);
		copy.setDate(copy.getDate() + offsetDays);
		const y = copy.getFullYear();
		const m = String(copy.getMonth() + 1).padStart(2, '0');
		const day = String(copy.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	it('returns "Hari ini, …" when the date is the same day as now', () => {
		const now = new Date();
		now.setHours(10, 0, 0, 0);
		const dateStr = `${localDateStr(now)}T14:30:00`;
		const result = getRelativeDateLabel(dateStr, now);
		expect(result).toContain('Hari ini');
		expect(result).toMatch(/14[.:]30/);
	});

	it('returns "Besok, …" when the date is the next day', () => {
		const now = new Date();
		now.setHours(10, 0, 0, 0);
		const dateStr = `${localDateStr(now, 1)}T09:00:00`;
		const result = getRelativeDateLabel(dateStr, now);
		expect(result).toContain('Besok');
		expect(result).toMatch(/09[.:]00/);
	});

	it('returns the Indonesian weekday name and time for a date 3 days out', () => {
		const now = new Date();
		now.setHours(10, 0, 0, 0);
		const dateStr = `${localDateStr(now, 3)}T09:00:00`;
		const expected3DaysOut = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(
			new Date(dateStr)
		);
		const result = getRelativeDateLabel(dateStr, now);
		expect(result).toContain(expected3DaysOut);
		expect(result).toMatch(/09[.:]00/);
	});
});
