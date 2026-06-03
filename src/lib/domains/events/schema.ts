/**
 * Events domain — schema, types, and Zod trust-boundary parsers.
 *
 * Re-exports generated occurrence/series types and adds:
 *   - `EventStatus` numeric enum map (matches upstream API contract).
 *   - Pure status helpers: `isUpcoming`, `statusKey`.
 *   - A Zod parser for nearby items at the trust boundary (validates
 *     the expanded `place` shape needed for map pins).
 *
 * Conformance:
 *   - rule .claude/rules/architecture.md   (schema.ts in domains/<name>/)
 *   - rule .claude/rules/api-contract.md   (Zod at trust boundaries)
 */
import { z } from 'zod';
import type { components } from '$generated/upstream';

// ---------------------------------------------------------------------------
// Re-exported generated types
// ---------------------------------------------------------------------------

export type EventRecurringResponse = components['schemas']['EventRecurringResponse'];
export type EventSeriesResponse = components['schemas']['EventSeriesResponse'];

// ---------------------------------------------------------------------------
// Status enum
// ---------------------------------------------------------------------------

/** Numeric status codes as defined by the upstream API contract. */
export const EventStatus = {
	Incoming: 0,
	Ongoing: 1,
	Cancelled: 10,
	Rescheduled: 11,
	Completed: 99
} as const;

export type EventStatusValue = (typeof EventStatus)[keyof typeof EventStatus];

/** Reverse map: numeric status → a stable string key (for i18n lookups). */
const STATUS_KEYS: Record<number, string> = {
	[EventStatus.Incoming]: 'incoming',
	[EventStatus.Ongoing]: 'ongoing',
	[EventStatus.Cancelled]: 'cancelled',
	[EventStatus.Rescheduled]: 'rescheduled',
	[EventStatus.Completed]: 'completed'
};

/**
 * Return the stable string key for a status integer.
 * Falls back to `'unknown'` for values not in the enum.
 */
export function statusKey(status: number | undefined): string {
	if (status === undefined) return 'unknown';
	return STATUS_KEYS[status] ?? 'unknown';
}

/**
 * True when the occurrence is in a state that a user should consider
 * attending (Incoming or Ongoing).
 */
export function isUpcoming(status: number | undefined): boolean {
	return status === EventStatus.Incoming || status === EventStatus.Ongoing;
}

// ---------------------------------------------------------------------------
// Zod parsers (trust boundary — nearby items with expanded place)
// ---------------------------------------------------------------------------

/**
 * Zod schema for the expanded place shape on a nearby occurrence.
 * The `PlaceResponse` type from upstream allows nullable lat/lng; we require
 * them here because pins without coordinates are unusable for the map.
 */
const ExpandedPlaceSchema = z.object({
	id: z.string().optional(),
	slug: z.string().optional(),
	name: z.record(z.string(), z.string()).optional(),
	address: z.string().nullable().optional(),
	lat: z.number(),
	lng: z.number()
});

export type ExpandedPlace = z.infer<typeof ExpandedPlaceSchema>;

/**
 * Zod schema for a single nearby occurrence item.
 * Validates the fields the map and list depend on; unknown extra fields pass through.
 */
export const NearbyEventSchema = z.object({
	id: z.number(),
	event_id: z.string().optional(),
	name: z.record(z.string(), z.string()).nullable().optional(),
	date_start: z.string(),
	date_end: z.string().nullable().optional(),
	status: z.number().optional(),
	going_count: z.number().optional(),
	distance_km: z.number().nullable().optional(),
	place_id: z.string().nullable().optional(),
	asatidz_id: z.string().nullable().optional(),
	place: ExpandedPlaceSchema.nullable().optional()
});

export type NearbyEvent = z.infer<typeof NearbyEventSchema>;

/**
 * `EventRecurringResponse` with the expanded place shape guaranteed present
 * and valid (lat + lng are numbers). Used by the map-pin derivation in
 * `/peta` to avoid repeated inline intersection casts.
 *
 * Only valid after the `.filter()` guard that checks `place.lat`/`place.lng`.
 */
export type EventRecurringResponseWithPlace = EventRecurringResponse & {
	id: number;
	date_start: string;
	place: ExpandedPlace;
};

/**
 * Parse an array of raw nearby occurrence items.
 * Throws a `ZodError` when any item fails validation.
 */
export function parseNearbyEvents(raw: unknown[]): NearbyEvent[] {
	return raw.map((item) => NearbyEventSchema.parse(item));
}
