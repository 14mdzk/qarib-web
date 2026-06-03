/**
 * Typed fetch wrapper.
 *
 * `api()` is the only place in this codebase where `fetch` is called for
 * upstream requests. It:
 *   1. Resolves the endpoint path from the registry.
 *   2. Calls `fetch` with the correct method, headers, and body.
 *   3. Unwraps the `{ success, data }` / `{ success, error }` envelope exactly
 *      once. Consumers receive `data` directly or catch an `ApiError`.
 *   4. When the success envelope carries a top-level `pagination` field,
 *      returns `{ data, pagination }` instead of bare `data` so callers can
 *      drive cursor-based pagination. Non-paginated endpoints are unchanged.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (envelope unwrapped once, no hand-rolled fetch)
 *   - rule .claude/rules/observability.md  (requestId forwarded as x-request-id)
 *   - rule .claude/rules/security.md       (no tokens reach the browser)
 */
import { ApiError } from './error.js';
import {
	Endpoints,
	type EndpointKey,
	type ArgOf,
	type BodyOf,
	type ResponseOf
} from './endpoints.js';

// ---------------------------------------------------------------------------
// Paginated response wrapper
// ---------------------------------------------------------------------------

/**
 * Returned by `api()` for endpoints whose upstream envelope carries a
 * `pagination` field alongside `data`.
 *
 * The real API envelope is single-level:
 *   `{ success: true, data: T[], pagination: { next_cursor, prev_cursor, has_more, has_prev, total? } }`
 *
 * `api()` unwraps `success` and re-packages as `{ data: T[], pagination }` so
 * consumers can access both the items and the cursor metadata.
 *
 * Use `Paginated<EventRecurringResponse[]>` as the `Response` type param in
 * `defineEndpoint` for any list endpoint that returns cursor pagination.
 */
export interface Paginated<T> {
	data: T;
	pagination: PaginationMeta;
}

/**
 * Inline pagination meta — mirrors `components['schemas']['PaginationMeta']`
 * without importing `$generated` into core.
 *
 * Drift risk: this is a hand-mirror with no codegen guard.  If the upstream
 * schema adds, removes, or renames a field, this interface will not update
 * automatically — the discrepancy won't be caught by the compiler.  When
 * running `bun run codegen` after an upstream schema change, manually verify
 * this interface still matches `components['schemas']['PaginationMeta']` in
 * `src/lib/generated/upstream.ts`.
 */
export interface PaginationMeta {
	next_cursor?: string | null;
	prev_cursor?: string | null;
	has_more?: boolean;
	has_prev?: boolean;
	total?: number | null;
}

// ---------------------------------------------------------------------------
// Envelope shapes
// ---------------------------------------------------------------------------

interface SuccessEnvelope<T> {
	success: true;
	data: T;
	pagination?: PaginationMeta;
	message?: string;
}

interface ErrorEnvelope {
	success: false;
	error: { code: string; message: string };
}

type Envelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ApiCallOptions {
	/**
	 * A bound `fetch` to use in place of the global.  **Required when calling
	 * `api()` from a SvelteKit server load function** — pass `event.fetch` so
	 * SvelteKit can handle cookies and internal route resolution correctly.
	 *
	 * On the client the global `fetch` is used when this is omitted.
	 */
	fetch?: typeof fetch;
	/**
	 * Forwarded to the upstream as `x-request-id`. When set, the header is
	 * included on every outbound request so logs on the upstream can be
	 * correlated with the originating request (see rule observability.md).
	 */
	requestId?: string;
	/** Optional abort signal to cancel the request. */
	signal?: AbortSignal;
	/**
	 * Base URL to prepend to relative paths. Defaults to `''` (relative).
	 * Tests pass `'http://localhost'` so Node's built-in fetch can resolve the
	 * URL; production code leaves this unset and relies on the browser/server
	 * resolving relative paths against the current origin.
	 */
	baseUrl?: string;
}

