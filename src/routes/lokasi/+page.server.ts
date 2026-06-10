/**
 * /lokasi — location onboarding route.
 *
 * Ungated public route.  Server load validates the `returnTo` query param
 * and exposes only the completion-marker presence (never the location
 * preference itself).  The form action sets the `qarib_location_complete`
 * cookie and accepts only a normalized returnTo — no coordinates or region
 * fields.
 *
 * Conformance:
 *   - docs/plans/location-onboarding-settings.md § "/lokasi route contract"
 *   - rule .claude/rules/auth-and-session.md (v1 public, no account)
 */
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { normaliseReturnTo } from '$lib/core/location/return-to.js';

const COMPLETION_COOKIE = 'qarib_location_complete';
const COMPLETION_VALUE = 'v1';
const ONE_YEAR = 365 * 24 * 60 * 60;

export const load: PageServerLoad = async ({ url, cookies }) => {
	const raw = url.searchParams.get('returnTo');
	const safeReturn = normaliseReturnTo(raw);
	const markerPresent = cookies.get(COMPLETION_COOKIE) === COMPLETION_VALUE;

	// The server never reads or exposes the client location preference.
	return { returnTo: safeReturn, markerPresent };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const raw = data.get('returnTo');
		const safeReturn = normaliseReturnTo(typeof raw === 'string' ? raw : null);

		const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

		cookies.set(COMPLETION_COOKIE, COMPLETION_VALUE, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: ONE_YEAR,
			secure: !isLocalhost && process.env.NODE_ENV === 'production'
		});

		redirect(303, safeReturn);
	}
};
