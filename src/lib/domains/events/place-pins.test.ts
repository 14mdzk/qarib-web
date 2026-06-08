/**
 * Unit tests for groupOccurrencesToPlacePins.
 *
 * Conformance: rule .claude/rules/testing.md (unit tests, co-located with unit).
 */
import { describe, it, expect } from 'vitest';
import {
	groupFuturePlaces,
	groupOccurrencesToPlacePins,
	mergeNearbyPlacesWithEventPins
} from './place-pins.js';
import type { EventRecurringResponseWithPlace } from './schema.js';
import type { PlaceResponse } from '$domains/places/schema.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Fixed reference "now" for all tests: 2026-06-03T10:00:00Z */
const NOW = new Date('2026-06-03T10:00:00Z');

/** Test labels matching the default fallbacks so existing assertions still pass. */
const LABELS = { now: 'NOW', later: 'Besok' };

function makeOccurrence(
	id: number,
	placeId: string,
	lat: number,
	lng: number,
	dateStart: string
): EventRecurringResponseWithPlace {
	return {
		id,
		event_id: `event-${id}`,
		date_start: dateStart,
		place: {
			id: placeId,
			lat,
			lng,
			name: { id: `Masjid ${placeId}` }
		}
	} as unknown as EventRecurringResponseWithPlace;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('groupOccurrencesToPlacePins', () => {
	it('returns an empty array when given no events', () => {
		expect(groupOccurrencesToPlacePins([], LABELS, NOW)).toEqual([]);
	});

	it('produces one pin per place even with multiple occurrences', () => {
		const events = [
			makeOccurrence(1, 'place-a', -6.732, 108.552, '2026-06-03T14:00:00Z'),
			makeOccurrence(2, 'place-a', -6.732, 108.552, '2026-06-03T19:00:00Z'),
			makeOccurrence(3, 'place-b', -6.74, 108.561, '2026-06-03T15:00:00Z')
		];

		const pins = groupOccurrencesToPlacePins(events, LABELS, NOW);
		expect(pins).toHaveLength(2);
		expect(pins.map((p) => p.id).sort()).toEqual(['place-a', 'place-b']);
	});

	it('picks the most urgent tier (now > soon > today > later)', () => {
		// place-a has one 'today' and one 'now' occurrence: result should be 'now'.
		// now-window: diff in [-120, 30] min from NOW (10:00Z).
		// 10:15Z = 15 min future → 'now'
		// 14:00Z = 240 min future → 'today' (same local day)
		const events = [
			makeOccurrence(1, 'place-a', -6.732, 108.552, '2026-06-03T10:15:00Z'), // now
			makeOccurrence(2, 'place-a', -6.732, 108.552, '2026-06-03T14:00:00Z') // today
		];

		const pins = groupOccurrencesToPlacePins(events, LABELS, NOW);
		expect(pins).toHaveLength(1);
		expect(pins[0].tier).toBe('now');
	});

	it('uses "NOW" label for now-tier pins', () => {
		const events = [makeOccurrence(1, 'place-a', -6.732, 108.552, '2026-06-03T10:10:00Z')];
		const pins = groupOccurrencesToPlacePins(events, LABELS, NOW);
		expect(pins[0].label).toBe('NOW');
	});

	it('uses "Besok" label for later-tier pins', () => {
		// 2026-06-05 is two days after NOW → later tier
		const events = [makeOccurrence(1, 'place-a', -6.732, 108.552, '2026-06-05T14:00:00Z')];
		const pins = groupOccurrencesToPlacePins(events, LABELS, NOW);
		expect(pins[0].tier).toBe('later');
		expect(pins[0].label).toBe('Besok');
	});

	it('uses HH:mm label for today/soon tier pins', () => {
		// 12:30Z is 150 min future from 10:00Z → 'soon'
		const events = [makeOccurrence(1, 'place-a', -6.732, 108.552, '2026-06-03T12:30:00Z')];
		const pins = groupOccurrencesToPlacePins(events, LABELS, NOW);
		expect(pins[0].tier).toBe('soon');
		// formatTime returns HH:mm in local time; accept any HH:mm pattern.
		expect(pins[0].label).toMatch(/^\d{2}:\d{2}$/);
	});

	it('excludes occurrences without a valid place id', () => {
		const events = [
			{
				id: 1,
				date_start: '2026-06-03T14:00:00Z',
				place: { lat: -6.732, lng: 108.552 } // no id
			} as unknown as EventRecurringResponseWithPlace
		];
		expect(groupOccurrencesToPlacePins(events, LABELS, NOW)).toHaveLength(0);
	});

	it('excludes occurrences with non-numeric lat/lng', () => {
		const events = [
			{
				id: 1,
				date_start: '2026-06-03T14:00:00Z',
				place: { id: 'place-a', lat: null, lng: null }
			} as unknown as EventRecurringResponseWithPlace
		];
		expect(groupOccurrencesToPlacePins(events, LABELS, NOW)).toHaveLength(0);
	});

	it('returns correct lat/lng for the pin', () => {
		const events = [makeOccurrence(1, 'place-a', -6.732, 108.552, '2026-06-03T14:00:00Z')];
		const pins = groupOccurrencesToPlacePins(events, LABELS, NOW);
		expect(pins[0].lat).toBe(-6.732);
		expect(pins[0].lng).toBe(108.552);
	});

	it('uses caller-supplied labels for now and later tiers', () => {
		const customLabels = { now: 'CUSTOM_NOW', later: 'CUSTOM_LATER' };
		const nowEvent = [makeOccurrence(1, 'place-a', -6.732, 108.552, '2026-06-03T10:10:00Z')];
		const laterEvent = [makeOccurrence(2, 'place-b', -6.74, 108.561, '2026-06-05T14:00:00Z')];

		const nowPins = groupOccurrencesToPlacePins(nowEvent, customLabels, NOW);
		const laterPins = groupOccurrencesToPlacePins(laterEvent, customLabels, NOW);

		expect(nowPins[0].label).toBe('CUSTOM_NOW');
		expect(laterPins[0].label).toBe('CUSTOM_LATER');
	});
});

describe('groupFuturePlaces', () => {
	it('dedupes future suggestions by event series instead of occurrence count', () => {
		const events = [
			makeOccurrence(1, 'place-a', -6.732, 108.552, '2026-06-04T10:00:00Z'),
			makeOccurrence(2, 'place-a', -6.732, 108.552, '2026-06-11T10:00:00Z'),
			makeOccurrence(3, 'place-a', -6.732, 108.552, '2026-06-18T10:00:00Z')
		];
		events[0].event_id = 'series-a';
		events[1].event_id = 'series-a';
		events[2].event_id = 'series-b';

		const places = groupFuturePlaces(events, (iso) => iso.slice(0, 10));

		expect(places).toHaveLength(1);
		expect(places[0]).toMatchObject({
			id: 'place-a',
			name: 'Masjid place-a',
			count: 2,
			nextLabel: '2026-06-04'
		});
	});
});

describe('mergeNearbyPlacesWithEventPins', () => {
	it('keeps today event pins and adds nearby places without today events as muted upcoming pins', () => {
		const eventPins = [
			{ id: 'place-a', lat: -6.732, lng: 108.552, tier: 'today' as const, label: '13:00' }
		];
		const places = [
			{
				id: 'place-a',
				lat: -6.732,
				lng: 108.552,
				name: { id: 'Masjid A' }
			},
			{
				id: 'place-b',
				lat: -6.74,
				lng: 108.561,
				name: { id: 'Masjid B' }
			}
		] as PlaceResponse[];

		const pins = mergeNearbyPlacesWithEventPins(eventPins, places, 'Nanti');

		expect(pins).toEqual([
			{ id: 'place-a', lat: -6.732, lng: 108.552, tier: 'today', label: '13:00' },
			{ id: 'place-b', lat: -6.74, lng: 108.561, tier: 'later', label: 'Nanti' }
		]);
	});
});
