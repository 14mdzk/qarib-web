/**
 * Server-only load for /ustadz/[id] — asatidz (ustadz) detail page.
 *
 * The route param `id` is the asatidz UUID. Fetches:
 *   - The asatidz via `asatidz.get`.
 *   - The asatidz's kajian via `events.list` filtered by `asatidz_id`,
 *     expanding place for the event cards.
 *
 * Both results are returned as `initialData` to seed svelte-query on the
 * client, avoiding a waterfall on first paint (same pattern as /masjid).
 *
 * A 404 from the asatidz fetch is surfaced as a SvelteKit error(404) so
 * the router renders the error page rather than an empty detail shell.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (all upstream calls via api())
 *   - rule .claude/rules/architecture.md   (+page.server.ts in the route folder)
 */
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { api, ApiError } from '$core/api';
import type { AsatidzResponse } from '$lib/domains/asatidz/schema';
import { l10n } from '$shared/utils/l10n';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const { id } = params;
	const requestId = locals.requestId;

	// Fetch the asatidz — 404 → surface as SvelteKit 404.
	let asatidzInitialData: AsatidzResponse;
	try {
		asatidzInitialData = await api('asatidz.get', { id, expand: '' }, undefined, {
			fetch,
			baseUrl: '',
			requestId
		});
		if (!asatidzInitialData) {
			error(404, { message: 'Ustadz tidak ditemukan', code: 'NOT_FOUND' });
		}
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) {
			error(404, { message: 'Ustadz tidak ditemukan', code: 'NOT_FOUND' });
		}
		throw err;
	}

	// Fetch the asatidz's kajian. On failure, return null so the
	// kajian section renders gracefully; the client will re-fetch.
	let kajianInitialData = null;
	try {
		kajianInitialData = await api(
			'events.listSeries',
			{
				asatidz_id: id,
				expand: 'place',
				limit: 3
			},
			undefined,
			{ fetch, baseUrl: '', requestId }
		);
	} catch {
		// Non-fatal — kajian section renders empty; client re-fetches.
	}

	return {
		asatidzInitialData,
		kajianInitialData,
		meta: {
			title: l10n(asatidzInitialData.name)
		}
	};
};
