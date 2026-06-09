import { describe, it, expect } from 'vitest';
import {
	formatDate,
	formatTime,
	formatDistance,
	toDateRange,
	getRelativeDateLabel,
	toLocalIsoDate,
	shiftCalendarMonth,
	getWeekdayLabels,
	addIsoDateDays,
	formatIsoDate
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
	it('returns a colon-separated HH:mm string', () => {
		expect(formatTime('2026-05-15T14:30:00')).toMatch(/^\d{2}:\d{2}$/);
	});

	it('emits 18:00 for an 18:00 input', () => {
		expect(formatTime('2026-05-15T18:00:00')).toBe('18:00');
	});
});

describe('toDateRange', () => {
	it('always returns the Asia/Jakarta day range regardless of host timezone', () => {
		const { date_from, date_to } = toDateRange('2026-05-15');
		expect(date_from).toBe('2026-05-15T00:00:00+07:00');
		expect(date_to).toBe('2026-05-15T23:59:59+07:00');
	});
});

describe('toLocalIsoDate', () => {
	it('returns the Asia/Jakarta-visible date when UTC is still on the previous day', () => {
		const jakartaJuneFirst = new Date('2026-05-31T17:30:00Z');
		expect(toLocalIsoDate(jakartaJuneFirst)).toBe('2026-06-01');
	});
});

describe('shiftCalendarMonth', () => {
	it('normalizes to day one before moving from January 31 to February', () => {
		expect(shiftCalendarMonth('2026-01-31', 1)).toBe('2026-02-01');
	});
});

describe('addIsoDateDays', () => {
	it('adds calendar days without host timezone conversion', () => {
		expect(addIsoDateDays('2026-05-31', 1)).toBe('2026-06-01');
	});
});

describe('formatIsoDate', () => {
	it('formats the requested calendar date in Asia/Jakarta', () => {
		expect(
			formatIsoDate('2026-06-01', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})
		).toBe('Senin, 1 Juni 2026');
	});
});

describe('getWeekdayLabels', () => {
	it('derives seven localized weekday labels starting on Sunday', () => {
		expect(getWeekdayLabels('id-ID')).toEqual(['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']);
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
		expect(result).toMatch(/14:30/);
	});

	it('returns "Besok, …" when the date is the next day', () => {
		const now = new Date();
		now.setHours(10, 0, 0, 0);
		const dateStr = `${localDateStr(now, 1)}T09:00:00`;
		const result = getRelativeDateLabel(dateStr, now);
		expect(result).toContain('Besok');
		expect(result).toMatch(/09:00/);
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
		expect(result).toMatch(/09:00/);
	});
});
