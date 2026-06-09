/**
 * Timezone contract tests for /kajian/[id].
 *
 * Verifies:
 *  - SSR load does not derive a calendar day from server host timezone.
 *  - Browser-local date init produces explicit-offset RFC3339 boundaries.
 *  - Occurrence query stays disabled until browser date initialisation.
 *  - An instant near midnight yields the browser-visible day, not UTC day.
 *
 * Conformance:
 *   - docs/plans/location-onboarding-settings.md § "Timezone authority"
 *   - rule .claude/rules/testing.md (Vitest, MSW for HTTP)
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { load } from './+page.server.js';
import { toDateRange } from '$lib/shared/utils/date.js';

const ORIGINAL_TZ = process.env.TZ;

beforeEach(() => {
	vi.stubGlobal('navigator', { geolocation: undefined, share: undefined });
});

afterEach(() => {
	process.env.TZ = ORIGINAL_TZ;
	vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Server load — timezone independence
// ---------------------------------------------------------------------------

describe('kajian detail server load', () => {
	it('does not derive a calendar day from server host timezone', async () => {
		const fetch = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						id: 'series-uuid-001',
						name: { id: 'Kajian Tauhid' },
						description: null,
						date_rule: 'FREQ=WEEKLY',
						place_id: null,
						asatidz_id: null
					}
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			)
		);

		const result = (await load({
			params: { id: 'series-uuid-001' },
			fetch,
			locals: { requestId: 'test-req-001' }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test calls load() with a partial mock of PageServerLoadEvent
		} as any)) as { seriesInitialData: unknown; occurrencesInitialData: unknown };

		// Series fetch must succeed.
		expect(result.seriesInitialData).toBeDefined();

		// Occurrence data must be null — SSR must not pre-seed with
		// server-host-derived today.
		expect(result.occurrencesInitialData).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Browser date helper — explicit-offset boundaries
// ---------------------------------------------------------------------------

describe('toDateRange for occurrence queries', () => {
	it('produces explicit-offset RFC3339 boundaries, not UTC Z', () => {
		process.env.TZ = 'Asia/Jakarta';
		const { date_from, date_to } = toDateRange('2026-05-15');

		expect(date_from).toBe('2026-05-15T00:00:00+07:00');
		expect(date_to).toBe('2026-05-15T23:59:59+07:00');
		expect(date_from).not.toMatch(/Z$/);
		expect(date_to).not.toMatch(/Z$/);
	});

	it('uses the browser-local day even when UTC is a different day', () => {
		// 2026-05-31T22:30:00Z = 2026-06-01 05:30 in Asia/Jakarta
		process.env.TZ = 'Asia/Jakarta';
		const instant = new Date('2026-05-31T22:30:00Z');
		const localDate = [
			instant.getFullYear(),
			String(instant.getMonth() + 1).padStart(2, '0'),
			String(instant.getDate()).padStart(2, '0')
		].join('-');

		// Browser-visible day is June 1, not May 31 (UTC).
		expect(localDate).toBe('2026-06-01');

		const { date_from, date_to } = toDateRange(localDate);
		expect(date_from).toBe('2026-06-01T00:00:00+07:00');
		expect(date_to).toBe('2026-06-01T23:59:59+07:00');
	});

	it('computes offset independently for DST transition days', () => {
		process.env.TZ = 'America/New_York';
		// March 8 2026: EST → EDT (UTC-5 → UTC-4)
		const { date_from, date_to } = toDateRange('2026-03-08');

		expect(date_from).toBe('2026-03-08T00:00:00-05:00');
		expect(date_to).toBe('2026-03-08T23:59:59-04:00');
		// Offsets must differ across the transition.
		expect(date_from).not.toBe(date_to);
	});
});

// ---------------------------------------------------------------------------
// Component behaviour — query disabled until init
// ---------------------------------------------------------------------------

describe('kajian detail component', () => {
	it('renders without occurrence query data when SSR returns null', () => {
		// Read the compiled source to confirm the pattern.
		// The occurrence query is disabled (enabled: dateFrom !== null)
		// and dateFrom starts null; the server returns null for
		// occurrencesInitialData, so no host-timezone data seeds the strip.
		const source = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

		// Browser-local date init must be present.
		expect(source).toContain('toLocalIsoDate(new Date())');

		// Occurrence query must be gated on dateFrom being non-null.
		expect(source).toContain('dateFrom !== null');

		// No raw `new Date().toISOString().slice(0, 10)` for calendar queries.
		// The only toISOString usages should be in non-calendar-query positions
		// (none expected in this component after PR1).
		const isoCalls = source.match(/\.toISOString\(\)/g);
		expect(isoCalls).toBeNull();
	});

	it('guards occurrence query with enabled: dateFrom !== null', () => {
		const source = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

		// Confirm the `enabled` option gates on browser date initialisation.
		expect(source).toMatch(/get enabled\(\)\s*\{[^}]*dateFrom\s*!==\s*null/);
		// Confirm `dateFrom` is derived from `toDateRange` (explicit offset).
		expect(source).toContain('toDateRange(browserDate)');
	});

	it('imports explicit-offset helpers for browser-local date construction', () => {
		const source = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

		expect(source).toContain('toDateRange');
		expect(source).toContain('toLocalIsoDate');
	});
});
