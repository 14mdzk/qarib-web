/**
 * Events domain — svelte-query keys and query factories.
 *
 * Provides:
 *   - `eventKeys` — stable TanStack query key factory.
 *   - `buildNearbyQueryOptions` — pure options builder for nearby events
 *     (testable without component lifecycle).
 *   - `defineNearbyQuery` — reactive wrapper (requires Svelte context).
 *   - `defineNearbyInfiniteQuery` — cursor-paginated infinite query for the
 *     list UI (C3). Uses `createInfiniteQuery` with `getNextPageParam` wired
 *     to `pagination.next_cursor`. Accepts `initialData` for SSR seeding.
 *   - `buildNextPageArgs` — pure cursor-accumulation helper (kept for callers
 *     that drive pagination imperatively, e.g. server-side pre-fetch).
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (all upstream calls via api())
 *   - rule .claude/rules/architecture.md   (queries.ts in domains/events/)
 *   - rule .claude/rules/state-management.md (server data in svelte-query)
 */
import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query';
import { buildQueryOptions, defineQuery } from '$core/query';
import { api } from '$core/api';
import type { InfiniteData } from '@tanstack/svelte-query';
import type { QueryClient } from '@tanstack/svelte-query';
import type { Paginated, PaginationMeta } from '$core/api';
import type { EventRecurringResponse, EventSeriesResponse } from './schema.js';
import type {
	NearbyArgs,
	ListArgs,
	SeriesPaginatedArgs,
	SeriesByIdArgs,
	ListSeriesArgs
} from './service.js';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const eventKeys = {
	all: ['events'] as const,
	nearby: (args: NearbyArgs) => ['events', 'nearby', args] as const,
	list: (args: ListArgs) => ['events', 'list', args] as const,
	get: (id: number, expand?: string) => ['events', 'get', id, expand] as const,
	series: (slug: string, expand?: string) => ['events', 'series', slug, expand] as const,
	seriesById: (id: string, expand?: string) => ['events', 'seriesById', id, expand] as const,
	seriesUpcoming: (args: SeriesPaginatedArgs) => ['events', 'seriesUpcoming', args] as const,
	seriesRecurrings: (args: SeriesPaginatedArgs) => ['events', 'seriesRecurrings', args] as const,
	occurrencesByEvent: (args: ListArgs) => ['events', 'occurrencesByEvent', args] as const,
	listSeries: (args: ListSeriesArgs) => ['events', 'listSeries', args] as const,
	domainCalendar: (args: {
		domainType: string;
		domainId: string;
		dateFrom: string;
		dateTo: string;
	}) => ['events', 'domainCalendar', args] as const
} as const;

// ---------------------------------------------------------------------------
// Cursor accumulation helper (pure — testable without Svelte)
// ---------------------------------------------------------------------------

/**
 * Given a `PaginationMeta` from any list response, return the args needed to
 * fetch the next page, or `null` when there is no next page.
 *
 * Usage:
 * ```ts
 * const page1 = await fetchNearbyEvents({ lat, lng })
 * const nextArgs = buildNextPageArgs(page1.pagination, { lat, lng })
 * if (nextArgs) {
 *   const page2 = await fetchNearbyEvents(nextArgs)
 * }
 * ```
 */
export function buildNextPageArgs<T extends Record<string, unknown>>(
	pagination: PaginationMeta,
	currentArgs: T
): T | null {
	if (!pagination.has_more || !pagination.next_cursor) return null;
	return { ...currentArgs, cursor: pagination.next_cursor };
}

// ---------------------------------------------------------------------------
// Nearby query
// ---------------------------------------------------------------------------

/**
 * Pure options builder for a nearby-events query.
 * Testable via `queryClient.fetchQuery(buildNearbyQueryOptions(...))`.
 */
export function buildNearbyQueryOptions(
	args: NearbyArgs,
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string }
) {
	return buildQueryOptions('events.nearby', args, opts);
}

/**
 * Reactive nearby-events query (requires Svelte component context).
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { defineNearbyQuery } from '$domains/events'
 *   const nearby = defineNearbyQuery({ lat: -6.9, lng: 107.6 })
 * </script>
 * {#if $nearby.data}
 *   {#each $nearby.data.data as event}…{/each}
 * {/if}
 * ```
 */
export function defineNearbyQuery(
	args: NearbyArgs,
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string }
) {
	return defineQuery('events.nearby', args, opts);
}

// ---------------------------------------------------------------------------
// Infinite query — nearby cursor pagination
// ---------------------------------------------------------------------------

/**
 * Pure `getNextPageParam` implementation for the nearby infinite query.
 *
 * TanStack Query treats `undefined` (not `null`) as the sentinel for "no next
 * page" — returning `undefined` sets `hasNextPage = false` and prevents
 * `fetchNextPage` from looping on the last page. `null` would be treated as a
 * valid page param and keep `hasNextPage = true` indefinitely.
 *
 * Exported for unit testing without component lifecycle.
 */
