/**
 * Safe returnTo normalisation for /lokasi onboarding.
 *
 * Shared by the server gate, onboarding server action, and browser
 * navigation code so unsafe targets cannot escape the same origin or
 * redirect to /lokasi itself.
 *
 * Conformance:
 *   - docs/plans/location-onboarding-settings.md § "/lokasi route contract"
 */
import { browser } from '$app/environment';

/** Default target when the candidate is absent, malformed, or unsafe. */
export const DEFAULT_RETURN_TO = '/peta';

/**
 * Normalise a returnTo candidate.
 *
 * Returns a safe `pathname + search` string (never an absolute URL), or
 * `DEFAULT_RETURN_TO` when the candidate cannot be validated.
 */
export function normaliseReturnTo(candidate: string | null | undefined): string {
	if (!candidate) return DEFAULT_RETURN_TO;

	let currentOrigin: string;
	if (browser) {
		currentOrigin = window.location.origin;
	} else {
		// Server-side — we only validate shape, not absolute origin match.
		// The server gate does a redirect to the same deployment so the
		// effective origin is always ours.
		currentOrigin = 'https://qarib.app';
	}

	// Reject strings that don't start with a single /, and those containing
	// credentials (@) which signal userinfo-hosting confusion.
	if (!/^\/[^/]/.test(candidate)) return DEFAULT_RETURN_TO;
	if (candidate.includes('@')) return DEFAULT_RETURN_TO;

	let url: URL;
	try {
		url = new URL(candidate, currentOrigin);
	} catch {
		return DEFAULT_RETURN_TO;
	}

	// Cross-origin rejection (browser path only)
	if (url.origin !== currentOrigin) return DEFAULT_RETURN_TO;

	// No fragments, no credentials
	if (url.hash) return DEFAULT_RETURN_TO;
	if (url.username || url.password) return DEFAULT_RETURN_TO;

	// Do not loop back to onboarding
	if (url.pathname === '/lokasi') return DEFAULT_RETURN_TO;

	// Return pathname + search only — never a full absolute URL
	if (url.search) return url.pathname + url.search;
	return url.pathname;
}
