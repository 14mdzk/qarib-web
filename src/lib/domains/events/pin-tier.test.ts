/**
 * Unit tests for pin-tier.ts — urgency tiering boundaries + token mapping.
 */
import { describe, it, expect } from 'vitest';
import { deriveTier, tierToTokenColor, type PinTier } from './pin-tier.js';

// Reference instant: 2026-06-03T10:00:00Z
const NOW = new Date('2026-06-03T10:00:00.000Z');

function minutesFromNow(minutes: number): Date {
	return new Date(NOW.getTime() + minutes * 60_000);
}

// ---------------------------------------------------------------------------
// deriveTier — boundary tests
// ---------------------------------------------------------------------------

describe('deriveTier — now tier (≤ 30 min away)', () => {
	it('returns "now" when start is exactly now (diff = 0)', () => {
		expect(deriveTier(NOW, NOW)).toBe('now');
	});

	it('returns "now" when start is 30 min from now (inclusive boundary)', () => {
		expect(deriveTier(minutesFromNow(30), NOW)).toBe('now');
	});

	it('returns "now" when start has already passed (diff < 0)', () => {
		expect(deriveTier(minutesFromNow(-1), NOW)).toBe('now');
	});

	it('returns "now" when start is 1 min away', () => {
		expect(deriveTier(minutesFromNow(1), NOW)).toBe('now');
	});
});

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

describe('deriveTier — today tier (> 180 min away)', () => {
	it('returns "today" when start is 181 min away (just past soon boundary)', () => {
		expect(deriveTier(minutesFromNow(181), NOW)).toBe('today');
	});

	it('returns "today" when start is 8 hours away', () => {
		expect(deriveTier(minutesFromNow(480), NOW)).toBe('today');
	});
});

describe('deriveTier — accepts ISO string', () => {
	it('parses an ISO string and tiers correctly', () => {
		const isoNow = minutesFromNow(10).toISOString();
		expect(deriveTier(isoNow, NOW)).toBe('now');
	});

	it('parses a soon ISO string', () => {
		const isoSoon = minutesFromNow(60).toISOString();
		expect(deriveTier(isoSoon, NOW)).toBe('soon');
	});
});

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
		['now', 'var(--color-primary)'],
		['soon', 'var(--color-accent)'],
		['today', 'var(--color-content-3)']
	];

	for (const [tier, expected] of cases) {
		it(`maps "${tier}" to "${expected}"`, () => {
			expect(tierToTokenColor(tier)).toBe(expected);
		});
	}
});
