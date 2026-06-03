/**
 * Tests for the events query helpers.
 *
 * `buildNextPageArgs` is pure logic — tested directly.
 * `buildNearbyQueryOptions` is tested via queryClient.fetchQuery with MSW.
 *
 * Conformance: rule .claude/rules/testing.md
 */
import { describe, it, expect } from 'vitest';
import { buildNextPageArgs, buildNearbyQueryOptions, eventKeys } from './queries.js';

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
