/**
 * Tests for the asatidz service layer.
 *
 * Uses MSW (via tests/msw.ts) to intercept HTTP.
 * All calls go through `api()` — no hand-rolled fetch.
 *
 * Conformance: rule .claude/rules/testing.md (mock HTTP with MSW).
 */
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/msw.js';
import { ApiError } from '$core/api';
import { fetchAsatidzById } from './service.js';

function baseOpts() {
	return { fetch: globalThis.fetch, baseUrl: 'http://localhost' } as const;
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeAsatidz(overrides: Record<string, unknown> = {}) {
	return {
		id: 'asatidz-uuid-001',
		slug: 'subhan-bawazier',
		name: { id: 'Subhan Bawazier' },
		alias_name: { id: 'Ustadz Subhan Bawazier' },
		gender: 1,
		description: { id: 'Lulusan LIPIA Jakarta. Aktif mengajar di Cirebon.' },
		is_active: true,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		...overrides
	};
}

// ---------------------------------------------------------------------------
// fetchAsatidzById
// ---------------------------------------------------------------------------

describe('fetchAsatidzById', () => {
	it('returns the asatidz when found', async () => {
		server.use(
			http.get('http://localhost/api/upstream/asatidzs/asatidz-uuid-001', () =>
				HttpResponse.json({ success: true, data: makeAsatidz() })
			)
		);

		const result = await fetchAsatidzById({ id: 'asatidz-uuid-001' }, baseOpts());

		expect(result?.id).toBe('asatidz-uuid-001');
		expect(result?.slug).toBe('subhan-bawazier');
	});

	it('returns the correct name L10n string', async () => {
		server.use(
			http.get('http://localhost/api/upstream/asatidzs/asatidz-uuid-001', () =>
				HttpResponse.json({ success: true, data: makeAsatidz() })
			)
		);

		const result = await fetchAsatidzById({ id: 'asatidz-uuid-001' }, baseOpts());

		expect(result?.name).toEqual({ id: 'Subhan Bawazier' });
	});

	it('returns the description field when present', async () => {
		server.use(
			http.get('http://localhost/api/upstream/asatidzs/asatidz-uuid-001', () =>
				HttpResponse.json({ success: true, data: makeAsatidz() })
			)
		);

		const result = await fetchAsatidzById({ id: 'asatidz-uuid-001' }, baseOpts());

		expect(result?.description).toEqual({
			id: 'Lulusan LIPIA Jakarta. Aktif mengajar di Cirebon.'
		});
	});

	it('returns null description when the field is null', async () => {
		server.use(
			http.get('http://localhost/api/upstream/asatidzs/asatidz-uuid-no-bio', () =>
				HttpResponse.json({
					success: true,
					data: makeAsatidz({ id: 'asatidz-uuid-no-bio', description: null })
				})
			)
		);

		const result = await fetchAsatidzById({ id: 'asatidz-uuid-no-bio' }, baseOpts());

		expect(result?.description).toBeNull();
	});

	it('throws ApiError on 404', async () => {
		server.use(
			http.get(
				'http://localhost/api/upstream/asatidzs/not-found-uuid',
				() => new HttpResponse(null, { status: 404, statusText: 'Not Found' })
			)
		);

		await expect(fetchAsatidzById({ id: 'not-found-uuid' }, baseOpts())).rejects.toSatisfy(
			(e: unknown) => e instanceof ApiError && e.status === 404
		);
	});

	it('throws ApiError on 500', async () => {
		server.use(
			http.get(
				'http://localhost/api/upstream/asatidzs/server-error-uuid',
				() => new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })
			)
		);

		await expect(fetchAsatidzById({ id: 'server-error-uuid' }, baseOpts())).rejects.toBeInstanceOf(
			ApiError
		);
	});
});
