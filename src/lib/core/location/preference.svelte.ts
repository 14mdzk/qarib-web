/**
 * Versioned client-storage location preference.
 *
 * Read, write, and staged-replacement APIs for the single active
 * `qarib:location-preference` record. Parsing is done with Zod at the
 * storage boundary; unknown versions and invalid shapes are rejected.
 *
 * Conformance:
 *   - docs/plans/location-onboarding-settings.md § "Persistence and privacy"
 *   - rule .claude/rules/state-management.md (factory + getter, no singleton)
 */
import { getContext, setContext } from 'svelte';
import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LOCATION_PREFERENCE_KEY = 'qarib:location-preference';

/** Legacy unversioned key removed on first initialisation. */
const LEGACY_KEY = 'qarib:location:center';

const GPS_RADIUS_VALUES = [10, 15, 25, 40, 60] as const;

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const coordinatesSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180)
});

const regionRefSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	coordinates: coordinatesSchema.optional()
});

const gpsPreferenceSchema = z.object({
	version: z.literal(1),
	mode: z.literal('gps'),
	savedAt: z.string().min(1),
	coordinates: coordinatesSchema
});

const manualPreferenceSchema = z.object({
	version: z.literal(1),
	mode: z.literal('manual'),
	savedAt: z.string().min(1),
	province: regionRefSchema,
	city: regionRefSchema
});

export const locationPreferenceSchema = z.discriminatedUnion('mode', [
	gpsPreferenceSchema,
	manualPreferenceSchema
]);

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type Coordinates = z.infer<typeof coordinatesSchema>;
export type RegionRef = z.infer<typeof regionRefSchema>;
export type GpsPreference = z.infer<typeof gpsPreferenceSchema>;
export type ManualPreference = z.infer<typeof manualPreferenceSchema>;
export type LocationPreference = z.infer<typeof locationPreferenceSchema>;

export type GpsRadius = (typeof GPS_RADIUS_VALUES)[number];

export { GPS_RADIUS_VALUES };

// ---------------------------------------------------------------------------
// Staged choice (used during onboarding before completion)
// ---------------------------------------------------------------------------

export type StagedChoice =
	| { mode: 'gps'; coordinates: Coordinates }
	| { mode: 'manual'; province: RegionRef; city: RegionRef };

// ---------------------------------------------------------------------------
// Context key
// ---------------------------------------------------------------------------

const KEY = Symbol('location-preference');

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

export class LocationPreferenceService {
	/** The single active preference, or null when none is stored. */
	active = $state<LocationPreference | null>(null);

	constructor() {
		if (typeof window !== 'undefined') {
			this._removeLegacyKey();
			this.active = this._readActive();
		}
	}

	// -----------------------------------------------------------------------
	// Public API
	// -----------------------------------------------------------------------

	/**
	 * Parse the active record from local storage. Returns null when the key
	 * is absent, the stored value is malformed, or the schema rejects it.
	 */
	private _readActive(): LocationPreference | null {
		try {
			const raw = window.localStorage.getItem(LOCATION_PREFERENCE_KEY);
			if (!raw) return null;
			const parsed = locationPreferenceSchema.parse(JSON.parse(raw));
			return parsed;
		} catch {
			return null;
		}
	}

	/**
	 * Write (or replace) the active preference record.  Callers MUST have
	 * already validated the payload against the schema.
	 */
	writeActive(pref: LocationPreference): void {
		window.localStorage.setItem(LOCATION_PREFERENCE_KEY, JSON.stringify(pref));
		this.active = pref;
	}

	/** Stage a new choice without mutating the active record. */
	stageChoice(choice: StagedChoice): StagedChoice {
		return choice;
	}

	/**
	 * Build a complete preference from a staged choice and commit it as the
	 * single active record.  Call this only after the completion server
	 * action has succeeded.
	 */
	commitStaged(choice: StagedChoice): LocationPreference {
		console.warn('WHAT IS THIS', choice);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const savedAt = new Date().toISOString();
		let pref: LocationPreference;

		if (choice.mode === 'gps') {
			pref = { version: 1, mode: 'gps', savedAt, coordinates: choice.coordinates };
		} else {
			pref = {
				version: 1,
				mode: 'manual',
				savedAt,
				province: choice.province,
				city: choice.city
			};
		}

		this.writeActive(pref);
		return pref;
	}

	/** Return a human-readable summary for the current active preference. */
	summary(): string {
		const a = this.active;
		if (!a) return '';
		if (a.mode === 'gps') return 'GPS';
		return `${a.city.name}, ${a.province.name}`;
	}

	// -----------------------------------------------------------------------
	// Internal helpers
	// -----------------------------------------------------------------------

	/** Remove the legacy unversioned key once, without promoting its value. */
	private _removeLegacyKey(): void {
		try {
			if (window.localStorage.getItem(LEGACY_KEY) !== null) {
				window.localStorage.removeItem(LEGACY_KEY);
			}
		} catch {
			// Storage unavailable — nothing to remove.
		}
	}
}

// ---------------------------------------------------------------------------
// Context-DI exports
// ---------------------------------------------------------------------------

export function createLocationPreference(): LocationPreferenceService {
	const svc = new LocationPreferenceService();
	setContext(KEY, svc);
	return svc;
}

export function getLocationPreference(): LocationPreferenceService {
	const svc = getContext<LocationPreferenceService | undefined>(KEY);
	if (!svc) {
		throw new Error(
			'LocationPreferenceService not initialised. Call createLocationPreference() in a parent layout.'
		);
	}
	return svc;
}
