/**
 * Regions domain — svelte-query keys and query factories.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md
 *   - rule .claude/rules/state-management.md (server data in svelte-query)
 */
import { createQuery } from '@tanstack/svelte-query';
import { api } from '$core/api';
import type { Paginated } from '$core/api';
import type { RegionResponse } from './schema.js';
import type { ListRegionsArgs, GetRegionArgs } from './service.js';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const regionKeys = {
	all: ['regions'] as const,
	list: (args: ListRegionsArgs) => ['regions', 'list', args] as const,
	get: (id: string) => ['regions', 'get', id] as const
} as const;

// ---------------------------------------------------------------------------
// Reactive queries
// ---------------------------------------------------------------------------

export function defineRegionsListQuery(
	args: ListRegionsArgs | (() => ListRegionsArgs),
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string }
) {
	return createQuery<Paginated<RegionResponse[]>>(() => {
		const resolved = typeof args === 'function' ? args() : args;
		return {
			queryKey: regionKeys.list(resolved),
			queryFn: ({ signal }) =>
				api('regions.list', resolved, undefined, {
					signal,
					requestId: opts?.requestId,
					baseUrl: ''
				}),
			enabled: opts?.enabled,
			staleTime: opts?.staleTime
		};
	});
}

export function defineRegionByIdQuery(
	args: GetRegionArgs | (() => GetRegionArgs),
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string }
) {
	return createQuery<RegionResponse | undefined>(() => {
		const resolved = typeof args === 'function' ? args() : args;
		return {
			queryKey: regionKeys.get(resolved.id),
			queryFn: ({ signal }) =>
				api('regions.get', resolved, undefined, {
					signal,
					requestId: opts?.requestId,
					baseUrl: ''
				}),
			enabled: opts?.enabled,
			staleTime: opts?.staleTime
		};
	});
}
