/**
 * Events domain — service layer.
 *
 * The only module in this domain that calls `api()`. All upstream event
 * requests go through these functions; no other file in the events domain
 * (or the rest of the app) should call `api()` for event endpoints.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (no hand-rolled fetch; all via api())
 *   - rule .claude/rules/architecture.md   (service.ts in domains/events/)
 */
import { api, type ApiCallOptions, type Paginated } from '$core/api';
import type { EventRecurringResponse, EventSeriesResponse } from './schema.js';

// ---------------------------------------------------------------------------
// Arg types (mirrors registry; typed locally for callers' convenience)
// ---------------------------------------------------------------------------

export interface NearbyArgs {
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
}

export interface ListArgs {
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
}

export interface ListSeriesArgs {
	place_id?: string;
	asatidz_id?: string;
	subject_id?: string;
	limit?: number;
	cursor?: string;
	expand?: string;
}

export interface SeriesPaginatedArgs {
	slug: string;
	limit?: number;
	cursor?: string;
}

export interface SeriesByIdArgs {
	id: string;
	expand?: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Spatial event discovery — occurrences near a lat/lng or region.
 *
 * Returns `{ data: EventRecurringResponse[], pagination }` so callers can
 * extract `pagination.next_cursor` for cursor-based paging.
 * `api()` surfaces `pagination` from the single-level upstream envelope at
 * runtime — this is not a type-only promise.
 */
export async function fetchNearbyEvents(
	args: NearbyArgs,
	opts?: ApiCallOptions
): Promise<Paginated<EventRecurringResponse[]>> {
	return api('events.nearby', args, undefined, opts);
}

/**
 * Discovery list of event occurrences with filter support.
 * Returns `{ data, pagination }` — see `fetchNearbyEvents` for details.
 */
export async function fetchEventList(
	args: ListArgs,
	opts?: ApiCallOptions
): Promise<Paginated<EventRecurringResponse[]>> {
	return api('events.list', args, undefined, opts);
}

/**
 * Single event occurrence by integer ID.
 * Returns whatever `api()` unwraps from `envelope.data` — the generated type
 * allows the field to be absent, so callers should guard for `undefined`.
 */
export async function fetchEvent(
	id: number,
	expand?: string,
	opts?: ApiCallOptions
): Promise<EventRecurringResponse | undefined> {
	return api('events.get', { id, expand }, undefined, opts);
}

/**
 * Event series template by slug.
 * Returns whatever `api()` unwraps from `envelope.data` — may be `undefined`
 * if the generated type marks the field optional.
 */
export async function fetchEventSeries(
	slug: string,
	expand?: string,
	opts?: ApiCallOptions
): Promise<EventSeriesResponse | undefined> {
	return api('events.series', { slug, expand }, undefined, opts);
}

/**
 * Upcoming occurrences for a series (cursor-paginated).
 * Returns `{ data, pagination }` — see `fetchNearbyEvents` for details.
 */
export async function fetchSeriesUpcoming(
	args: SeriesPaginatedArgs,
	opts?: ApiCallOptions
): Promise<Paginated<EventRecurringResponse[]>> {
	return api('events.seriesUpcoming', args, undefined, opts);
}

/**
 * All occurrences for a series, past + future (cursor-paginated).
 * Returns `{ data, pagination }` — see `fetchNearbyEvents` for details.
 */
export async function fetchSeriesRecurrings(
	args: SeriesPaginatedArgs,
	opts?: ApiCallOptions
): Promise<Paginated<EventRecurringResponse[]>> {
	return api('events.seriesRecurrings', args, undefined, opts);
}

/**
 * Event series template by UUID.
 * The `/kajian/[id]` route param is the series UUID — use this instead of
 * `fetchEventSeries` (which takes a slug) for that route.
 * Returns whatever `api()` unwraps from `envelope.data` — may be `undefined`
 * if the generated type marks the field optional.
 */
export async function fetchSeriesById(
	id: string,
	expand?: string,
	opts?: ApiCallOptions
): Promise<EventSeriesResponse | undefined> {
	return api('events.seriesById', { id, expand }, undefined, opts);
}

/**
 * List event series with filters (paginated).
 */
export async function fetchEventSeriesList(
	args: ListSeriesArgs,
	opts?: ApiCallOptions
): Promise<Paginated<EventSeriesResponse[]>> {
	return api('events.listSeries', args, undefined, opts);
}
