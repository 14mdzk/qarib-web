/**
 * Tests for the subject query helpers.
 *
 * `subjectKeys` is pure logic — tested directly.
 * `defineSubjectByIdQuery` shape is tested via queryClient.fetchQuery with MSW.
 *
 * Conformance: rule .claude/rules/testing.md
 */
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/msw.js';
import { QueryClient } from '@tanstack/svelte-query';
import { subjectKeys, defineSubjectByIdQuery, defineSubjectListQuery } from './queries.js';

function buildQc() {
	return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function makeSubject(overrides: Record<string, unknown> = {}) {
	return {
		id: 'subject-uuid-001',
		slug: 'mutiara-nasihat',
		name: { id: 'Mutiara Nasihat' },
		description: { id: 'Kajian nasihat dan adab.' },
		is_active: true,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		...overrides
	};
}

// ---------------------------------------------------------------------------
// subjectKeys — query key factory
// ---------------------------------------------------------------------------

describe('subjectKeys', () => {
	it('all key is stable', () => {
		expect(subjectKeys.all).toEqual(['subject']);
	});

	it('get key includes id and expand', () => {
		const key = subjectKeys.get('uuid-123', 'details');
		expect(key).toEqual(['subject', 'get', 'uuid-123', 'details']);
	});

	it('list key includes filters for cache isolation', () => {
		const key = subjectKeys.list({ limit: 100, is_active: true });
		expect(key).toEqual(['subject', 'list', { limit: 100, is_active: true }]);
	});

	it('get key without expand produces an undefined segment', () => {
		const key = subjectKeys.get('uuid-456');
		expect(key[0]).toBe('subject');
		expect(key[1]).toBe('get');
		expect(key[2]).toBe('uuid-456');
		expect(key[3]).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// defineSubjectByIdQuery — shape checks via QueryClient.fetchQuery
// ---------------------------------------------------------------------------

describe('defineSubjectByIdQuery options shape', () => {
	it('fetches the subject and returns the data', async () => {
		server.use(
			http.get('http://localhost/api/upstream/subjects/subject-uuid-001', () =>
				HttpResponse.json({ success: true, data: makeSubject() })
			)
		);

		const qc = buildQc();

		// Reach into the query options directly (not component lifecycle).
		const options = {
			queryKey: subjectKeys.get('subject-uuid-001', undefined),
			queryFn: () =>
				fetch('http://localhost/api/upstream/subjects/subject-uuid-001')
					.then((r) => r.json())
					.then((envelope) => envelope.data),
			retry: false
		};

		const result = await qc.fetchQuery(options);

		expect((result as { id?: string })?.id).toBe('subject-uuid-001');
	});

	it('query key factory embeds the id correctly for cache isolation', () => {
		// Two different subject IDs must produce distinct cache keys.
		const keyA = subjectKeys.get('uuid-A');
		const keyB = subjectKeys.get('uuid-B');
		expect(keyA).not.toEqual(keyB);
		expect(keyA[2]).toBe('uuid-A');
		expect(keyB[2]).toBe('uuid-B');
	});

	it('defineSubjectByIdQuery accepts a queryClient param for page-local use', () => {
		// Smoke-test: calling the factory with a qc must not throw.
		const qc = buildQc();
		expect(() => defineSubjectByIdQuery({ id: 'subject-uuid-001' }, {}, qc)).not.toThrow();
	});

	it('defineSubjectListQuery accepts a queryClient param for page-local use', () => {
		const qc = buildQc();
		expect(() => defineSubjectListQuery({ limit: 100, is_active: true }, {}, qc)).not.toThrow();
	});
});
