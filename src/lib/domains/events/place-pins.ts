/**
 * place-pins — group event occurrences by place and derive a single map pin
 * per mosque.
 *
 * The map shows one pin per place (mosque), not one per occurrence. This
 * helper takes a flat list of nearby occurrences, groups by place.id, and
 * emits a MapPlacePin for each place where:
 *   - `tier` is the most urgent tier among that place's occurrences
 *     (now > soon > today > later).
 *   - `label` encodes urgency: caller-supplied `labels.now` for now-tier,
 *     caller-supplied `labels.later` for later-tier, or HH:mm of the
 *     most-urgent occurrence's date_start otherwise.
 *
 * i18n: hardcoded 'NOW'/'Besok' are NOT used here. The caller resolves the
 * Paraglide message keys (pin_label_now / pin_label_later) and passes them in
 * via the `labels` parameter. Rule: .claude/rules/i18n.md.
 *
 * Conformance:
 *   - rule .claude/rules/architecture.md  (pure helper in domains/events/)
 *   - rule .claude/rules/i18n.md          (no hardcoded user-facing strings)
 */
import type { EventRecurringResponseWithPlace } from './schema.js';
import { deriveTier } from './pin-tier.js';
import type { PinTier } from './pin-tier.js';
import { formatTime } from '$lib/shared/utils/date.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MapPlacePin {
	id: string;
	lat: number;
	lng: number;
	tier: PinTier;
	label: string;
}

export interface FuturePlaceSuggestion {
	id: string;
	name: string;
	address: string;
	count: number;
	nextLabel: string;
}

interface NearbyPlaceCoordinates {
	id?: string | null;
	lat?: number | null;
	lng?: number | null;
}

/** Caller-supplied i18n labels for the two special pin tiers. */
export interface PinLabels {
	/** Displayed on now-tier pins (e.g. m.pin_label_now()). */
	now: string;
	/** Displayed on later-tier pins (e.g. m.pin_label_later()). */
	later: string;
}

// ---------------------------------------------------------------------------
// Tier ordering (lower index = more urgent)
// ---------------------------------------------------------------------------

const TIER_ORDER: PinTier[] = ['now', 'soon', 'today', 'later'];

function mostUrgentTier(tiers: PinTier[]): PinTier {
	for (const t of TIER_ORDER) {
		if (tiers.includes(t)) return t;
	}
	return 'later';
}

function tierLabel(tier: PinTier, dateStart: string, labels: PinLabels): string {
	if (tier === 'now') return labels.now;
	if (tier === 'later') return labels.later;
	return formatTime(dateStart);
}

