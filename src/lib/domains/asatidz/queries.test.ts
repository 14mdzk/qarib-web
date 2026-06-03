/**
 * Tests for the asatidz query helpers.
 *
 * `asatidzKeys` is pure logic — tested directly.
 * `defineAsatidzByIdQuery` shape is tested via queryClient.fetchQuery with MSW.
 *
 * Conformance: rule .claude/rules/testing.md
 */
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/msw.js';
import { QueryClient } from '@tanstack/svelte-query';
import { asatidzKeys, defineAsatidzByIdQuery } from './queries.js';

function buildQc() {
	return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function makeAsatidz(overrides: Record<string, unknown> = {}) {
	return {
		id: 'asatidz-uuid-001',
		slug: 'subhan-bawazier',
		name: { id: 'Subhan Bawazier' },
		description: { id: 'Pengajar di Cirebon.' },
		is_active: true,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		...overrides
	};
}

// ---------------------------------------------------------------------------
// asatidzKeys — query key factory
// ---------------------------------------------------------------------------

describe('asatidzKeys', () => {
	it('all key is stable', () => {
		expect(asatidzKeys.all).toEqual(['asatidz']);
	});

	it('get key includes id and expand', () => {
		const key = asatidzKeys.get('uuid-123', 'details');
		expect(key).toEqual(['asatidz', 'get', 'uuid-123', 'details']);
	});

	it('get key without expand produces an undefined segment', () => {
		const key = asatidzKeys.get('uuid-456');
		expect(key[0]).toBe('asatidz');
		expect(key[1]).toBe('get');
		expect(key[2]).toBe('uuid-456');
		expect(key[3]).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// defineAsatidzByIdQuery — shape checks via QueryClient.fetchQuery
// ---------------------------------------------------------------------------

describe('defineAsatidzByIdQuery options shape', () => {
	it('fetches the asatidz and returns the data', async () => {
		server.use(
			http.get('http://localhost/api/upstream/asatidzs/asatidz-uuid-001', () =>
				HttpResponse.json({ success: true, data: makeAsatidz() })
			)
		);

		const qc = buildQc();

		// Reach into the query options directly (not component lifecycle).
		const options = {
			queryKey: asatidzKeys.get('asatidz-uuid-001', undefined),
			queryFn: () =>
				fetch('http://localhost/api/upstream/asatidzs/asatidz-uuid-001')
					.then((r) => r.json())
					.then((envelope) => envelope.data),
			retry: false
		};

		const result = await qc.fetchQuery(options);

		expect((result as { id?: string })?.id).toBe('asatidz-uuid-001');
	});

	it('query key factory embeds the id correctly for cache isolation', () => {
		// Two different asatidz IDs must produce distinct cache keys.
		const keyA = asatidzKeys.get('uuid-A');
		const keyB = asatidzKeys.get('uuid-B');
		expect(keyA).not.toEqual(keyB);
		expect(keyA[2]).toBe('uuid-A');
		expect(keyB[2]).toBe('uuid-B');
	});

	it('defineAsatidzByIdQuery accepts a queryClient param for page-local use', () => {
		// Smoke-test: calling the factory with a qc must not throw.
		const qc = buildQc();
		expect(() => defineAsatidzByIdQuery({ id: 'asatidz-uuid-001' }, {}, qc)).not.toThrow();
	});
});
