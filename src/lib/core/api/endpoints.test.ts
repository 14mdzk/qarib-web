/**
 * Unit tests for the endpoint registry.
 *
 * Verifies path builder output and exercises the type-level smoke (compile
 * time). No HTTP calls are made here.
 *
 * Conformance: rule .claude/rules/testing.md (unit-test pure logic).
 */
import { describe, it, expect } from 'vitest';
import {
	Endpoints,
	defineEndpoint,
	type ArgOf,
	type BodyOf,
	type ResponseOf
} from './endpoints.js';

describe('Endpoints registry', () => {
	describe('auth.session', () => {
		it('path builder returns the correct BFF path', () => {
			const path = Endpoints['auth.session'].path(undefined as void);
			expect(path).toBe('/api/upstream/users/me');
		});

		it('has GET method', () => {
			expect(Endpoints['auth.session'].method).toBe('GET');
		});
	});

	describe('places.list', () => {
		it('builds a list path with location and radius filters', () => {
			const path = Endpoints['places.list'].path({
				limit: 20,
				search: 'al falah',
				is_active: true,
				near_lat: -6.732,
				near_lng: 108.5523,
				radius_km: 25
			});

			expect(path).toBe(
				'/api/upstream/places?limit=20&search=al%20falah&is_active=true&near_lat=-6.732&near_lng=108.5523&radius_km=25'
			);
		});
	});

	describe('events.nearby', () => {
		it('builds a nearby path with radius, date range, and subject filters', () => {
			const path = Endpoints['events.nearby'].path({
				lat: -6.732,
				lng: 108.5523,
				radius_km: 100,
				date_from: '2026-06-08T00:00:00+07:00',
				date_to: '2026-06-08T23:59:59+07:00',
				subject_id: 'subject-tafsir',
				limit: 10,
				expand: 'place'
			});

			expect(path).toBe(
				'/api/upstream/events/nearby?lat=-6.732&lng=108.5523&radius_km=100&subject_id=subject-tafsir&date_from=2026-06-08T00%3A00%3A00%2B07%3A00&date_to=2026-06-08T23%3A59%3A59%2B07%3A00&limit=10&expand=place'
			);
		});
	});

	describe('subject.list', () => {
		it('builds a list path with active and search filters', () => {
			const path = Endpoints['subject.list'].path({
				limit: 100,
				search: 'tafsir',
				is_active: true
			});

			expect(path).toBe('/api/upstream/subjects?limit=100&search=tafsir&is_active=true');
		});
	});
});

describe('defineEndpoint', () => {
	it('returns the definition unchanged at runtime', () => {
		const def = defineEndpoint<{ id: string }, void, { name: string }>({
			method: 'GET',
			path: ({ id }) => `/items/${id}`
		});

		expect(def.method).toBe('GET');
		expect(def.path({ id: 'abc' })).toBe('/items/abc');
	});

	it('does not expose _phantom at runtime', () => {
		const def = defineEndpoint({ method: 'GET', path: () => '/test' });
		// _phantom is intentionally not present at runtime
		expect('_phantom' in def).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Type-level smoke tests
// ---------------------------------------------------------------------------
// These imports confirm the conditional type helpers compile correctly.
// If any of these assignments fails to type-check, the build gate catches it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AuthSessionArgs = ArgOf<'auth.session'>; // void
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AuthSessionBody = BodyOf<'auth.session'>; // void
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AuthSessionResponse = ResponseOf<'auth.session'>; // SessionData shape
