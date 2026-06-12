import { afterEach, describe, it, expect } from 'vitest';
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
	formatIsoDate,
	getMonthGrid,
	getMonthYearLabel
} from './date.js';

const ORIGINAL_TZ = process.env.TZ;

afterEach(() => {
	process.env.TZ = ORIGINAL_TZ;
});

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
	it('uses browser-local wall times and offset in Asia/Jakarta', () => {
		process.env.TZ = 'Asia/Jakarta';
		const { date_from, date_to } = toDateRange('2026-05-15');
		expect(date_from).toBe('2026-05-15T00:00:00+07:00');
		expect(date_to).toBe('2026-05-15T23:59:59+07:00');
	});

	it('uses separate offsets across an America/New_York DST transition day', () => {
		process.env.TZ = 'America/New_York';
		const { date_from, date_to } = toDateRange('2026-03-08');
		expect(date_from).toBe('2026-03-08T00:00:00-05:00');
		expect(date_to).toBe('2026-03-08T23:59:59-04:00');
	});
	it('preserves a half-hour offset without normalizing boundaries to Z', () => {
		process.env.TZ = 'Asia/Kolkata';
		const { date_from, date_to } = toDateRange('2026-05-15');
		expect(date_from).toBe('2026-05-15T00:00:00+05:30');
		expect(date_to).toBe('2026-05-15T23:59:59+05:30');
		expect(date_from).not.toMatch(/Z$/);
		expect(date_to).not.toMatch(/Z$/);
	});
});

describe('toLocalIsoDate', () => {
	it('uses current runtime local calendar date without named timezone', () => {
		const instant = new Date('2026-05-31T17:30:00Z');

		process.env.TZ = 'Asia/Jakarta';
		expect(toLocalIsoDate(instant)).toBe('2026-06-01');

		process.env.TZ = 'America/New_York';
		expect(toLocalIsoDate(instant)).toBe('2026-05-31');
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
	it('formats the same calendar date across runtime timezones', () => {
		process.env.TZ = 'America/New_York';
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

describe('getMonthGrid', () => {
	it('returns exactly 42 cells (6 weeks x 7 days)', () => {
		process.env.TZ = 'Asia/Jakarta';
		const cells = getMonthGrid('2026-06-01');
		expect(cells).toHaveLength(42);
	});

	it('first cell is a Sunday', () => {
		process.env.TZ = 'Asia/Jakarta';
		const cells = getMonthGrid('2026-06-01');
		// 2026-06-01 is a Monday, so the first cell should be 2026-05-31 (Sunday)
		expect(cells[0].isoDate).toBe('2026-05-31');
		expect(cells[0].day).toBe(31);
		expect(cells[0].isCurrentMonth).toBe(false);
	});

	it('last cell is a Saturday', () => {
		process.env.TZ = 'Asia/Jakarta';
		const cells = getMonthGrid('2026-06-01');
		// 42nd cell from May 31 is 2026-07-11
		expect(cells[41].isoDate).toBe('2026-07-11');
		expect(cells[41].day).toBe(11);
		expect(cells[41].isCurrentMonth).toBe(false);
	});

	it('marks current-month cells correctly for June 2026', () => {
		process.env.TZ = 'Asia/Jakarta';
		const cells = getMonthGrid('2026-06-01');
		const currentMonthCells = cells.filter((c) => c.isCurrentMonth);
		// June has 30 days
		expect(currentMonthCells).toHaveLength(30);
		expect(currentMonthCells[0].isoDate).toBe('2026-06-01');
		expect(currentMonthCells[29].isoDate).toBe('2026-06-30');
	});

	it('marks isToday when a cell matches the current date', () => {
		process.env.TZ = 'Asia/Jakarta';
		const cells = getMonthGrid('2026-06-01');
		const todayLocal = new Date();
		const todayIso = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
		const todayCell = cells.find((c) => c.isToday);
		if (todayCell) {
			expect(todayCell.isoDate).toBe(todayIso);
		}
	});

	it('pads January 2026 correctly (starts on Thursday)', () => {
		process.env.TZ = 'Asia/Jakarta';
		const cells = getMonthGrid('2026-01-01');
		// 2026-01-01 is Thursday, so first cell should be Dec 28 (Sunday)
		expect(cells[0].isoDate).toBe('2025-12-28');
		expect(cells[0].isCurrentMonth).toBe(false);
		// Jan 1 should be at index 4 (Sun=0, Mon=1, Tue=2, Wed=3, Thu=4)
		expect(cells[4].isoDate).toBe('2026-01-01');
		expect(cells[4].isCurrentMonth).toBe(true);
	});
});

describe('getMonthYearLabel', () => {
	it('returns Indonesian month and year format', () => {
		const label = getMonthYearLabel('2026-06-01');
		expect(label).toBe('Juni 2026');
	});

	it('handles January correctly', () => {
		const label = getMonthYearLabel('2026-01-15');
		expect(label).toBe('Januari 2026');
	});

	it('handles December correctly', () => {
		const label = getMonthYearLabel('2026-12-25');
		expect(label).toBe('Desember 2026');
	});
});
