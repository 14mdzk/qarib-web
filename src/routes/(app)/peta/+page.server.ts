/**
 * Server-only load for the /peta page.
 *
 * Fetches the first page of nearby events using the default Cirebon center so
 * the page renders with data on the initial SSR pass. The component drives
 * client-side re-fetches when the GPS location refines or the selected date
 * changes.
 *
 * Using +page.server.ts (not +page.ts) avoids the filterSerializedResponseHeaders
 * restriction that applies to universal loads using internal event.fetch calls —
 * server loads can freely read BFF response headers.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (all upstream calls via api() / service)
 *   - rule .claude/rules/architecture.md   (server load in +page.server.ts)
 */
import type { PageServerLoad } from './$types';
import { api } from '$core/api';
import { DEFAULT_CENTER } from '$core/location/index.svelte.js';
import { DEFAULT_RADIUS_KM } from '$domains/events/store.svelte.js';
import { toDateRange } from '$lib/shared/utils/date.js';

export const load: PageServerLoad = async ({ fetch }) => {
	const today = new Date().toISOString().slice(0, 10);
	const { date_from, date_to } = toDateRange(today);

	try {
		const initialData = await api(
			'events.nearby',
			{
				lat: DEFAULT_CENTER.lat,
				lng: DEFAULT_CENTER.lng,
				radius_km: DEFAULT_RADIUS_KM,
				date_from,
				date_to,
				expand: 'place',
				limit: 10
			},
			undefined,
			{
				fetch,
				// '' = relative same-origin path; SvelteKit's event.fetch resolves
				// /api/upstream/... against the request origin in server context.
				baseUrl: ''
			}
		);
		return { initialData };
	} catch {
		// On load error, the component renders empty and drives a client-side re-fetch.
		return { initialData: null };
	}
};
