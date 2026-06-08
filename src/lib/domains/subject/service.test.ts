/**
 * Tests for the subject service layer.
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
import { fetchSubjectById, fetchSubjectList } from './service.js';

function baseOpts() {
	return { fetch: globalThis.fetch, baseUrl: 'http://localhost' } as const;
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeSubject(overrides: Record<string, unknown> = {}) {
	return {
		id: 'subject-uuid-001',
		slug: 'mutiara-nasihat',
		name: { id: 'Mutiara Nasihat' },
		description: {
			id: 'Kajian-kajian yang menyajikan nasihat, adab, dan kisah teladan dari ulama klasik.'
		},
		is_active: true,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		...overrides
	};
}

// ---------------------------------------------------------------------------
// fetchSubjectList
// ---------------------------------------------------------------------------

describe('fetchSubjectList', () => {
	it('returns paginated subjects and forwards list filters', async () => {
		server.use(
			http.get('http://localhost/api/upstream/subjects', ({ request }) => {
				const params = new URL(request.url).searchParams;
				expect(params.get('limit')).toBe('100');
				expect(params.get('is_active')).toBe('true');
				return HttpResponse.json({
					success: true,
					data: [makeSubject({ id: 'subject-tafsir', name: { id: 'Tafsir' } })],
					pagination: { has_more: false, has_prev: false, total: 1 }
				});
			})
		);

		const result = await fetchSubjectList({ limit: 100, is_active: true }, baseOpts());

		expect(result.data).toHaveLength(1);
		expect(result.data[0]?.id).toBe('subject-tafsir');
		expect(result.pagination.total).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// fetchSubjectById
// ---------------------------------------------------------------------------

describe('fetchSubjectById', () => {
	it('returns the subject when found', async () => {
		server.use(
			http.get('http://localhost/api/upstream/subjects/subject-uuid-001', () =>
				HttpResponse.json({ success: true, data: makeSubject() })
			)
		);

		const result = await fetchSubjectById({ id: 'subject-uuid-001' }, baseOpts());

		expect(result?.id).toBe('subject-uuid-001');
		expect(result?.slug).toBe('mutiara-nasihat');
	});

	it('returns the correct name L10n string', async () => {
		server.use(
			http.get('http://localhost/api/upstream/subjects/subject-uuid-001', () =>
				HttpResponse.json({ success: true, data: makeSubject() })
			)
		);

		const result = await fetchSubjectById({ id: 'subject-uuid-001' }, baseOpts());

		expect(result?.name).toEqual({ id: 'Mutiara Nasihat' });
	});

	it('returns the description field when present', async () => {
		server.use(
			http.get('http://localhost/api/upstream/subjects/subject-uuid-001', () =>
				HttpResponse.json({ success: true, data: makeSubject() })
			)
		);

		const result = await fetchSubjectById({ id: 'subject-uuid-001' }, baseOpts());

		expect(result?.description).toEqual({
			id: 'Kajian-kajian yang menyajikan nasihat, adab, dan kisah teladan dari ulama klasik.'
		});
	});

	it('returns null description when the field is null', async () => {
		server.use(
			http.get('http://localhost/api/upstream/subjects/subject-uuid-no-desc', () =>
				HttpResponse.json({
					success: true,
					data: makeSubject({ id: 'subject-uuid-no-desc', description: null })
				})
			)
		);

		const result = await fetchSubjectById({ id: 'subject-uuid-no-desc' }, baseOpts());

		expect(result?.description).toBeNull();
	});

	it('throws ApiError on 404', async () => {
		server.use(
			http.get(
				'http://localhost/api/upstream/subjects/not-found-uuid',
				() => new HttpResponse(null, { status: 404, statusText: 'Not Found' })
			)
		);

		await expect(fetchSubjectById({ id: 'not-found-uuid' }, baseOpts())).rejects.toSatisfy(
			(e: unknown) => e instanceof ApiError && e.status === 404
		);
	});

	it('throws ApiError on 500', async () => {
		server.use(
			http.get(
				'http://localhost/api/upstream/subjects/server-error-uuid',
				() => new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })
			)
		);

		await expect(fetchSubjectById({ id: 'server-error-uuid' }, baseOpts())).rejects.toBeInstanceOf(
			ApiError
		);
	});
});
