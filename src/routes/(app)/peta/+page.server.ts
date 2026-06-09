/**
 * Server-only load for /peta.
 *
 * Event discovery is date-bounded by the visitor's browser-local calendar.
 * SSR cannot know that timezone, so it must not seed a host-timezone-derived
 * nearby request. Client hydration initializes the local day and starts the
 * query.
 */
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ initialData: null });
