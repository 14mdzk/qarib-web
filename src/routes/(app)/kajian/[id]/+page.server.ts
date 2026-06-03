/**
 * Server-only load for /kajian/[id] — event detail page.
 *
 * The route param `id` is the event SERIES UUID (not a slug). Fetches:
 *   - The series header (title, description, place, asatidz) via
 *     `events.seriesById` — keyed by UUID not slug.
 *   - Upcoming occurrences for the schedule strip via `events.list`
 *     filtered by `event_id` (the series UUID), starting from today.
 *
 * Both results are returned as `initialData` to seed svelte-query on the
 * client, avoiding a waterfall on first paint (same pattern as /peta).
 *
 * A 404 from the series fetch is surfaced as a SvelteKit error(404) so
 * the router renders the error page rather than an empty detail shell.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (all upstream calls via api())
 *   - rule .claude/rules/architecture.md   (+page.server.ts in the route folder)
 */
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { api } from '$core/api';
import { ApiError } from '$core/api';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const { id } = params;
	const requestId = locals.requestId;
	const today = new Date().toISOString().slice(0, 10);

	// Fetch the series header — 404 → surface as SvelteKit 404.
	let seriesInitialData;
	try {
		seriesInitialData = await api('events.seriesById', { id, expand: 'place,asatidz' }, undefined, {
			fetch,
			baseUrl: '',
			requestId
		});
		if (!seriesInitialData) {
			error(404, { message: 'Kajian tidak ditemukan', code: 'NOT_FOUND' });
		}
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) {
			error(404, { message: 'Kajian tidak ditemukan', code: 'NOT_FOUND' });
		}
		throw err;
	}

	// Fetch upcoming occurrences for the schedule strip. On failure, return
	// empty so the strip renders gracefully; the client will re-fetch.
	let occurrencesInitialData = null;
	try {
		occurrencesInitialData = await api(
			'events.list',
			{
				event_id: id,
				date_from: today,
				expand: 'place,asatidz',
				limit: 20
			},
			undefined,
			{ fetch, baseUrl: '', requestId }
		);
	} catch {
		// Non-fatal — schedule strip renders empty; client re-fetches.
	}

	return { seriesInitialData, occurrencesInitialData };
};
