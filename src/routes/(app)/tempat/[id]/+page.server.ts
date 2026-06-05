/**
 * Server-only load for /masjid/[id] — place (masjid) detail page.
 *
 * The route param `id` is the place UUID. Fetches:
 *   - The place via `places.get`.
 *   - The place's recurring kajian via `events.list` filtered by `place_id`,
 *     expanding asatidz for the event cards.
 *
 * Both results are returned as `initialData` to seed svelte-query on the
 * client, avoiding a waterfall on first paint (same pattern as /kajian).
 *
 * A 404 from the place fetch is surfaced as a SvelteKit error(404) so
 * the router renders the error page rather than an empty detail shell.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (all upstream calls via api())
 *   - rule .claude/rules/architecture.md   (+page.server.ts in the route folder)
 */
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { api, ApiError } from '$core/api';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const { id } = params;
	const requestId = locals.requestId;

	// Fetch the place — 404 → surface as SvelteKit 404.
	let placeInitialData;
	try {
		placeInitialData = await api('places.get', { id, expand: '' }, undefined, {
			fetch,
			baseUrl: '',
			requestId
		});
		if (!placeInitialData) {
			error(404, { message: 'Masjid tidak ditemukan', code: 'NOT_FOUND' });
		}
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) {
			error(404, { message: 'Masjid tidak ditemukan', code: 'NOT_FOUND' });
		}
		throw err;
	}

	// Fetch the place's recurring kajian. On failure, return null so the
	// kajian section renders gracefully; the client will re-fetch.
	let kajianInitialData = null;
	try {
		kajianInitialData = await api(
			'events.listSeries',
			{
				place_id: id,
				expand: 'asatidz',
				limit: 20
			},
			undefined,
			{ fetch, baseUrl: '', requestId }
		);
	} catch {
		// Non-fatal — kajian section renders empty; client re-fetches.
	}

	return { placeInitialData, kajianInitialData, meta: { title: 'Tempat' } };
};
