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
