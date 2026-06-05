/**
 * Server-only load for /tema/[id] — subject (tema kajian) detail page.
 *
 * The route param `id` is the subject UUID. Fetches:
 *   - The subject via `subject.get`.
 *   - The subject's kajian via `events.list` filtered by `subject_id`,
 *     expanding place and asatidz for stat derivation and event cards.
 *
 * Both results are returned as `initialData` to seed svelte-query on the
 * client, avoiding a waterfall on first paint (same pattern as /ustadz).
 *
 * A 404 from the subject fetch is surfaced as a SvelteKit error(404) so
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

	// Fetch the subject — 404 → surface as SvelteKit 404.
	let subjectInitialData;
	try {
		subjectInitialData = await api('subject.get', { id, expand: '' }, undefined, {
			fetch,
			baseUrl: '',
			requestId
		});
		if (!subjectInitialData) {
			error(404, { message: 'Tema tidak ditemukan', code: 'NOT_FOUND' });
		}
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) {
			error(404, { message: 'Tema tidak ditemukan', code: 'NOT_FOUND' });
		}
		throw err;
	}

	// Fetch the subject's kajian. On failure, return null so the
	// kajian section renders gracefully; the client will re-fetch.
	// expand=place,asatidz so stat counts and ustadz carousel can be derived.
	let kajianInitialData = null;
	try {
		kajianInitialData = await api(
			'events.listSeries',
			{
				subject_id: id,
				expand: 'place,asatidz',
				limit: 30
			},
			undefined,
			{ fetch, baseUrl: '', requestId }
		);
	} catch {
		// Non-fatal — kajian section renders empty; client re-fetches.
	}

	return { subjectInitialData, kajianInitialData };
};
