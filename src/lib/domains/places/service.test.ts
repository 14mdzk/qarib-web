/**
 * Tests for the places service layer.
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
import { fetchPlaceById, fetchPlaceList } from './service.js';

function baseOpts() {
	return { fetch: globalThis.fetch, baseUrl: 'http://localhost' } as const;
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makePlace(overrides: Record<string, unknown> = {}) {
	return {
		id: 'place-uuid-001',
		slug: 'masjid-jami-as-sunnah',
		name: { id: "Masjid Jami' As-Sunnah" },
		description: { id: 'Masjid di Cirebon' },
		phone: '0231-123456',
		address: 'Jl. Kalitanjung No. 52B, Karyamulya',
		region_id: 'region-uuid-001',
		lat: -6.9175,
		lng: 107.6191,
		is_active: true,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		...overrides
	};
}

// ---------------------------------------------------------------------------
// fetchPlaceList
// ---------------------------------------------------------------------------

describe('fetchPlaceList', () => {
	it('returns paginated places and forwards nearby radius filters', async () => {
		server.use(
			http.get('http://localhost/api/upstream/places', ({ request }) => {
				const params = new URL(request.url).searchParams;
				expect(params.get('near_lat')).toBe('-6.732');
				expect(params.get('near_lng')).toBe('108.5523');
				expect(params.get('radius_km')).toBe('50');
				return HttpResponse.json({
					success: true,
					data: [makePlace({ id: 'place-cirebon-001' })],
					pagination: { has_more: false, has_prev: false, total: 1 }
				});
			})
		);

		const result = await fetchPlaceList(
			{ near_lat: -6.732, near_lng: 108.5523, radius_km: 50 },
			baseOpts()
		);

		expect(result.data).toHaveLength(1);
		expect(result.data[0]?.id).toBe('place-cirebon-001');
		expect(result.pagination.total).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// fetchPlaceById
// ---------------------------------------------------------------------------

describe('fetchPlaceById', () => {
	it('returns the place when found', async () => {
		server.use(
			http.get('http://localhost/api/upstream/places/place-uuid-001', () =>
				HttpResponse.json({ success: true, data: makePlace() })
			)
		);

		const result = await fetchPlaceById({ id: 'place-uuid-001' }, baseOpts());

		expect(result?.id).toBe('place-uuid-001');
		expect(result?.slug).toBe('masjid-jami-as-sunnah');
	});

	it('returns the correct name L10n string', async () => {
		server.use(
			http.get('http://localhost/api/upstream/places/place-uuid-001', () =>
				HttpResponse.json({ success: true, data: makePlace() })
			)
		);

		const result = await fetchPlaceById({ id: 'place-uuid-001' }, baseOpts());

		expect(result?.name).toEqual({ id: "Masjid Jami' As-Sunnah" });
	});

	it('surfaces lat and lng coordinates', async () => {
		server.use(
			http.get('http://localhost/api/upstream/places/place-uuid-001', () =>
				HttpResponse.json({ success: true, data: makePlace() })
			)
		);

		const result = await fetchPlaceById({ id: 'place-uuid-001' }, baseOpts());

		expect(result?.lat).toBeCloseTo(-6.9175);
		expect(result?.lng).toBeCloseTo(107.6191);
	});

	it('surfaces the phone field when present', async () => {
		server.use(
			http.get('http://localhost/api/upstream/places/place-uuid-001', () =>
				HttpResponse.json({ success: true, data: makePlace() })
			)
		);

		const result = await fetchPlaceById({ id: 'place-uuid-001' }, baseOpts());

		expect(result?.phone).toBe('0231-123456');
	});

	it('returns undefined phone when the field is null', async () => {
		server.use(
			http.get('http://localhost/api/upstream/places/place-uuid-uuid-no-phone', () =>
				HttpResponse.json({
					success: true,
					data: makePlace({ id: 'place-uuid-uuid-no-phone', phone: null })
				})
			)
		);

		const result = await fetchPlaceById({ id: 'place-uuid-uuid-no-phone' }, baseOpts());

		expect(result?.phone).toBeNull();
	});

	it('throws ApiError on 404', async () => {
		server.use(
			http.get(
				'http://localhost/api/upstream/places/not-found-uuid',
				() => new HttpResponse(null, { status: 404, statusText: 'Not Found' })
			)
		);

		await expect(fetchPlaceById({ id: 'not-found-uuid' }, baseOpts())).rejects.toSatisfy(
			(e: unknown) => e instanceof ApiError && e.status === 404
		);
	});

	it('throws ApiError on 500', async () => {
		server.use(
			http.get(
				'http://localhost/api/upstream/places/server-error-uuid',
				() => new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })
			)
		);

		await expect(fetchPlaceById({ id: 'server-error-uuid' }, baseOpts())).rejects.toBeInstanceOf(
			ApiError
		);
	});
});
