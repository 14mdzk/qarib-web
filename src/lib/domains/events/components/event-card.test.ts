/**
 * Unit tests for EventCard pure formatting helpers.
 *
 * The component itself requires a Svelte component context, so only
 * the pure utilities it delegates to are tested here.
 *
 * Conformance: rule .claude/rules/testing.md (unit tests for pure logic).
 */
import { describe, it, expect } from 'vitest';
import { formatTime, formatDistance } from '$lib/shared/utils/date.js';
import { prayerIntToLabel } from '$lib/shared/utils/prayer.js';
import { statusKey } from '$domains/events/schema.js';

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
