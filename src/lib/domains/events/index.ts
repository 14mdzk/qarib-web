/**
 * Events domain — public barrel.
 *
 * Routes and components import from this index, not from deep paths.
 *
 * Conformance: rule .claude/rules/architecture.md (barrel in domains/<name>/index.ts)
 */
export {
	EventStatus,
	statusKey,
	isUpcoming,
	parseNearbyEvents,
	NearbyEventSchema
} from './schema.js';

export type {
	EventRecurringResponse,
	EventSeriesResponse,
	NearbyEvent,
	ExpandedPlace,
	EventStatusValue
} from './schema.js';

export {
	fetchNearbyEvents,
	fetchEventList,
	fetchEvent,
	fetchEventSeries,
	fetchSeriesUpcoming,
	fetchSeriesRecurrings
} from './service.js';

export type { NearbyArgs, ListArgs, SeriesPaginatedArgs } from './service.js';

export {
	eventKeys,
	buildNextPageArgs,
	buildNearbyQueryOptions,
	nearbyNextPageParam,
	defineNearbyQuery,
	defineNearbyInfiniteQuery,
	defineEventListQuery,
	defineEventQuery,
	defineEventSeriesQuery,
	defineSeriesUpcomingQuery,
	defineSeriesRecurringsQuery
} from './queries.js';

export { deriveTier, tierToTokenColor } from './pin-tier.js';
export type { PinTier } from './pin-tier.js';

export { createEventsView, getEventsView, EventsViewService } from './store.svelte.js';
