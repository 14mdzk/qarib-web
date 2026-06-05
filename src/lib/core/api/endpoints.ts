/**
 * Typed endpoint registry.
 *
 * Every upstream call is declared here. `api()` in `core-fetch.ts` consumes
 * the registry; call sites receive exact return types without casts.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (registry is the single source of truth)
 *   - rule .claude/rules/security.md       (no inline URL strings outside this file)
 *
 * Conventions:
 *   - Key format: `<domain>.<action>` (e.g. `'events.nearby'`).
 *   - `path` builders return the BFF-relative path (`/api/upstream/…`).
 *   - Add Zod parsers in `parsers/<name>.ts` for endpoints with a history of
 *     contract violations or stricter typing needs (see api-contract rule).
 */
import type { paths, components } from '$generated/upstream';
import type { Paginated } from './core-fetch.js';

/** Shorthand for a single event occurrence from the generated schema. */
type EventRecurringResponse = components['schemas']['EventRecurringResponse'];

/** Shorthand for a single event series template from the generated schema. */
type EventSeriesResponse = components['schemas']['EventSeriesResponse'];

// ---------------------------------------------------------------------------
// URL helper
// ---------------------------------------------------------------------------

/**
 * Build a query string from an args object, omitting keys whose value is
 * `undefined` or `null`. Returns an empty string when the object is empty.
 * Only used inside path builders in this file.
 */
function qs(params: Record<string, string | number | boolean | undefined | null>): string {
	const pairs: string[] = [];
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined && v !== null) {
			pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
		}
	}
	return pairs.length ? `?${pairs.join('&')}` : '';
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/**
 * Extract the 200 response body type for a given path + method from the
 * generated OpenAPI types.
 */
type Get200<
	P extends keyof paths,
	M extends 'get' | 'post' | 'put' | 'patch' | 'delete'
> = paths[P][M] extends {
	responses: { 200: { content: { 'application/json': infer R } } };
}
	? R
	: never;

/**
 * Unwrap `{ data: D }` envelope shapes.  Callers receive `D` directly after
 * `core-fetch` strips the envelope.
 */
type DataOf<E> = E extends { data: infer D } ? D : E;

// ---------------------------------------------------------------------------
// EndpointDef
// ---------------------------------------------------------------------------

/**
 * A single registered endpoint.
 *
 * Generic parameters:
 *   - `Args`     — query/path params passed to the `path` builder.
 *   - `Body`     — request body type (`void` for bodyless methods).
 *   - `Response` — the unwrapped data type consumers receive.
 *
 * `_phantom` is never used at runtime; it exists solely to preserve the
 * type parameters so the helper types `ArgOf`, `BodyOf`, `ResponseOf` can
 * extract them via conditional type inference.
 */
export interface EndpointDef<Args, Body, Response> {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	path: (args: Args) => string;
	/** @internal — phantom field for type inference only; never accessed. */
	_phantom?: { args: Args; body: Body; response: Response };
}

/**
 * Identity helper that attaches phantom type params and returns the def
 * unchanged at runtime. Use this rather than a raw object literal so the
 * type parameters are explicitly stated.
 */
