/**
 * Unit tests for pin-tier.ts — urgency tiering boundaries + token mapping.
 *
 * All reference instants are constructed from local-calendar noon so tests
 * pass regardless of the host's timezone offset. The `today` bucket now uses
 * local calendar dates (getFullYear/getMonth/getDate) to correctly handle
 * WIB (UTC+7) evening sessions that previously crossed a UTC date boundary.
 */
import { describe, it, expect } from 'vitest';
import { deriveTier, tierToTokenColor, type PinTier } from './pin-tier.js';

// ---------------------------------------------------------------------------
// Reference instant: local noon on an arbitrary date so offsets in either
// direction stay on the same local calendar day.
// ---------------------------------------------------------------------------

function localNoon(year: number, month: number, day: number): Date {
	const d = new Date();
	d.setFullYear(year, month - 1, day);
	d.setHours(12, 0, 0, 0);
	return d;
}

const NOW = localNoon(2026, 6, 3); // 2026-06-03 12:00 local time

function minutesFromNow(minutes: number): Date {
	return new Date(NOW.getTime() + minutes * 60_000);
}

// ---------------------------------------------------------------------------
// deriveTier — now tier (≤ 30 min)
// ---------------------------------------------------------------------------

describe('deriveTier — now tier (diff in [-120, 30] min)', () => {
	it('returns "now" when start is exactly now (diff = 0)', () => {
		expect(deriveTier(NOW, NOW)).toBe('now');
	});

	it('returns "now" when start is 30 min from now (inclusive upper boundary)', () => {
		expect(deriveTier(minutesFromNow(30), NOW)).toBe('now');
	});

	it('returns "now" when start is 1 min in the past (diff = -1)', () => {
		expect(deriveTier(minutesFromNow(-1), NOW)).toBe('now');
	});

	it('returns "now" when start is 1 min away', () => {
		expect(deriveTier(minutesFromNow(1), NOW)).toBe('now');
	});

	it('returns "now" when start is 120 min in the past (inclusive lower boundary)', () => {
		expect(deriveTier(minutesFromNow(-120), NOW)).toBe('now');
	});

	it('returns "today" (not "now") when event started 180 min ago (past the now window)', () => {
		// 180 min ago, same local day as NOW (noon - 180 min = 09:00) → today
		expect(deriveTier(minutesFromNow(-180), NOW)).toBe('today');
	});
});

// ---------------------------------------------------------------------------
// deriveTier — soon tier (30 < diff ≤ 180 min)
// ---------------------------------------------------------------------------

describe('deriveTier — soon tier (30 < diff ≤ 180 min)', () => {
	it('returns "soon" when start is 31 min away (just past now boundary)', () => {
		expect(deriveTier(minutesFromNow(31), NOW)).toBe('soon');
	});

	it('returns "soon" when start is 180 min away (inclusive boundary)', () => {
		expect(deriveTier(minutesFromNow(180), NOW)).toBe('soon');
	});

	it('returns "soon" when start is 90 min away', () => {
		expect(deriveTier(minutesFromNow(90), NOW)).toBe('soon');
	});
});

// ---------------------------------------------------------------------------
// deriveTier — today tier (same local calendar day, > 180 min)
// ---------------------------------------------------------------------------

describe('deriveTier — today tier (same local calendar day, > 180 min away)', () => {
	it('returns "today" when start is 181 min away on the same local day', () => {
		// noon + 181min = 15:01 local — same local date
		expect(deriveTier(minutesFromNow(181), NOW)).toBe('today');
	});

	it('returns "today" when start is earlier the same day (before now, > 30 min)', () => {
		// noon - 120min = 10:00 local — same local date, diff < 0 → now, not today.
		// Use a "now" set to 08:00 local so the 10:00 start is 181 min ahead.
		const earlyNow = localNoon(2026, 6, 3);
		earlyNow.setHours(8, 0, 0, 0);
		const laterSameDay = new Date(earlyNow.getTime() + 181 * 60_000); // 11:01 local
		expect(deriveTier(laterSameDay, earlyNow)).toBe('today');
	});

	// -----------------------------------------------------------------------
	// WIB evening bug regression (UTC+7)
	// A session starting at 19:30 WIB (12:30 UTC same day) must be "today"
	// even though the UTC dates of `now` and `start` might differ in other
	// timezones. We verify using local-time construction so this test is
	// timezone-agnostic.
	// -----------------------------------------------------------------------
	it('returns "today" for an evening session on the same local date (WIB regression)', () => {
		// Simulate: now = 11:00 local, session = 19:30 local (same date, 510min ahead)
		const localNow = new Date(2026, 5, 3, 11, 0, 0, 0); // month is 0-indexed
		const eveningStart = new Date(2026, 5, 3, 19, 30, 0, 0); // same local date
		expect(deriveTier(eveningStart, localNow)).toBe('today');
	});
});

// ---------------------------------------------------------------------------
// deriveTier — later tier (different local calendar day)
// ---------------------------------------------------------------------------

describe('deriveTier — later tier (different local calendar day)', () => {
	it('returns "later" when start is the next local day', () => {
		const nextDay = localNoon(2026, 6, 4);
		expect(deriveTier(nextDay, NOW)).toBe('later');
	});

	it('returns "later" when start is two local days away', () => {
		const twoDays = localNoon(2026, 6, 5);
		expect(deriveTier(twoDays, NOW)).toBe('later');
	});

	it('same-day "today" vs next-day "later" with injected now', () => {
		// now = 2026-06-03 20:00 local; sameDay = +181min = 22:01 local → today
		const refNow = new Date(2026, 5, 3, 20, 0, 0, 0);
		const sameDay = new Date(refNow.getTime() + 181 * 60_000);
		expect(deriveTier(sameDay, refNow)).toBe('today');

		// next local day at 01:00 → later
		const nextDay = new Date(2026, 5, 4, 1, 0, 0, 0);
		expect(deriveTier(nextDay, refNow)).toBe('later');
	});
});

// ---------------------------------------------------------------------------
// deriveTier — accepts ISO string
// ---------------------------------------------------------------------------

describe('deriveTier — accepts ISO string', () => {
	it('parses an ISO string and tiers correctly (now)', () => {
		const isoNow = minutesFromNow(10).toISOString();
		expect(deriveTier(isoNow, NOW)).toBe('now');
	});

	it('parses a soon ISO string', () => {
		const isoSoon = minutesFromNow(60).toISOString();
		expect(deriveTier(isoSoon, NOW)).toBe('soon');
	});
});

// ---------------------------------------------------------------------------
// deriveTier — defaults now to current Date
// ---------------------------------------------------------------------------

describe('deriveTier — defaults now to current Date', () => {
	it('does not throw when no now is provided', () => {
		expect(() => deriveTier(new Date())).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// tierToTokenColor — token mapping
// ---------------------------------------------------------------------------

describe('tierToTokenColor', () => {
	const cases: Array<[PinTier, string]> = [
		['now', 'var(--color-pin-now)'],
		['soon', 'var(--color-pin-soon)'],
		['today', 'var(--color-pin-today)'],
		['later', 'var(--color-pin-later)']
	];

	for (const [tier, expected] of cases) {
		it(`maps "${tier}" to "${expected}"`, () => {
			expect(tierToTokenColor(tier)).toBe(expected);
		});
	}
});
