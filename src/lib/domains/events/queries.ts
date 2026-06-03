/**
 * Events domain — svelte-query keys and query factories.
 *
 * Provides:
 *   - `eventKeys` — stable TanStack query key factory.
 *   - `buildNearbyQueryOptions` — pure options builder for nearby events
 *     (testable without component lifecycle).
 *   - `defineNearbyQuery` — reactive wrapper (requires Svelte context).
 *   - `buildNextPageArgs` — pure helper: given a `PaginationMeta`, returns
 *     cursor args for the next page or `null` when `has_more` is false.
 *     Enables cursor-accumulation logic at the call site.
 *
 * Cursor pagination note: TanStack infinite query (`createInfiniteQuery`) is
 * not wired here yet because it requires a stable `getNextPageParam`
 * interface — that is a C3 concern when the list UI lands. For now callers
 * drive pagination by extracting `pagination.next_cursor` from each page's
 * `data` field and passing it as the `cursor` arg to the next call.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (all upstream calls via api())
 *   - rule .claude/rules/architecture.md   (queries.ts in domains/events/)
 */
import { buildQueryOptions, defineQuery } from '$core/query';
import type { PaginationMeta } from '$core/api';
import type { NearbyArgs, ListArgs, SeriesPaginatedArgs } from './service.js';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const eventKeys = {
	all: ['events'] as const,
	nearby: (args: NearbyArgs) => ['events', 'nearby', args] as const,
	list: (args: ListArgs) => ['events', 'list', args] as const,
	get: (id: number, expand?: string) => ['events', 'get', id, expand] as const,
	series: (slug: string, expand?: string) => ['events', 'series', slug, expand] as const,
	seriesUpcoming: (args: SeriesPaginatedArgs) => ['events', 'seriesUpcoming', args] as const,
	seriesRecurrings: (args: SeriesPaginatedArgs) => ['events', 'seriesRecurrings', args] as const
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
