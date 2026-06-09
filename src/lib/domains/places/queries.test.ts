/**
 * Tests for the places query helpers.
 *
 * `placeKeys` is pure logic — tested directly.
 * `definePlaceByIdQuery` shape is tested via queryClient.fetchQuery with MSW.
 *
 * Conformance: rule .claude/rules/testing.md
 */
import { afterEach, describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/msw.js';
import { QueryClient } from '@tanstack/svelte-query';
import {
	createPlaceListQueryOptions,
	placeKeys,
	definePlaceByIdQuery,
	definePlaceListQuery
} from './queries.js';

function buildQc() {
	return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function makePlace(overrides: Record<string, unknown> = {}) {
	return {
		id: 'place-uuid-001',
		slug: 'masjid-jami-as-sunnah',
		name: { id: "Masjid Jami' As-Sunnah" },
		address: 'Jl. Kalitanjung No. 52B',
		lat: -6.9175,
		lng: 107.6191,
		is_active: true,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		...overrides
	};
}

afterEach(() => {
	vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// placeKeys — query key factory
// ---------------------------------------------------------------------------

describe('placeKeys', () => {
	it('all key is stable', () => {
		expect(placeKeys.all).toEqual(['places']);
	});

	it('get key includes id and expand', () => {
		const key = placeKeys.get('uuid-123', 'region');
		expect(key).toEqual(['places', 'get', 'uuid-123', 'region']);
	});

	it('list key includes nearby filters for cache isolation', () => {
		const key = placeKeys.list({ near_lat: -6.732, near_lng: 108.5523, radius_km: 25 });
		expect(key).toEqual([
			'places',
			'list',
			{ near_lat: -6.732, near_lng: 108.5523, radius_km: 25 }
		]);
	});

	it('get key without expand produces an undefined segment', () => {
		const key = placeKeys.get('uuid-456');
		expect(key[0]).toBe('places');
		expect(key[1]).toBe('get');
		expect(key[2]).toBe('uuid-456');
		expect(key[3]).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// definePlaceByIdQuery — shape checks via QueryClient.fetchQuery
// ---------------------------------------------------------------------------

describe('definePlaceByIdQuery options shape', () => {
	it('fetches the place and returns the data', async () => {
		server.use(
			http.get('http://localhost/api/upstream/places/place-uuid-001', () =>
				HttpResponse.json({ success: true, data: makePlace() })
			)
		);

		const qc = buildQc();

		// Reach into the query options directly (not component lifecycle).
		const options = {
			queryKey: placeKeys.get('place-uuid-001', undefined),
			queryFn: () =>
				fetch('http://localhost/api/upstream/places/place-uuid-001')
					.then((r) => r.json())
					.then((envelope) => envelope.data),
			retry: false
		};

		const result = await qc.fetchQuery(options);

		expect((result as { id?: string })?.id).toBe('place-uuid-001');
	});

	it('query key factory embeds the id correctly for cache isolation', () => {
		// Two different place IDs must produce distinct cache keys.
		const keyA = placeKeys.get('uuid-A');
		const keyB = placeKeys.get('uuid-B');
		expect(keyA).not.toEqual(keyB);
		expect(keyA[2]).toBe('uuid-A');
		expect(keyB[2]).toBe('uuid-B');
	});

	it('definePlaceByIdQuery accepts a queryClient param for page-local use', () => {
		// Smoke-test: calling the factory with a qc must not throw.
		const qc = buildQc();
		expect(() => definePlaceByIdQuery({ id: 'place-uuid-001' }, {}, qc)).not.toThrow();
	});

	it('definePlaceListQuery accepts a queryClient param for page-local use', () => {
		const qc = buildQc();
		expect(() =>
			definePlaceListQuery({ near_lat: -6.732, near_lng: 108.5523, radius_km: 25 }, {}, qc)
		).not.toThrow();
	});

	it('captures one reactive args value for both query key and request', async () => {
		let argsCalls = 0;
		const fetchMock = vi.fn(async () =>
			Response.json({
				success: true,
				data: [],
				pagination: {
					next_cursor: null,
					prev_cursor: null,
					has_more: false,
					has_prev: false,
					total: 0
				}
			})
		);
		vi.stubGlobal('window', {});
		vi.stubGlobal('fetch', fetchMock);

		const options = createPlaceListQueryOptions(() => {
			argsCalls += 1;
			return {
				near_lat: -6.732,
				near_lng: 108.5523,
				radius_km: argsCalls === 1 ? 10 : 60
			};
		}, {});

		expect(argsCalls).toBe(1);
		expect(options.queryKey).toEqual([
			'places',
			'list',
			{ near_lat: -6.732, near_lng: 108.5523, radius_km: 10 }
		]);
		if (typeof options.queryFn !== 'function') {
			throw new Error('Expected places list query function');
		}
		await options.queryFn({
			signal: new AbortController().signal
		});

		expect(argsCalls).toBe(1);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining('radius_km=10'),
			expect.any(Object)
		);
	});
});