/**
 * Call a registered upstream endpoint and return its typed response data.
 *
 * @throws {ApiError} on network failure, non-2xx status, unexpected payload
 *   shape, or a `success: false` envelope from the upstream.
 */
export async function api<K extends EndpointKey>(
	key: K,
	args: ArgOf<K>,
	body?: BodyOf<K>,
	opts?: ApiCallOptions
): Promise<ResponseOf<K>> {
	const def = Endpoints[key];

	// SSR guard — Node does not resolve relative URLs.  Callers using `api()`
	// from a server load function must pass `opts.fetch` (i.e. `event.fetch`).
	// We detect the server side by checking for the absence of `window`.
	const isServer = typeof window === 'undefined';
	if (isServer && !opts?.fetch) {
		throw new ApiError({
			code: 'MISSING_FETCH',
			message: 'Pass event.fetch via opts.fetch when calling api() from a server load function.',
			status: 0
		});
	}

	const fetchFn = opts?.fetch ?? fetch;

	// Build the full URL.  A `baseUrl` is only used in tests where Node needs
	// an absolute URL; in production the path is relative and resolves against
	// the current origin in both browser and SvelteKit server contexts.
	const path = (def.path as (args: ArgOf<K>) => string)(args);
	const url = opts?.baseUrl ? `${opts.baseUrl}${path}` : path;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	};

	if (opts?.requestId) {
		headers['x-request-id'] = opts.requestId;
	}

	let response: Response;
	try {
		response = await fetchFn(url, {
			method: def.method,
			headers,
			body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
			signal: opts?.signal
		});
	} catch (cause) {
		throw new ApiError({
			code: 'NETWORK_ERROR',
			message: cause instanceof Error ? cause.message : 'Network request failed',
			status: 0,
			requestId: opts?.requestId
		});
	}

	// Capture request id from the response header for correlation.
	const responseRequestId = response.headers.get('x-request-id') ?? opts?.requestId;

	if (!response.ok) {
		throw new ApiError({
			code: 'HTTP_ERROR',
			message: response.statusText || `HTTP ${response.status}`,
			status: response.status,
			requestId: responseRequestId
		});
	}

	let envelope: unknown;
	try {
		envelope = await response.json();
	} catch {
		throw new ApiError({
			code: 'UNEXPECTED_SHAPE',
			message: 'Response body is not valid JSON',
			status: response.status,
			requestId: responseRequestId
		});
	}

	// Validate envelope shape.
	if (typeof envelope !== 'object' || envelope === null || !('success' in envelope)) {
		throw new ApiError({
			code: 'UNEXPECTED_SHAPE',
			message: 'Response body does not match the expected envelope shape',
			status: response.status,
			requestId: responseRequestId
		});
	}

	const typed = envelope as Envelope<ResponseOf<K>>;

	if (!typed.success) {
		const errEnv = typed as ErrorEnvelope;
		throw new ApiError({
			code: errEnv.error?.code ?? 'UNKNOWN',
			message: errEnv.error?.message ?? 'Unknown error',
			status: response.status,
			requestId: responseRequestId
		});
	}

	const success = typed as SuccessEnvelope<ResponseOf<K>>;

	// When the envelope carries a `pagination` field the endpoint is a
	// cursor-paginated list.  Return `{ data, pagination }` so callers can
	// access the cursor metadata.  Endpoints without `pagination` return
	// `data` directly, preserving the existing behaviour.
	//
	// Cast contract: `as ResponseOf<K>` is sound only because the registry
	// declares `Paginated<T>` as `ResponseOf` for every endpoint whose
	// upstream actually includes a `pagination` field.  If an endpoint is
	// mistakenly typed as `Paginated<T>` but the upstream omits `pagination`,
	// the cast still succeeds at compile time and the caller silently receives
	// `{ data: …, pagination: undefined }` — the type is wrong at runtime with
	// no compiler error.  Keep registry types and upstream contract in sync.
	if (success.pagination !== undefined) {
		return { data: success.data, pagination: success.pagination } as ResponseOf<K>;
	}

	return success.data;
}
