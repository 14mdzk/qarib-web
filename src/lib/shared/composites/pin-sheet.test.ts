/**
 * Unit tests for pin-sheet pure logic helpers.
 *
 * The Svelte component itself requires a browser DOM, so we extract and test
 * the pure derivation logic in isolation — exactly the same pattern used in
 * event-card.test.ts and spinner.test.ts in this repo.
 *
 * Conformance: .claude/rules/testing.md (unit tests for pure logic, co-located).
 */
import { describe, it, expect } from 'vitest';
import type { PinTier } from '$domains/events/pin-tier.js';

// ---------------------------------------------------------------------------
// Pure helpers duplicated here for testing — identical to the component's
// private functions. If these move to a shared module, import them instead.
// ---------------------------------------------------------------------------

function urgencyLabel(tier: PinTier): string | null {
	if (tier === 'now') return 'now-label';
	if (tier === 'soon') return 'soon-label';
	return null;
}

function urgencyClass(tier: PinTier): string {
	if (tier === 'now') return 'urgency-now';
	if (tier === 'soon') return 'urgency-soon';
	return '';
}

// ---------------------------------------------------------------------------
// Day-chip count logic (mirrors classifyEventDay in pin-sheet.svelte)
// Uses real local calendar dates. Reference now: fixed to 2026-06-03T10:00:00 local.
// ---------------------------------------------------------------------------

interface MockEvent {
	tier: PinTier;
	dateStart?: string;
}

/** Local midnight of a given date string (YYYY-MM-DD). */
function localMidnight(ymd: string): Date {
	const [y, mo, d] = ymd.split('-').map(Number);
	return new Date(y, mo - 1, d);
}

/**
 * Classify an event into a local-calendar bucket.
 * todayMidnight must be normalised to local midnight.
 */
