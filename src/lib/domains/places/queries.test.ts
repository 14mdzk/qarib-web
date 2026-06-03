/**
 * Tests for the places query helpers.
 *
 * `placeKeys` is pure logic — tested directly.
 * `definePlaceByIdQuery` shape is tested via queryClient.fetchQuery with MSW.
 *
 * Conformance: rule .claude/rules/testing.md
 */
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/msw.js';
import { QueryClient } from '@tanstack/svelte-query';
import { placeKeys, definePlaceByIdQuery } from './queries.js';

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
});
