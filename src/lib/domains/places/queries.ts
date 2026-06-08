/**
 * Places domain — svelte-query keys and query factories.
 *
 * Provides:
 *   - `placeKeys` — stable TanStack query key factory.
 *   - `definePlaceByIdQuery` — single-fetch reactive query for a place detail.
 *
 * The page composes events queries for the place's kajian; this domain
 * does not import the events domain (architecture.md: no cross-domain imports).
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (all upstream calls via api())
 *   - rule .claude/rules/architecture.md   (queries.ts in domains/places/)
 *   - rule .claude/rules/state-management.md (server data in svelte-query)
 */
import { createQuery } from '@tanstack/svelte-query';
import { api } from '$core/api';
import type { QueryClient } from '@tanstack/svelte-query';
import type { Paginated } from '$core/api';
import type { PlaceResponse } from './schema.js';
import type { GetByIdArgs, ListPlacesArgs } from './service.js';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const placeKeys = {
	all: ['places'] as const,
	list: (args: ListPlacesArgs) => ['places', 'list', args] as const,
	get: (id: string, expand?: string) => ['places', 'get', id, expand] as const
} as const;

// ---------------------------------------------------------------------------
// Place list query
// ---------------------------------------------------------------------------

/**
 * Reactive place-list query.
 */
export function definePlaceListQuery(
	args: ListPlacesArgs | (() => ListPlacesArgs),
	opts?: {
		enabled?: boolean | (() => boolean);
		staleTime?: number;
		requestId?: string;
		initialData?: Paginated<PlaceResponse[]>;
	},
	queryClient?: QueryClient
) {
	return createQuery<Paginated<PlaceResponse[]>>(
		() => ({
			queryKey: placeKeys.list(typeof args === 'function' ? args() : args),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				api('places.list', typeof args === 'function' ? args() : args, undefined, {
					signal,
					requestId: opts?.requestId,
					baseUrl: ''
				}) as Promise<Paginated<PlaceResponse[]>>,
			enabled: typeof opts?.enabled === 'function' ? opts.enabled() : opts?.enabled,
			staleTime: opts?.staleTime,
			initialData: opts?.initialData,
			initialDataUpdatedAt: opts?.initialData ? Date.now() : undefined
		}),
		queryClient ? () => queryClient : undefined
	);
}

// ---------------------------------------------------------------------------
// Single-place query
// ---------------------------------------------------------------------------

/**
 * Reactive place-by-UUID query (requires Svelte component context).
 *
 * Used by the `/masjid/[id]` route. Single fetch — one place per detail page.
 *
 * Pass `queryClient` when `QueryClientProvider` is not yet in the layout context
 * (same workaround as `defineSeriesByIdQuery`).
 * TODO(phase-D): remove `queryClient` param once shared provider is wired.
 */
export function definePlaceByIdQuery(
	args: GetByIdArgs,
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string; initialData?: PlaceResponse },
	queryClient?: QueryClient
) {
	return createQuery<PlaceResponse | undefined>(
		() => ({
			queryKey: placeKeys.get(args.id, args.expand),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				api('places.get', args, undefined, {
					signal,
					requestId: opts?.requestId,
					baseUrl: ''
				}) as Promise<PlaceResponse | undefined>,
			enabled: opts?.enabled,
			staleTime: opts?.staleTime,
			initialData: opts?.initialData,
			initialDataUpdatedAt: opts?.initialData ? Date.now() : undefined
		}),
		queryClient ? () => queryClient : undefined
	);
}