export function nearbyNextPageParam(last: Paginated<EventRecurringResponse[]>): string | undefined {
	return last.pagination?.next_cursor ?? undefined;
}

/**
 * Cursor-paginated nearby events — for the `/peta` list UI.
 *
 * Wraps `createInfiniteQuery` so server data lives in svelte-query
 * (state-management.md rule). `getNextPageParam` extracts
 * `pagination.next_cursor` from each page response.
 *
 * Pass `initialData` to seed from an SSR server-load result, avoiding
 * a client waterfall on first paint.
 *
 * @param argsGetter  - Reactive accessor returning the base `NearbyArgs`
 *                      (without `cursor` — the query manages that internally).
 * @param initialData - Optional SSR seed; shape must match `InfiniteData`.
 */
export function defineNearbyInfiniteQuery(
	/**
	 * Reactive accessor that returns both the base NearbyArgs AND the optional
	 * SSR initialData seed. Using a single accessor ensures createInfiniteQuery
	 * tracks all reactive dependencies correctly without Svelte's
	 * `state_referenced_locally` warning.
	 */
	optionsGetter: () => {
		args: NearbyArgs;
		enabled?: boolean;
		initialData?: InfiniteData<Paginated<EventRecurringResponse[]>, string | null>;
	},
	/**
	 * Pass a QueryClient when QueryClientProvider is not yet in the layout context.
	 *
	 * @deprecated Remove this param once QueryClientProvider is wired in the root
	 * layout. Until then it avoids a missing-context throw. D/E/F pages must NOT
	 * cargo-cult the page-local client — they should use the shared provider instead.
	 */
	queryClient?: QueryClient
) {
	return createInfiniteQuery<
		Paginated<EventRecurringResponse[]>,
		Error,
		InfiniteData<Paginated<EventRecurringResponse[]>, string | null>,
		readonly ['events', 'nearby', NearbyArgs],
		string | null
	>(
		() => {
			const { args, enabled, initialData } = optionsGetter();
			return {
				queryKey: eventKeys.nearby(args),
				queryFn: ({ pageParam, signal }) =>
					api('events.nearby', { ...args, cursor: pageParam ?? undefined }, undefined, {
						signal,
						// '' = relative same-origin path; resolves to /api/upstream/... in both
						// browser and SvelteKit server contexts (server load passes event.fetch).
						baseUrl: ''
					}),
				initialPageParam: null,
				getNextPageParam: nearbyNextPageParam,
				enabled,
				// Mark SSR-seeded data as fresh for `staleTime` so TanStack does not
				// immediately background-refetch page 1 on every mount — which would
				// duplicate the SSR fetch and waste a round-trip.
				initialDataUpdatedAt: initialData ? Date.now() : undefined,
				initialData
			};
		},
		queryClient ? () => queryClient : undefined
	);
}

/**
 * Reactive event-list query (requires Svelte component context).
 */
export function defineEventListQuery(
	args: ListArgs,
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string }
) {
	return defineQuery('events.list', args, opts);
}

/**
 * Reactive single-event query (requires Svelte component context).
 */
export function defineEventQuery(
	id: number,
	expand?: string,
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string }
) {
	return defineQuery('events.get', { id, expand }, opts);
}

/**
 * Reactive event-series query (requires Svelte component context).
 */
export function defineEventSeriesQuery(
	slug: string,
	expand?: string,
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string }
) {
	return defineQuery('events.series', { slug, expand }, opts);
}

/**
 * Reactive series-upcoming query (requires Svelte component context).
 */
export function defineSeriesUpcomingQuery(
	args: SeriesPaginatedArgs,
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string }
) {
	return defineQuery('events.seriesUpcoming', args, opts);
}

/**
 * Reactive series-recurrings query (requires Svelte component context).
 */
export function defineSeriesRecurringsQuery(
	args: SeriesPaginatedArgs,
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string }
) {
	return defineQuery('events.seriesRecurrings', args, opts);
}

/**
 * Reactive event-series-by-UUID query (requires Svelte component context).
 *
 * Used by the `/kajian/[id]` route where the route param is a series UUID,
 * not a slug. Single fetch (not infinite) — one series per detail page.
 *
 * Pass `queryClient` when `QueryClientProvider` is not yet in the layout context
 * (same workaround as `defineNearbyInfiniteQuery`).
 * TODO(phase-D): remove `queryClient` param once shared provider is wired.
 */
export function defineSeriesByIdQuery(
	args: SeriesByIdArgs,
	opts?: {
		enabled?: boolean;
		staleTime?: number;
		requestId?: string;
		initialData?: EventSeriesResponse;
	},
	queryClient?: QueryClient
) {
	return createQuery<EventSeriesResponse | undefined>(
		() => ({
			queryKey: eventKeys.seriesById(args.id, args.expand),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				api('events.seriesById', args, undefined, {
					signal,
					requestId: opts?.requestId,
					baseUrl: ''
				}) as Promise<EventSeriesResponse | undefined>,
			enabled: opts?.enabled,
			staleTime: opts?.staleTime,
			initialData: opts?.initialData,
			initialDataUpdatedAt: opts?.initialData ? Date.now() : undefined
		}),
		queryClient ? () => queryClient : undefined
	);
}