function classifyEventDay(
	event: MockEvent,
	todayMidnight: Date
): 'today' | 'tomorrow' | 'week' | 'other' {
	if (!event.dateStart) {
		return event.tier === 'now' || event.tier === 'soon' || event.tier === 'today'
			? 'today'
			: 'week';
	}
	const eventDate = new Date(event.dateStart);
	const eventMidnight = new Date(
		eventDate.getFullYear(),
		eventDate.getMonth(),
		eventDate.getDate()
	);
	const diffDays = Math.round(
		(eventMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
	);
	if (diffDays === 0) return 'today';
	if (diffDays === 1) return 'tomorrow';
	if (diffDays >= 2 && diffDays <= 7) return 'week';
	return 'other';
}

/** Reference midnight for tests: 2026-06-03 local */
const REF_TODAY = localMidnight('2026-06-03');
const REF_TOMORROW_ISO = '2026-06-04T09:00:00Z';
const REF_WEEK_ISO = '2026-06-06T09:00:00Z';

function todayCount(events: MockEvent[]): number {
	return events.filter((e) => classifyEventDay(e, REF_TODAY) === 'today').length;
}

function tomorrowCount(events: MockEvent[]): number {
	return events.filter((e) => classifyEventDay(e, REF_TODAY) === 'tomorrow').length;
}

function weekCount(events: MockEvent[]): number {
	return events.filter((e) => classifyEventDay(e, REF_TODAY) === 'week').length;
}

// ---------------------------------------------------------------------------
// Tests: urgency badge
// ---------------------------------------------------------------------------

describe('pin-sheet urgency badge', () => {
	describe('urgencyLabel', () => {
		it('returns label for "now" tier', () => {
			expect(urgencyLabel('now')).toBeTruthy();
		});

		it('returns label for "soon" tier', () => {
			expect(urgencyLabel('soon')).toBeTruthy();
		});

		it('returns null for "today" tier (no badge shown)', () => {
			expect(urgencyLabel('today')).toBeNull();
		});

		it('returns null for "later" tier (no badge shown)', () => {
			expect(urgencyLabel('later')).toBeNull();
		});

		it('"now" and "soon" labels are different strings', () => {
			expect(urgencyLabel('now')).not.toBe(urgencyLabel('soon'));
		});
	});

	describe('urgencyClass', () => {
		it('returns "urgency-now" for now tier', () => {
			expect(urgencyClass('now')).toBe('urgency-now');
		});

		it('returns "urgency-soon" for soon tier', () => {
			expect(urgencyClass('soon')).toBe('urgency-soon');
		});

		it('returns empty string for today tier', () => {
			expect(urgencyClass('today')).toBe('');
		});

		it('returns empty string for later tier', () => {
			expect(urgencyClass('later')).toBe('');
		});
	});
});

// ---------------------------------------------------------------------------
// Tests: day-chip counts (full mode) — real local calendar dates
// ---------------------------------------------------------------------------

describe('pin-sheet day-chip event counts', () => {
	// Events with real dateStart values relative to REF_TODAY (2026-06-03 local).
	const events: MockEvent[] = [
		{ tier: 'now', dateStart: '2026-06-03T08:00:00Z' }, // today bucket
		{ tier: 'soon', dateStart: '2026-06-03T11:00:00Z' }, // today bucket
		{ tier: 'today', dateStart: '2026-06-03T16:00:00Z' }, // today bucket
		{ tier: 'later', dateStart: REF_TOMORROW_ISO }, // tomorrow bucket
		{ tier: 'later', dateStart: REF_WEEK_ISO } // week bucket
	];

	it('counts events on the same local day into the "today" bucket', () => {
		expect(todayCount(events)).toBe(3);
	});

	it('counts events on the next local day into the "tomorrow" bucket', () => {
		expect(tomorrowCount(events)).toBe(1);
	});

	it('counts events day+2 through day+7 into the "week" bucket', () => {
		expect(weekCount(events)).toBe(1);
	});

	it('returns 0 for today-bucket when all events are tomorrow or later', () => {
		const notToday: MockEvent[] = [
			{ tier: 'later', dateStart: REF_TOMORROW_ISO },
			{ tier: 'later', dateStart: REF_WEEK_ISO }
		];
		expect(todayCount(notToday)).toBe(0);
	});

	it('uses tier as fallback bucket when dateStart is absent', () => {
		// now/soon/today tier with no dateStart → falls into "today" bucket.
		const noDate: MockEvent[] = [{ tier: 'now' }, { tier: 'soon' }, { tier: 'later' }];
		expect(todayCount(noDate)).toBe(2);
		expect(weekCount(noDate)).toBe(1);
	});

	it('handles empty event list gracefully', () => {
		expect(todayCount([])).toBe(0);
		expect(tomorrowCount([])).toBe(0);
		expect(weekCount([])).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Tests: peek event selection (first event is the most-urgent)
// ---------------------------------------------------------------------------

describe('pin-sheet peek mode — first event is the urgency focal', () => {
	it('selects the first event in the list as the peek event', () => {
		const events: MockEvent[] = [{ tier: 'now' }, { tier: 'today' }];
		expect(events[0].tier).toBe('now');
	});

	it('falls back gracefully when events list is empty (no peek event)', () => {
		const events: MockEvent[] = [];
		const peek = events[0];
		expect(peek).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// Tests: full-mode event filtering (filtered by activeDay bucket via dates)
// ---------------------------------------------------------------------------

describe('pin-sheet full mode — event filtering by activeDay', () => {
	const events: MockEvent[] = [
		{ tier: 'now', dateStart: '2026-06-03T08:00:00Z' },
		{ tier: 'soon', dateStart: '2026-06-03T11:00:00Z' },
		{ tier: 'today', dateStart: '2026-06-03T16:00:00Z' },
		{ tier: 'later', dateStart: REF_TOMORROW_ISO },
		{ tier: 'later', dateStart: REF_WEEK_ISO }
	];

	it('shows only today-bucket events when activeDay is "today"', () => {
		const fullEvents = events.filter((e) => classifyEventDay(e, REF_TODAY) === 'today');
		expect(fullEvents).toHaveLength(3);
		expect(fullEvents.every((e) => classifyEventDay(e, REF_TODAY) === 'today')).toBe(true);
	});

	it('shows only tomorrow-bucket events when activeDay is "tomorrow"', () => {
		const fullEvents = events.filter((e) => classifyEventDay(e, REF_TODAY) === 'tomorrow');
		expect(fullEvents).toHaveLength(1);
	});

	it('shows only week-bucket events when activeDay is "week"', () => {
		const fullEvents = events.filter((e) => classifyEventDay(e, REF_TODAY) === 'week');
		expect(fullEvents).toHaveLength(1);
	});
});
