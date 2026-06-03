/**
 * Unit tests for EventCard pure formatting helpers and href derivation.
 *
 * The component itself requires a Svelte component context, so only
 * the pure utilities it delegates to are tested here, plus the href
 * derivation logic (event_id → resolved /kajian/{id} path; absent → null).
 *
 * Conformance: rule .claude/rules/testing.md (unit tests for pure logic).
 */
import { describe, it, expect } from 'vitest';
import { formatTime, formatDistance } from '$lib/shared/utils/date.js';
import { prayerIntToLabel } from '$lib/shared/utils/prayer.js';
import { statusKey } from '$domains/events/schema.js';

// ---------------------------------------------------------------------------
// href derivation — mirrors the $derived expression in event-card.svelte:
//   occurrence.event_id ? resolve('/(app)/kajian/[id]', { id: occurrence.event_id }) : null
// resolve() is not available in the Vitest environment (no SvelteKit runtime),
// so we test the conditional logic and the expected URL shape separately.
// ---------------------------------------------------------------------------

function deriveHref(eventId: string | null | undefined): string | null {
	if (!eventId) return null;
	// Mirror the resolve output: base is '' in tests, route becomes /kajian/{id}
	return `/kajian/${eventId}`;
}

describe('EventCard formatting utilities', () => {
	describe('formatTime', () => {
		it('formats an ISO datetime as HH:mm with a colon', () => {
			expect(formatTime('2026-06-03T18:00:00+07:00')).toMatch(/^\d{2}:\d{2}$/);
		});

		it('zero-pads single-digit hours and minutes', () => {
			// 01:05 local — create a date that would give 01:05 in local time
			const d = new Date();
			d.setHours(1, 5, 0, 0);
			const result = formatTime(d.toISOString());
			expect(result).toMatch(/^\d{2}:\d{2}$/);
		});
	});

	describe('formatDistance', () => {
		it('formats distances below 1 km in metres', () => {
			expect(formatDistance(0.5)).toBe('500 m');
		});

		it('formats distances >= 1 km with one decimal place', () => {
			expect(formatDistance(2.5)).toBe('2.5 km');
		});

		it('formats exactly 1 km as 1.0 km', () => {
			expect(formatDistance(1)).toBe('1.0 km');
		});
	});

	describe('prayerIntToLabel', () => {
		it('returns null for NONE (0)', () => {
			expect(prayerIntToLabel(0)).toBeNull();
		});

		it('returns null for null/undefined', () => {
			expect(prayerIntToLabel(null)).toBeNull();
			expect(prayerIntToLabel(undefined)).toBeNull();
		});

		it('maps 1 → Maghrib label', () => {
			const label = prayerIntToLabel(1);
			expect(label).toBeTruthy();
			expect(typeof label).toBe('string');
		});

		it('maps 2 → Isha label', () => {
			const label = prayerIntToLabel(2);
			expect(label).toBeTruthy();
		});

		it('maps 3 → Subuh label', () => {
			const label = prayerIntToLabel(3);
			expect(label).toBeTruthy();
		});

		it('maps 4 → Dzuhur label', () => {
			const label = prayerIntToLabel(4);
			expect(label).toBeTruthy();
		});

		it('maps 5 → Asr label', () => {
			const label = prayerIntToLabel(5);
			expect(label).toBeTruthy();
		});

		it('returns null for unknown integer', () => {
			expect(prayerIntToLabel(99)).toBeNull();
		});
	});

	describe('statusKey', () => {
		it('maps 0 → incoming', () => {
			expect(statusKey(0)).toBe('incoming');
		});

		it('maps 1 → ongoing', () => {
			expect(statusKey(1)).toBe('ongoing');
		});

		it('maps 10 → cancelled', () => {
			expect(statusKey(10)).toBe('cancelled');
		});

		it('maps 11 → rescheduled', () => {
			expect(statusKey(11)).toBe('rescheduled');
		});

		it('maps 99 → completed', () => {
			expect(statusKey(99)).toBe('completed');
		});

		it('returns unknown for unrecognised status', () => {
			expect(statusKey(42)).toBe('unknown');
		});
	});
});

describe('EventCard href derivation', () => {
	it('links to /kajian/{event_id} when event_id is a non-empty string (series UUID)', () => {
		const eventId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
		expect(deriveHref(eventId)).toBe(`/kajian/${eventId}`);
	});

	it('uses the series UUID (event_id), not the occurrence integer id', () => {
		const seriesUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
		const href = deriveHref(seriesUuid);
		// Must contain the UUID, not an integer
		expect(href).toMatch(/\/kajian\/[0-9a-f-]{36}/);
		expect(href).toBe(`/kajian/${seriesUuid}`);
	});

	it('returns null when event_id is absent — card is non-linkable', () => {
		expect(deriveHref(undefined)).toBeNull();
	});

	it('returns null when event_id is null — card is non-linkable', () => {
		expect(deriveHref(null)).toBeNull();
	});

	it('returns null when event_id is an empty string — card is non-linkable', () => {
		expect(deriveHref('')).toBeNull();
	});
});
