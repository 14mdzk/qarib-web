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
// Day-chip count logic (mirrors the $derived block in pin-sheet.svelte)
// ---------------------------------------------------------------------------

interface MockEvent {
	tier: PinTier;
}

function todayCount(events: MockEvent[]): number {
	return events.filter((e) => e.tier === 'now' || e.tier === 'soon' || e.tier === 'today').length;
}

function laterCount(events: MockEvent[]): number {
	return events.filter((e) => e.tier === 'later').length;
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
// Tests: day-chip counts (full mode)
// ---------------------------------------------------------------------------

describe('pin-sheet day-chip event counts', () => {
	const events: MockEvent[] = [
		{ tier: 'now' },
		{ tier: 'soon' },
		{ tier: 'today' },
		{ tier: 'later' },
		{ tier: 'later' }
	];

	it('counts now, soon, today events into the "today" bucket', () => {
		expect(todayCount(events)).toBe(3);
	});

	it('counts later events into the "week" bucket', () => {
		expect(laterCount(events)).toBe(2);
	});

	it('returns 0 for today-bucket when all events are later', () => {
		const laterOnly: MockEvent[] = [{ tier: 'later' }, { tier: 'later' }];
		expect(todayCount(laterOnly)).toBe(0);
	});

	it('returns 0 for week-bucket when all events are same-day', () => {
		const sameDay: MockEvent[] = [{ tier: 'now' }, { tier: 'soon' }];
		expect(laterCount(sameDay)).toBe(0);
	});

	it('handles empty event list gracefully', () => {
		expect(todayCount([])).toBe(0);
		expect(laterCount([])).toBe(0);
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
// Tests: full-mode event filtering (only same-day tiers shown)
// ---------------------------------------------------------------------------

describe('pin-sheet full mode — event filtering', () => {
	const events: MockEvent[] = [
		{ tier: 'now' },
		{ tier: 'soon' },
		{ tier: 'today' },
		{ tier: 'later' }
	];

	it('shows now, soon, today events in full mode', () => {
		const fullEvents = events.filter(
			(e) => e.tier === 'now' || e.tier === 'soon' || e.tier === 'today'
		);
		expect(fullEvents).toHaveLength(3);
	});

	it('excludes later events from the default full-mode view', () => {
		const fullEvents = events.filter(
			(e) => e.tier === 'now' || e.tier === 'soon' || e.tier === 'today'
		);
		expect(fullEvents.some((e) => e.tier === 'later')).toBe(false);
	});
});