/**
 * Reactive upcoming occurrences by event_id query (requires Svelte context).
 *
 * Used by the `/kajian/[id]` schedule strip — lists upcoming occurrences
 * for a series keyed by the series UUID (`event_id` filter on `events.list`).
 * Accepts `date_from` to start from today and a `limit` cap for the strip.
 *
 * Pass `queryClient` when `QueryClientProvider` is not yet in the layout context.
 * TODO(phase-D): remove `queryClient` param once shared provider is wired.
 */
export function defineOccurrencesByEventQuery(
	args: ListArgs,
	opts?: {
		enabled?: boolean;
		staleTime?: number;
		requestId?: string;
		initialData?: Paginated<EventRecurringResponse[]>;
	},
	queryClient?: QueryClient
) {
	return createQuery<Paginated<EventRecurringResponse[]>>(
		() => ({
			queryKey: eventKeys.occurrencesByEvent(args),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				api('events.list', args, undefined, {
					signal,
					requestId: opts?.requestId,
					baseUrl: ''
				}) as Promise<Paginated<EventRecurringResponse[]>>,
			enabled: opts?.enabled,
			staleTime: opts?.staleTime,
			initialData: opts?.initialData,
			initialDataUpdatedAt: opts?.initialData ? Date.now() : undefined
		}),
		queryClient ? () => queryClient : undefined
	);
}

/**
 * Reactive list event series query.
 */
export function defineSeriesListQuery(
	args: ListSeriesArgs,
	opts?: {
		enabled?: boolean;
		staleTime?: number;
		requestId?: string;
		initialData?: Paginated<EventSeriesResponse[]>;
	},
	queryClient?: QueryClient
) {
	return createQuery<Paginated<EventSeriesResponse[]>>(
		() => ({
			queryKey: eventKeys.listSeries(args),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				api('events.listSeries', args, undefined, {
					signal,
					requestId: opts?.requestId,
					baseUrl: ''
				}) as Promise<Paginated<EventSeriesResponse[]>>,
			enabled: opts?.enabled,
			staleTime: opts?.staleTime,
			initialData: opts?.initialData,
			initialDataUpdatedAt: opts?.initialData ? Date.now() : undefined
		}),
		queryClient ? () => queryClient : undefined
	);
}

// ---------------------------------------------------------------------------
// Domain calendar query
// ---------------------------------------------------------------------------

/**
 * Domain calendar args — maps domainType to filter field for events.list.
 */
export interface DomainCalendarArgs {
	domainType: 'subject' | 'asatidz' | 'place';
	domainId: string;
	dateFrom: string;
	dateTo: string;
}

/**
 * Build the filter args for `events.list` from a domain calendar args object.
 * Maps domainType to the correct filter field (subject_id, asatidz_id, place_id).
 */
function domainCalendarFilterArgs(args: DomainCalendarArgs): ListArgs {
	const filterField =
		args.domainType === 'subject'
			? { subject_id: args.domainId }
			: args.domainType === 'asatidz'
				? { asatidz_id: args.domainId }
				: { place_id: args.domainId };

	return {
		...filterField,
		date_from: args.dateFrom,
		date_to: args.dateTo,
		limit: 100
	};
}

/**
 * Reactive domain calendar query — fetches occurrences for a domain calendar.
 *
 * Maps domainType to the correct filter field and calls events.list with a
 * date range ± 7 days padded around the current month.
 */
export function defineDomainCalendarQuery(
	args: DomainCalendarArgs,
	opts?: {
		enabled?: boolean;
		staleTime?: number;
		requestId?: string;
		initialData?: Paginated<EventRecurringResponse[]>;
	},
	queryClient?: QueryClient
) {
	return createQuery<Paginated<EventRecurringResponse[]>>(
		() => ({
			queryKey: eventKeys.domainCalendar(args),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				api('events.list', domainCalendarFilterArgs(args), undefined, {
					signal,
					requestId: opts?.requestId,
					baseUrl: ''
				}) as Promise<Paginated<EventRecurringResponse[]>>,
			enabled: opts?.enabled,
			staleTime: opts?.staleTime,
			initialData: opts?.initialData,
			initialDataUpdatedAt: opts?.initialData ? Date.now() : undefined
		}),
		queryClient ? () => queryClient : undefined
	);
}

/**
 * Pure utility: extract unique ISO dates (date_start substring(0,10)) from
 * a list of recurring event occurrences into a Set<string>.
 *
 * @example
 * ```ts
 * const dates = deriveEventDates(response.data)
 * // Set { "2026-06-01", "2026-06-03", ... }
 * ```
 */
export function deriveEventDates(occurrences: EventRecurringResponse[]): Set<string> {
	const dates = new Set<string>();
	for (const occ of occurrences) {
		if (occ.date_start) {
			dates.add(occ.date_start.substring(0, 10));
		}
	}
	return dates;
}
