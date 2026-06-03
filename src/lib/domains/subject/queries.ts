/**
 * Subject domain — svelte-query keys and query factories.
 *
 * Provides:
 *   - `subjectKeys` — stable TanStack query key factory.
 *   - `defineSubjectByIdQuery` — single-fetch reactive query for a subject detail.
 *
 * The page composes events queries for the subject's kajian; this domain
 * does not import the events domain (architecture.md: no cross-domain imports).
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (all upstream calls via api())
 *   - rule .claude/rules/architecture.md   (queries.ts in domains/subject/)
 *   - rule .claude/rules/state-management.md (server data in svelte-query)
 */
import { createQuery } from '@tanstack/svelte-query';
import { api } from '$core/api';
import type { QueryClient } from '@tanstack/svelte-query';
import type { SubjectResponse } from './schema.js';
import type { GetByIdArgs } from './service.js';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const subjectKeys = {
	all: ['subject'] as const,
	get: (id: string, expand?: string) => ['subject', 'get', id, expand] as const
} as const;

// ---------------------------------------------------------------------------
// Single-subject query
// ---------------------------------------------------------------------------

/**
 * Reactive subject-by-UUID query (requires Svelte component context).
 *
 * Used by the `/tema/[id]` route. Single fetch — one subject per detail page.
 *
 * Pass `queryClient` when `QueryClientProvider` is not yet in the layout context
 * (same workaround as `definePlaceByIdQuery`).
 * TODO(phase-D): remove `queryClient` param once shared provider is wired.
 */
export function defineSubjectByIdQuery(
	args: GetByIdArgs,
	opts?: { enabled?: boolean; staleTime?: number; requestId?: string },
	queryClient?: QueryClient
) {
	return createQuery<SubjectResponse | undefined>(
		() => ({
			queryKey: subjectKeys.get(args.id, args.expand),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				api('subject.get', args, undefined, {
					signal,
					requestId: opts?.requestId,
					baseUrl: ''
				}) as Promise<SubjectResponse | undefined>,
			enabled: opts?.enabled,
			staleTime: opts?.staleTime
		}),
		queryClient ? () => queryClient : undefined
	);
}
