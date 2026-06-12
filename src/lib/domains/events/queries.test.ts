/**
 * Tests for the events query helpers.
 *
 * `buildNextPageArgs` is pure logic — tested directly.
 * `buildNearbyQueryOptions` is tested via queryClient.fetchQuery with MSW.
 *
 * Conformance: rule .claude/rules/testing.md
 */
import { describe, it, expect } from 'vitest';
import {
	buildNextPageArgs,
	buildNearbyQueryOptions,
	eventKeys,
	nearbyNextPageParam,
	deriveEventDates
} from './queries.js';
import type { EventRecurringResponse } from './schema.js';
import type { Paginated } from '$core/api';

// ---------------------------------------------------------------------------
// nearbyNextPageParam — getNextPageParam for the infinite query
// ---------------------------------------------------------------------------

/**
 * Helper to build a minimal Paginated page for testing `nearbyNextPageParam`.
 * TanStack's contract: `undefined` = no next page (hasNextPage=false);
 * any other value (including `null`) = there IS a next page.
 * So `nearbyNextPageParam` must return `undefined`, not `null`, when exhausted.
 */
function makePage(next_cursor: string | null | undefined): Paginated<EventRecurringResponse[]> {
	return {
		data: [],
		pagination: {
			next_cursor,
			prev_cursor: null,
			has_more: next_cursor != null,
			has_prev: false
		}
	};
}

describe('nearbyNextPageParam', () => {
	it('returns the cursor string when next_cursor is present', () => {
		const result = nearbyNextPageParam(makePage('abc-cursor-123'));
		expect(result).toBe('abc-cursor-123');
	});

	it('returns undefined (not null) when next_cursor is null — exhaustion case', () => {
		// Returning null would keep hasNextPage=true and loop fetchNextPage forever.
		const result = nearbyNextPageParam(makePage(null));
		expect(result).toBeUndefined();
	});

	it('returns undefined when next_cursor is absent from pagination', () => {
		const page: Paginated<EventRecurringResponse[]> = {
			data: [],
			pagination: { has_more: false, has_prev: false }
		};
		const result = nearbyNextPageParam(page);
		expect(result).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// buildNextPageArgs — cursor accumulation helper
// ---------------------------------------------------------------------------

describe('buildNextPageArgs', () => {
	it('returns args with the next cursor when has_more is true', () => {
		const pagination = { has_more: true, next_cursor: 'cursor-abc', has_prev: false };
		const current = { lat: -6.9, lng: 107.6, limit: 20 };
		const next = buildNextPageArgs(pagination, current);
		expect(next).toEqual({ lat: -6.9, lng: 107.6, limit: 20, cursor: 'cursor-abc' });
	});

	it('returns null when has_more is false', () => {
		const pagination = { has_more: false, has_prev: false };
		const current = { lat: -6.9, lng: 107.6 };
		expect(buildNextPageArgs(pagination, current)).toBeNull();
	});

	it('returns null when has_more is true but next_cursor is absent', () => {
		const pagination = { has_more: true, next_cursor: null, has_prev: false };
		const current = { lat: -6.9, lng: 107.6 };
		expect(buildNextPageArgs(pagination, current)).toBeNull();
	});

	it('overwrites an existing cursor in currentArgs', () => {
		const pagination = { has_more: true, next_cursor: 'page-2', has_prev: true };
		const current = { lat: -6.9, lng: 107.6, cursor: 'page-1' };
		const next = buildNextPageArgs(pagination, current);
		expect(next?.cursor).toBe('page-2');
	});
});

// ---------------------------------------------------------------------------
// eventKeys
// ---------------------------------------------------------------------------

describe('eventKeys', () => {
	it('nearby key includes args', () => {
		const key = eventKeys.nearby({ lat: -6.9, lng: 107.6 });
		expect(key[0]).toBe('events');
		expect(key[1]).toBe('nearby');
		expect(key[2]).toEqual({ lat: -6.9, lng: 107.6 });
	});

	it('get key includes id and expand', () => {
		const key = eventKeys.get(42, 'place,asatidz');
		expect(key).toEqual(['events', 'get', 42, 'place,asatidz']);
	});
});

// ---------------------------------------------------------------------------
// buildNearbyQueryOptions — shape check (pure, no component lifecycle)
// ---------------------------------------------------------------------------

describe('buildNearbyQueryOptions', () => {
	it('returns a TanStack options object with the expected queryKey', () => {
		const opts = buildNearbyQueryOptions({ lat: -6.9175, lng: 107.6191 });
		const key = opts.queryKey as unknown[];
		expect(key[0]).toBe('events.nearby');
		expect(key[1]).toEqual({ lat: -6.9175, lng: 107.6191 });
	});

	it('sets enabled when provided', () => {
		const opts = buildNearbyQueryOptions({}, { enabled: false });
		expect(opts.enabled).toBe(false);
	});

	it('sets staleTime when provided', () => {
		const opts = buildNearbyQueryOptions({}, { staleTime: 60_000 });
		expect(opts.staleTime).toBe(60_000);
	});
});

// ---------------------------------------------------------------------------
// eventKeys — domainCalendar
// ---------------------------------------------------------------------------

describe('eventKeys.domainCalendar', () => {
	it('constructs the query key with domainType, domainId, dateFrom, dateTo', () => {
		const key = eventKeys.domainCalendar({
			domainType: 'subject',
			domainId: 'uuid-123',
			dateFrom: '2026-06-01',
			dateTo: '2026-07-15'
		});
		expect(key[0]).toBe('events');
		expect(key[1]).toBe('domainCalendar');
		expect(key[2]).toEqual({
			domainType: 'subject',
			domainId: 'uuid-123',
			dateFrom: '2026-06-01',
			dateTo: '2026-07-15'
		});
	});
});

// ---------------------------------------------------------------------------
// deriveEventDates
// ---------------------------------------------------------------------------

describe('deriveEventDates', () => {
	it('extracts unique ISO dates from occurrences', () => {
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

	it('handles empty list', () => {
		const dates = deriveEventDates([]);
		expect(dates.size).toBe(0);
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
