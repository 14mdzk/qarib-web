/**
 * Asatidz domain — svelte-query keys and query factories.
 *
 * Provides:
 *   - `asatidzKeys` — stable TanStack query key factory.
 *   - `defineAsatidzByIdQuery` — single-fetch reactive query for an asatidz detail.
 *
 * The page composes events queries for the asatidz's kajian; this domain
 * does not import the events domain (architecture.md: no cross-domain imports).
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (all upstream calls via api())
 *   - rule .claude/rules/architecture.md   (queries.ts in domains/asatidz/)
 *   - rule .claude/rules/state-management.md (server data in svelte-query)
 */
import { createQuery } from '@tanstack/svelte-query';
import { api } from '$core/api';
import type { QueryClient } from '@tanstack/svelte-query';
import type { AsatidzResponse } from './schema.js';
import type { GetByIdArgs } from './service.js';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const asatidzKeys = {
	all: ['asatidz'] as const,
	get: (id: string, expand?: string) => ['asatidz', 'get', id, expand] as const
} as const;

// ---------------------------------------------------------------------------
// Single-asatidz query
// ---------------------------------------------------------------------------

/**
 * Reactive asatidz-by-UUID query (requires Svelte component context).
 *
 * Used by the `/ustadz/[id]` route. Single fetch — one asatidz per detail page.
 *
 * Pass `queryClient` when `QueryClientProvider` is not yet in the layout context
 * (same workaround as `definePlaceByIdQuery`).
 * TODO(phase-D): remove `queryClient` param once shared provider is wired.
 */
export function defineAsatidzByIdQuery(
	args: GetByIdArgs,
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string },
	queryClient?: QueryClient
) {
	return createQuery<AsatidzResponse | undefined>(
		() => ({
			queryKey: asatidzKeys.get(args.id, args.expand),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				api('asatidz.get', args, undefined, {
					signal,
					requestId: opts?.requestId,
					baseUrl: ''
				}) as Promise<AsatidzResponse | undefined>,
			enabled: opts?.enabled,
			staleTime: opts?.staleTime
		}),
		queryClient ? () => queryClient : undefined
	);
}