function localizedName(value: Record<string, string> | string | null | undefined): string {
	if (!value) return '';
	if (typeof value === 'string') return value;
	return value.id ?? Object.values(value)[0] ?? '';
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Group a flat occurrence list by place.id and return one MapPlacePin per place.
 *
 * Occurrences without a valid place (no id, no numeric lat/lng) are silently
 * excluded.
 *
 * @param events  Flat occurrence list (from the nearby infinite query pages).
 * @param labels  Caller-supplied i18n strings for special pin tiers. Pass
 *                `{ now: m.pin_label_now(), later: m.pin_label_later() }` from
 *                the consuming component. Defaults to English fallbacks.
 * @param now     Reference instant for tier derivation. Defaults to `new Date()`.
 *                Inject a fixed date in tests for determinism.
 */
export function groupOccurrencesToPlacePins(
	events: EventRecurringResponseWithPlace[],
	labels: PinLabels = { now: 'NOW', later: 'Besok' },
	now: Date = new Date()
): MapPlacePin[] {
	// Map: placeId → { lat, lng, occurrences [{tier, dateStart}] }
	const byPlace = new Map<
		string,
		{
			lat: number;
			lng: number;
			name: string;
			occurrences: Array<{ tier: PinTier; dateStart: string }>;
		}
	>();

	for (const e of events) {
		const place = e.place;
		if (
			!place?.id ||
			typeof place.lat !== 'number' ||
			typeof place.lng !== 'number' ||
			isNaN(place.lat) ||
			isNaN(place.lng) ||
			!e.date_start
		) {
			continue;
		}

		const placeId = place.id;
		let entry = byPlace.get(placeId);
		if (!entry) {
			const rawName = place.name;
			const name =
				rawName && typeof rawName === 'object'
					? (rawName['id'] ?? Object.values(rawName)[0] ?? '')
					: '';
			entry = { lat: place.lat, lng: place.lng, name, occurrences: [] };
			byPlace.set(placeId, entry);
		}
		entry.occurrences.push({
			tier: deriveTier(e.date_start, now),
			dateStart: e.date_start
		});
	}

	const pins: MapPlacePin[] = [];
	for (const [placeId, { lat, lng, occurrences }] of byPlace) {
		const tiers = occurrences.map((o) => o.tier);
		const tier = mostUrgentTier(tiers);
		// Find the occurrence matching the most urgent tier for the label.
		const representative = occurrences.find((o) => o.tier === tier) ?? occurrences[0];
		pins.push({
			id: placeId,
			lat,
			lng,
			tier,
			label: tierLabel(tier, representative.dateStart, labels)
		});
	}

	return pins;
}

/**
 * Group future fallback occurrences by place and count unique event series.
 *
 * `events.nearby` returns occurrences. A weekly kajian can therefore appear
 * multiple times in a future range; UI copy should say "1 kajian", not "4
 * kajian", when those rows belong to the same series.
 */
export function groupFuturePlaces(
	items: EventRecurringResponseWithPlace[],
	formatDate: (isoDate: string) => string
): FuturePlaceSuggestion[] {
	const byPlace = new Map<
		string,
		{
			name: string;
			address: string;
			dates: string[];
			seriesIds: Set<string>;
		}
	>();

	for (const event of items) {
		if (!event.place?.id || !event.date_start) continue;
		const existing = byPlace.get(event.place.id);
		const seriesId =
			typeof event.event_id === 'string' && event.event_id.trim() !== ''
				? event.event_id
				: String(event.id);
		if (existing) {
			existing.dates.push(event.date_start);
			existing.seriesIds.add(seriesId);
			continue;
		}
		byPlace.set(event.place.id, {
			name: localizedName(event.place.name),
			address: event.place.address ?? '',
			dates: [event.date_start],
			seriesIds: new Set([seriesId])
		});
	}

	return [...byPlace.entries()]
		.map(([id, place]) => {
			const sortedDates = place.dates.toSorted(
				(a, b) => new Date(a).getTime() - new Date(b).getTime()
			);
			return {
				id,
				name: place.name,
				address: place.address,
				count: place.seriesIds.size,
				nextLabel: sortedDates[0] ? formatDate(sortedDates[0].slice(0, 10)) : ''
			};
		})
		.slice(0, 4);
}

/**
 * Add nearby places without today occurrences as muted map pins.
 *
 * Event pins win when a place has today's event data. Place-only pins let users
 * discover mosques without implying that an upcoming event has been proven.
 */
export function mergeNearbyPlacesWithEventPins(
	eventPins: MapPlacePin[],
	places: NearbyPlaceCoordinates[],
	placeLabel: string
): MapPlacePin[] {
	const pins = [...eventPins];
	const pinnedPlaceIds = new Set(eventPins.map((pin) => pin.id));

	for (const place of places) {
		if (!place.id || pinnedPlaceIds.has(place.id)) continue;
		const lat = place.lat;
		const lng = place.lng;
		if (
			typeof lat !== 'number' ||
			typeof lng !== 'number' ||
			Number.isNaN(lat) ||
			Number.isNaN(lng)
		) {
			continue;
		}
		pins.push({
			id: place.id,
			lat,
			lng,
			tier: 'later',
			label: placeLabel
		});
	}

	return pins;
}
