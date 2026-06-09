/**
 * Mandatory SSR completion gate for `(app)` routes.
 *
 * Every request under `src/routes/(app)/` must carry the
 * `qarib_location_complete=v1` cookie.  Missing or malformed cookie →
 * 303 redirect to `/lokasi?returnTo=<validated pathname+search>`.
 *
 * The gate only checks for the presence of the completion marker.  It
 * never receives, stores, or forwards coordinates, province IDs, or city
 * names.  The cookie value indicates schema completion only.
 *
 * Routes `/` and `/lokasi` live outside `(app)` and are never gated.
 *
 * Conformance:
 *   - docs/plans/location-onboarding-settings.md § "Route gate"
 *   - rule .claude/rules/auth-and-session.md (v1 public, no account)
 */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { normaliseReturnTo } from '$lib/core/location/return-to.js';

const COMPLETION_COOKIE = 'qarib_location_complete';
const COMPLETION_VALUE = 'v1';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const marker = cookies.get(COMPLETION_COOKIE);

	if (marker !== COMPLETION_VALUE) {
		const safeReturn = normaliseReturnTo(url.pathname + url.search);
		redirect(303, `/lokasi?returnTo=${encodeURIComponent(safeReturn)}`);
	}

	// Marker present — the layout proceeds.  Client reconciliation
	// validates that the local-storage preference is intact before
	// enabling location-dependent queries.
	return { locationComplete: true };
};
