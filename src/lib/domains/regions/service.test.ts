import { afterEach, describe, expect, it } from 'vitest';
import { server } from '../../../../tests/msw.js';
import { http, HttpResponse } from 'msw';
import { accumulateRegions, fetchProvinces, fetchCities, fetchRegionById } from './service.js';
import type { RegionResponse } from './schema.js';

function baseOpts() {
	return { fetch: globalThis.fetch, baseUrl: 'http://localhost' } as const;
}

function makeRegion(overrides?: Partial<RegionResponse>): RegionResponse {
	return {
		id: '32',
		name: 'Jawa Barat',
		location_path: ['32'],
		location_tz: 420,
		...overrides
	};
}

function paginated(data: RegionResponse[], hasMore = false, nextCursor?: string) {
	return {
		success: true,
		data,
		pagination: { has_more: hasMore, next_cursor: nextCursor ?? null }
	};
}

describe('fetchProvinces', () => {
	afterEach(() => server.resetHandlers());

	it('fetches provinces from the API', async () => {
		server.use(
			http.get('http://localhost/api/upstream/regions', () =>
				HttpResponse.json(
					paginated([
						makeRegion({ id: '32', name: 'Jawa Barat', location_path: ['32'] }),
						makeRegion({ id: '3273', name: 'Kota Bandung', location_path: ['32', '3273'] })
					])
				)
			)
		);
		const provinces = await fetchProvinces(baseOpts());
		expect(provinces).toHaveLength(2);
		expect(provinces[0].name).toBe('Jawa Barat');
		expect(provinces[1].name).toBe('Kota Bandung');
	});
});

describe('fetchCities', () => {
	afterEach(() => server.resetHandlers());

	it('fetches cities with parent filter', async () => {
		server.use(
			http.get('http://localhost/api/upstream/regions', ({ request }) => {
				const url = new URL(request.url);
				expect(url.searchParams.get('parent')).toBe('32');
				expect(url.searchParams.get('limit')).toBe('100');
				return HttpResponse.json(
					paginated([
						makeRegion({ id: '3273', name: 'Kota Bandung', location_path: ['32', '3273'] })
					])
				);
			})
		);
		const cities = await fetchCities('32', baseOpts());
		expect(cities).toHaveLength(1);
		expect(cities[0].name).toBe('Kota Bandung');
	});
});

describe('accumulateRegions', () => {
	afterEach(() => server.resetHandlers());

	it('follows next_cursor across multiple pages', async () => {
		let callCount = 0;
		server.use(
			http.get('http://localhost/api/upstream/regions', ({ request }) => {
				callCount++;
				const url = new URL(request.url);
				const cursor = url.searchParams.get('cursor');
				const limit = url.searchParams.get('limit');
				expect(limit).toBe('100');

				if (!cursor) {
					return HttpResponse.json(
						paginated(
							[makeRegion({ id: '32', name: 'Jawa Barat', location_path: ['32'] })],
							true,
							'cursor-page2'
						)
					);
				}
				expect(cursor).toBe('cursor-page2');
				return HttpResponse.json(
					paginated([makeRegion({ id: '33', name: 'Jawa Tengah', location_path: ['33'] })])
				);
			})
		);

		const all = await accumulateRegions({}, baseOpts());
		expect(callCount).toBe(2);
		expect(all).toHaveLength(2);
		expect(all[0].name).toBe('Jawa Barat');
		expect(all[1].name).toBe('Jawa Tengah');
	});

	it('returns empty array when API errors', async () => {
		server.use(
			http.get(
				'http://localhost/api/upstream/regions',
				() => new HttpResponse(null, { status: 500 })
			)
		);
		await expect(accumulateRegions({}, baseOpts())).rejects.toThrow();
	});
});

describe('fetchRegionById', () => {
	afterEach(() => server.resetHandlers());

	it('fetches a single region by string ID', async () => {
		server.use(
			http.get('http://localhost/api/upstream/regions/:id', ({ params }) => {
				expect(params.id).toBe('3273');
				return HttpResponse.json({
					success: true,
					data: makeRegion({ id: '3273', name: 'Kota Bandung', location_path: ['32', '3273'] })
				});
			})
		);
		const region = await fetchRegionById('3273', baseOpts());
		expect(region).toBeDefined();
		expect(region!.name).toBe('Kota Bandung');
	});
});