export function defineEndpoint<Args = void, Body = void, Response = unknown>(
	def: Omit<EndpointDef<Args, Body, Response>, '_phantom'>
): EndpointDef<Args, Body, Response> {
	return def as EndpointDef<Args, Body, Response>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const Endpoints = {
	/**
	 * Retrieve the current authenticated user from the upstream.
	 *
	 * Routed through the BFF at `/api/upstream/users/me` so the server
	 * can inject the Authorization header without exposing the token to the
	 * browser (see rule auth-and-session.md, ADR 0003).
	 */
	'auth.session': defineEndpoint<void, void, DataOf<Get200<'/users/me', 'get'>>>({
		method: 'GET',
		path: () => '/api/upstream/users/me'
	}),

	/**
	 * Exchange credentials for tokens.
	 *
	 * CATALOG ENTRY ONLY — called server-side directly per ADR 0008, not
	 * through api(). Do not use api('auth.login', …) from client code.
	 * Type derivation from $generated/upstream is the value here.
	 */
	'auth.login': defineEndpoint<
		void,
		Get200<'/auth/login', 'post'> extends { data: { accessToken: string } }
			? { email: string; password: string }
			: { email: string; password: string },
		DataOf<Get200<'/auth/login', 'post'>>
	>({
		method: 'POST',
		path: () => '/api/upstream/auth/login'
	}),

	/**
	 * Revoke the current session on the upstream.
	 *
	 * CATALOG ENTRY ONLY — called server-side directly per ADR 0008.
	 */
	'auth.logout': defineEndpoint<void, void, DataOf<Get200<'/auth/logout', 'post'>>>({
		method: 'POST',
		path: () => '/api/upstream/auth/logout'
	}),

	/**
	 * Rotate the access token using a refresh token.
	 *
	 * CATALOG ENTRY ONLY — called server-side directly per ADR 0008.
	 */
	'auth.refresh': defineEndpoint<
		void,
		{ refreshToken: string },
		DataOf<Get200<'/auth/refresh', 'post'>>
	>({
		method: 'POST',
		path: () => '/api/upstream/auth/refresh'
	}),

	// ---------------------------------------------------------------------------
	// Events domain
	// ---------------------------------------------------------------------------

	/**
	 * Spatial event discovery — occurrences near a lat/lng or region.
	 *
	 * The real upstream envelope is single-level:
	 *   `{ success, data: EventRecurringResponse[], pagination: { next_cursor, … } }`
	 * `api()` detects the `pagination` field and returns `{ data, pagination }`
	 * so callers can drive cursor-based paging. See `core-fetch.ts`.
	 */
	'events.nearby': defineEndpoint<
		{
			lat?: number;
			lng?: number;
			region_id?: string;
			radius_km?: number;
			subject_id?: string;
			date_from?: string;
			date_to?: string;
			limit?: number;
			cursor?: string;
			expand?: string;
		},
		void,
		Paginated<EventRecurringResponse[]>
	>({
		method: 'GET',
		path: (a) =>
			`/api/upstream/events/nearby${qs({
				lat: a.lat,
				lng: a.lng,
				region_id: a.region_id,
				radius_km: a.radius_km,
				subject_id: a.subject_id,
				date_from: a.date_from,
				date_to: a.date_to,
				limit: a.limit,
				cursor: a.cursor,
				expand: a.expand
			})}`
	}),

	/**
	 * Discovery list of event occurrences with filter support.
	 *
	 * Cursor-paginated — see `events.nearby` for the envelope note.
	 */
	'events.list': defineEndpoint<
		{
			event_id?: string;
			place_id?: string;
			asatidz_id?: string;
			subject_id?: string;
			status?: number;
			date_from?: string;
			date_to?: string;
			limit?: number;
			cursor?: string;
			expand?: string;
		},
		void,
		Paginated<EventRecurringResponse[]>
	>({
		method: 'GET',
		path: (a) =>
			`/api/upstream/events${qs({
				event_id: a.event_id,
				place_id: a.place_id,
				asatidz_id: a.asatidz_id,
				subject_id: a.subject_id,
				status: a.status,
				date_from: a.date_from,
				date_to: a.date_to,
				limit: a.limit,
				cursor: a.cursor,
				expand: a.expand
			})}`
	}),

	/**
	 * List event series with filters (paginated).
	 */
	'events.listSeries': defineEndpoint<
		{
			place_id?: string;
			asatidz_id?: string;
			subject_id?: string;
			limit?: number;
			cursor?: string;
			expand?: string;
		},
		void,
		Paginated<EventSeriesResponse[]>
	>({
		method: 'GET',
		path: (a) =>
			`/api/upstream/events/series${qs({
				place_id: a.place_id,
				asatidz_id: a.asatidz_id,
				subject_id: a.subject_id,
				limit: a.limit,
				cursor: a.cursor,
				expand: a.expand
			})}`
	}),

	/**
	 * Single event occurrence by integer ID.
	 */
	'events.get': defineEndpoint<
		{ id: number; expand?: string },
		void,
		DataOf<Get200<'/events/{id}', 'get'>>
	>({
		method: 'GET',
		path: (a) => `/api/upstream/events/${a.id}${qs({ expand: a.expand })}`
	}),

	/**
	 * Event series template by slug.
	 */
	'events.series': defineEndpoint<
		{ slug: string; expand?: string },
		void,
		DataOf<Get200<'/events/series/{slug}', 'get'>>
	>({
		method: 'GET',
		path: (a) =>
			`/api/upstream/events/series/${encodeURIComponent(a.slug)}${qs({ expand: a.expand })}`
	}),

	/**
	 * Upcoming occurrences for a series (cursor-paginated).
	 * See `events.nearby` for the envelope note.
	 */
	'events.seriesUpcoming': defineEndpoint<
		{ slug: string; limit?: number; cursor?: string },
		void,
		Paginated<EventRecurringResponse[]>
	>({
		method: 'GET',
		path: (a) =>
			`/api/upstream/events/series/${encodeURIComponent(a.slug)}/upcoming${qs({ limit: a.limit, cursor: a.cursor })}`
	}),

	/**
	 * All occurrences for a series (past + future, cursor-paginated).
	 * See `events.nearby` for the envelope note.
	 */
	'events.seriesRecurrings': defineEndpoint<
		{ slug: string; limit?: number; cursor?: string },
		void,
		Paginated<EventRecurringResponse[]>
	>({
		method: 'GET',
		path: (a) =>
			`/api/upstream/events/series/${encodeURIComponent(a.slug)}/recurrings${qs({ limit: a.limit, cursor: a.cursor })}`
	}),

	/**
	 * Event series template by UUID.
	 *
	 * Mirrors `events.series` (by-slug) but keyed by the event series UUID.
	 * The `/kajian/[id]` route uses this; the route param IS the series UUID.
	 */
	'events.seriesById': defineEndpoint<
		{ id: string; expand?: string },
		void,
		DataOf<Get200<'/events/series/by-id/{id}', 'get'>>
	>({
		method: 'GET',
		path: (a) =>
			`/api/upstream/events/series/by-id/${encodeURIComponent(a.id)}${qs({ expand: a.expand })}`
	}),

	// ---------------------------------------------------------------------------
	// Places domain
	// ---------------------------------------------------------------------------

	/**
	 * Single place (masjid) by UUID.
	 *
	 * Used by the `/masjid/[id]` route. Public endpoint — no auth required.
	 */
	'places.get': defineEndpoint<
		{ id: string; expand?: string },
		void,
		DataOf<Get200<'/places/{id}', 'get'>>
	>({
		method: 'GET',
		path: (a) => `/api/upstream/places/${encodeURIComponent(a.id)}${qs({ expand: a.expand })}`
	}),

	// ---------------------------------------------------------------------------
	// Asatidz domain
	// ---------------------------------------------------------------------------

	/**
	 * Single asatidz (Islamic scholar) by UUID.
	 *
	 * Used by the `/ustadz/[id]` route. Public endpoint — no auth required.
	 */
	'asatidz.get': defineEndpoint<
		{ id: string; expand?: string },
		void,
		DataOf<Get200<'/asatidzs/{id}', 'get'>>
	>({
		method: 'GET',
		path: (a) => `/api/upstream/asatidzs/${encodeURIComponent(a.id)}${qs({ expand: a.expand })}`
	}),

	// ---------------------------------------------------------------------------
	// Subject domain
	// ---------------------------------------------------------------------------

	/**
	 * Single subject (Islamic topic / tema kajian) by UUID.
	 *
	 * Used by the `/tema/[id]` route. Public endpoint — no auth required.
	 */
	'subject.get': defineEndpoint<
		{ id: string; expand?: string },
		void,
		DataOf<Get200<'/subjects/{id}', 'get'>>
	>({
		method: 'GET',
		path: (a) => `/api/upstream/subjects/${encodeURIComponent(a.id)}${qs({ expand: a.expand })}`
	})
} as const;

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

export type EndpointKey = keyof typeof Endpoints;

/** Extract the `Args` type parameter for a registry key. */
export type ArgOf<K extends EndpointKey> =
	(typeof Endpoints)[K] extends EndpointDef<infer A, unknown, unknown> ? A : never;

/** Extract the `Body` type parameter for a registry key. */
export type BodyOf<K extends EndpointKey> =
	(typeof Endpoints)[K] extends EndpointDef<unknown, infer B, unknown> ? B : never;

/** Extract the `Response` type parameter for a registry key. */
export type ResponseOf<K extends EndpointKey> =
	(typeof Endpoints)[K] extends EndpointDef<unknown, unknown, infer R> ? R : never;
