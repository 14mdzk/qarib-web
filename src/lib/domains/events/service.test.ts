/**
 * Tests for the events service layer.
 *
 * Uses MSW (via tests/setup.ts) to intercept HTTP.
 * All calls go through `api()` — no hand-rolled fetch.
 *
 * Conformance: rule .claude/rules/testing.md (mock HTTP with MSW).
 */
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/msw.js';
import { ApiError } from '$core/api';
import { fetchNearbyEvents, fetchEventList, fetchEvent, fetchEventSeries } from './service.js';

function baseOpts() {
	return { fetch: globalThis.fetch, baseUrl: 'http://localhost' } as const;
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/**
 * Real single-level envelope shape from qarib-api:
 *   { success: true, data: [...occurrences], pagination: { … } }
 * NOT double-wrapped. The outer `success` + `data` IS the items array.
 */
function makePaginatedResponse(items = [makeOccurrence()]) {
	return {
		success: true,
		data: items,
		pagination: {
			next_cursor: 'cursor-abc',
			has_more: true,
			has_prev: false
		}
	};
}

function makeOccurrence(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		event_id: 'series-uuid',
		date_start: '2026-06-10T18:00:00Z',
		date_end: '2026-06-10T19:00:00Z',
		status: 0,
		going_count: 5,
		distance_km: 1.2,
		place: {
			id: 'place-uuid',
			lat: -6.9175,
			lng: 107.6191,
			name: { id: 'Masjid Al-Ikhlas' },
			address: 'Jl. Contoh No. 1'
		},
		...overrides
	};
}

// ---------------------------------------------------------------------------
// fetchNearbyEvents
// ---------------------------------------------------------------------------

describe('fetchNearbyEvents', () => {
	it('returns the paginated response with data and pagination', async () => {
		server.use(
			http.get('http://localhost/api/upstream/events/nearby', () =>
				HttpResponse.json(makePaginatedResponse())
			)
		);

		const result = await fetchNearbyEvents({ lat: -6.9175, lng: 107.6191 }, baseOpts());

		expect(result.data).toHaveLength(1);
		expect(result.data[0].id).toBe(1);
		expect(result.pagination.has_more).toBe(true);
		expect(result.pagination.next_cursor).toBe('cursor-abc');
	});

	it('surfaces pagination.next_cursor for cursor-based paging', async () => {
		server.use(
			http.get('http://localhost/api/upstream/events/nearby', () =>
				HttpResponse.json(makePaginatedResponse())
			)
		);

		const result = await fetchNearbyEvents({}, baseOpts());

		expect(result.pagination.next_cursor).toBe('cursor-abc');
	});

	it('throws ApiError on a 400 response', async () => {
		// core-fetch throws HTTP_ERROR on non-2xx before reading the body,
		// so no response body is needed here.
		server.use(
			http.get(
				'http://localhost/api/upstream/events/nearby',
				() => new HttpResponse(null, { status: 400, statusText: 'Bad Request' })
			)
		);

		await expect(fetchNearbyEvents({}, baseOpts())).rejects.toSatisfy(
			(e: unknown) => e instanceof ApiError && e.code === 'HTTP_ERROR' && e.status === 400
		);
	});

	it('throws ApiError on HTTP error status', async () => {
		server.use(
			http.get(
				'http://localhost/api/upstream/events/nearby',
				() => new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })
			)
		);

		await expect(fetchNearbyEvents({}, baseOpts())).rejects.toBeInstanceOf(ApiError);
	});
});

// ---------------------------------------------------------------------------
// fetchEventList
// ---------------------------------------------------------------------------

describe('fetchEventList', () => {
	it('returns a paginated response', async () => {
		server.use(
			http.get('http://localhost/api/upstream/events', () =>
				HttpResponse.json(makePaginatedResponse())
			)
		);

		const result = await fetchEventList({}, baseOpts());

		expect(result.data).toHaveLength(1);
		expect(result.pagination).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// fetchEvent
// ---------------------------------------------------------------------------

describe('fetchEvent', () => {
	it('returns a single occurrence', async () => {
		server.use(
			http.get('http://localhost/api/upstream/events/1', () =>
				HttpResponse.json({
					success: true,
					data: makeOccurrence()
				})
			)
		);

		const result = await fetchEvent(1, undefined, baseOpts());

		expect(result?.id).toBe(1);
		expect(result?.status).toBe(0);
	});

	it('throws ApiError on 404', async () => {
		server.use(
			http.get(
				'http://localhost/api/upstream/events/999',
				() => new HttpResponse(null, { status: 404, statusText: 'Not Found' })
			)
		);

		await expect(fetchEvent(999, undefined, baseOpts())).rejects.toBeInstanceOf(ApiError);
	});
});

// ---------------------------------------------------------------------------
// fetchEventSeries
// ---------------------------------------------------------------------------

describe('fetchEventSeries', () => {
	it('returns a series response', async () => {
		server.use(
			http.get('http://localhost/api/upstream/events/series/kajian-pagi', () =>
				HttpResponse.json({
					success: true,
					data: {
						id: 'series-uuid',
						slug: 'kajian-pagi',
						name: { id: 'Kajian Pagi' }
					}
				})
			)
		);

		const result = await fetchEventSeries('kajian-pagi', undefined, baseOpts());

		expect(result?.slug).toBe('kajian-pagi');
	});
});
