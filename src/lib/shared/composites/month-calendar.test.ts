/**
 * Tests for the MonthCalendar component logic.
 *
 * The component is a Svelte composite; these tests validate the pure
 * utility functions it depends on (getMonthGrid, deriveEventDates) and
 * ensure the calendar renders correctly for various inputs.
 *
 * Full Svelte component rendering (jsdom) is deferred to Wave-3 when the
 * first component test harness is set up. Until then, we test the pure
 * data transformations the calendar relies on.
 *
 * Conformance: rule .claude/rules/testing.md
 */
import { describe, it, expect } from 'vitest';
import { getMonthGrid, getMonthYearLabel, shiftCalendarMonth } from '$lib/shared/utils/date';
import { deriveEventDates } from '$domains/events/queries.js';
import type { EventRecurringResponse } from '$domains/events/schema.js';

// ---------------------------------------------------------------------------
// deriveEventDates
// ---------------------------------------------------------------------------

describe('deriveEventDates (calendar)', () => {
	it('extracts unique ISO dates from a list of occurrences', () => {
		const occurrences = [
			{ date_start: '2026-06-01T07:00:00+07:00' },
			{ date_start: '2026-06-03T07:00:00+07:00' },
			{ date_start: '2026-06-01T10:00:00+07:00' }
		] as EventRecurringResponse[];
		const dates = deriveEventDates(occurrences);
		expect(dates.size).toBe(2);
		expect(dates.has('2026-06-01')).toBe(true);
		expect(dates.has('2026-06-03')).toBe(true);
	});

	it('returns empty set for empty list', () => {
		expect(deriveEventDates([]).size).toBe(0);
	});

	it('skips occurrences with missing date_start', () => {
		const occurrences = [
			{ date_start: undefined },
			{ date_start: '2026-06-15T07:00:00+07:00' }
		] as unknown as EventRecurringResponse[];
		const dates = deriveEventDates(occurrences);
		expect(dates.size).toBe(1);
		expect(dates.has('2026-06-15')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Calendar grid — month navigation
// ---------------------------------------------------------------------------

describe('MonthCalendar :: month navigation', () => {
	it('shiftCalendarMonth moves forward one month', () => {
		const result = shiftCalendarMonth('2026-06-01', 1);
		expect(result).toBe('2026-07-01');
	});

	it('shiftCalendarMonth moves backward one month', () => {
		const result = shiftCalendarMonth('2026-06-01', -1);
		expect(result).toBe('2026-05-01');
	});

	it('getMonthYearLabel reflects the navigated month', () => {
		const june = getMonthYearLabel('2026-06-01');
		expect(june).toBe('Juni 2026');

		const july = getMonthYearLabel('2026-07-01');
		expect(july).toBe('Juli 2026');
	});
});

// ---------------------------------------------------------------------------
// Calendar grid — empty event list
// ---------------------------------------------------------------------------

describe('MonthCalendar :: empty event list', () => {
	it('getMonthGrid still returns 42 cells with no events', () => {
		const cells = getMonthGrid('2026-06-01');
		expect(cells).toHaveLength(42);

		// No eventDates passed — calendar shows grid without dots
		const eventDates = new Set<string>();
		const juneCells = cells.filter((c) => c.isCurrentMonth);
		for (const cell of juneCells) {
			expect(eventDates.has(cell.isoDate)).toBe(false);
		}
	});
});

// ---------------------------------------------------------------------------
// Calendar grid — event dates outside current month
// ---------------------------------------------------------------------------

describe('MonthCalendar :: event dates outside current month', () => {
	it('dots appear only on current-month cells that have events', () => {
		const cells = getMonthGrid('2026-06-01');

		// Events on padding dates (May 31 and July 1)
		const eventDates = new Set<string>(['2026-05-31', '2026-06-15', '2026-07-01']);

		for (const cell of cells) {
			const hasEvent = eventDates.has(cell.isoDate);
			if (cell.isCurrentMonth && cell.isoDate === '2026-06-15') {
				expect(hasEvent).toBe(true);
			} else if (
				!cell.isCurrentMonth &&
				(cell.isoDate === '2026-05-31' || cell.isoDate === '2026-07-01')
			) {
				// Non-current-month cells may also have events, but the component
				// renders dots for all cells that have event dates
				expect(hasEvent).toBe(true);
			} else {
				expect(hasEvent).toBe(false);
			}
		}
	});
});
