import { describe, it, expect } from 'vitest';
import {
	EventStatus,
	statusKey,
	isUpcoming,
	parseNearbyEvents,
	NearbyEventSchema
} from './schema.js';

describe('EventStatus', () => {
	it('has the correct numeric values', () => {
		expect(EventStatus.Incoming).toBe(0);
		expect(EventStatus.Ongoing).toBe(1);
		expect(EventStatus.Cancelled).toBe(10);
		expect(EventStatus.Rescheduled).toBe(11);
		expect(EventStatus.Completed).toBe(99);
	});
});

describe('statusKey', () => {
	it('maps known status codes to stable string keys', () => {
		expect(statusKey(0)).toBe('incoming');
		expect(statusKey(1)).toBe('ongoing');
		expect(statusKey(10)).toBe('cancelled');
		expect(statusKey(11)).toBe('rescheduled');
		expect(statusKey(99)).toBe('completed');
	});

	it('returns "unknown" for an unrecognised status code', () => {
		expect(statusKey(42)).toBe('unknown');
	});

	it('returns "unknown" when status is undefined', () => {
		expect(statusKey(undefined)).toBe('unknown');
	});
});

describe('isUpcoming', () => {
	it('returns true for Incoming (0)', () => {
		expect(isUpcoming(0)).toBe(true);
	});

	it('returns true for Ongoing (1)', () => {
		expect(isUpcoming(1)).toBe(true);
	});

	it('returns false for Cancelled (10)', () => {
		expect(isUpcoming(10)).toBe(false);
	});

	it('returns false for Completed (99)', () => {
		expect(isUpcoming(99)).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(isUpcoming(undefined)).toBe(false);
	});
});

describe('NearbyEventSchema', () => {
	const validItem = {
		id: 1,
		event_id: 'uuid-abc',
		date_start: '2026-06-10T18:00:00Z',
		status: 0,
		place: {
			id: 'place-uuid',
			lat: -6.9175,
			lng: 107.6191,
			name: { id: 'Masjid Al-Ikhlas' },
			address: 'Jl. Contoh No. 1'
		}
	};

	it('parses a valid nearby item', () => {
		const result = NearbyEventSchema.parse(validItem);
		expect(result.id).toBe(1);
		expect(result.place?.lat).toBe(-6.9175);
		expect(result.place?.lng).toBe(107.6191);
	});

	it('parses an item without an expanded place (null)', () => {
		const result = NearbyEventSchema.parse({ ...validItem, place: null });
		expect(result.place).toBeNull();
	});

	it('rejects an item missing the required id field', () => {
		expect(() => NearbyEventSchema.parse({ date_start: '2026-06-10T18:00:00Z' })).toThrow();
	});

	it('rejects a place object with missing lat', () => {
		const bad = { ...validItem, place: { lng: 107.6191 } };
		expect(() => NearbyEventSchema.parse(bad)).toThrow();
	});

	it('rejects a place object with missing lng', () => {
		const bad = { ...validItem, place: { lat: -6.9175 } };
		expect(() => NearbyEventSchema.parse(bad)).toThrow();
	});
});

describe('parseNearbyEvents', () => {
	it('parses an array of valid nearby items', () => {
		const items = [
			{
				id: 1,
				date_start: '2026-06-10T18:00:00Z',
				place: { lat: -6.9, lng: 107.6 }
			},
			{
				id: 2,
				date_start: '2026-06-11T09:00:00Z',
				place: null
			}
		];
		const result = parseNearbyEvents(items);
		expect(result).toHaveLength(2);
		expect(result[0].id).toBe(1);
		expect(result[1].place).toBeNull();
	});

	it('throws when any item in the array is invalid', () => {
		const items = [
			{ id: 1, date_start: '2026-06-10T18:00:00Z' },
			{ date_start: '2026-06-11T09:00:00Z' } // missing id
		];
		expect(() => parseNearbyEvents(items)).toThrow();
	});
});
