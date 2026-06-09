/**
 * Geolocation service — context-DI factory.
 *
 * Provides a `createLocation()` factory + `getLocation()` reader pair. The
 * service manages the runtime GPS permission request; persisted location
 * preferences are handled by the co-located `LocationPreferenceService`
 * (preference.ts).
 *
 * On GPS denial or unavailability this service sets the permission state
 * and does NOT silently select a default region.  The consumer (onboarding
 * page) is responsible for guiding the visitor toward a manual choice.
 *
 * Conformance:
 *   - rule .claude/rules/state-management.md  (factory + getter, Symbol key, no singleton)
 *   - ADR docs/decisions/0001-svelte5-context-di.md
 *   - docs/plans/location-onboarding-settings.md § "First-run flow"
 */
import { getContext, setContext } from 'svelte';

// ---------------------------------------------------------------------------
// Re-exports — versioned preference & return-to normalisation
// ---------------------------------------------------------------------------

export {
	createLocationPreference,
	getLocationPreference,
	type LocationPreference,
	type GpsPreference,
	type ManualPreference,
	type StagedChoice,
	type Coordinates,
	type RegionRef,
	type GpsRadius,
	GPS_RADIUS_VALUES,
	LOCATION_PREFERENCE_KEY
} from './preference.svelte.js';

export { normaliseReturnTo, DEFAULT_RETURN_TO } from './return-to.js';

// ---------------------------------------------------------------------------
// Context key (module-local — never exported)
// ---------------------------------------------------------------------------

const KEY = Symbol('location');

// ---------------------------------------------------------------------------
// Dep injection type (enables testing without navigator.geolocation)
// ---------------------------------------------------------------------------

export type GetPositionFn = (
	success: (pos: { coords: { latitude: number; longitude: number } }) => void,
	error: (err: { message: string; code?: number }) => void
) => void;

export type LocationPermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

export class LocationService {
	center = $state<{ lat: number; lng: number } | null>(null);
	granted = $state(false);
	requesting = $state(false);
	permission = $state<LocationPermissionState>('idle');

	private readonly _getPosition: GetPositionFn;

	constructor(getPosition?: GetPositionFn) {
		this._getPosition =
			getPosition ??
			((success, error) => {
				if (typeof navigator !== 'undefined' && navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(success, error);
				} else {
					error({ message: 'Geolocation is not available' });
				}
			});
	}

	/** Request GPS permission. On success updates center. On denial does NOT silently select a default. */
	requestGps(): void {
		if (this.requesting) return;

		this.requesting = true;
		this.permission = 'requesting';

		this._getPosition(
			(pos) => {
				this.center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				this.granted = true;
				this.requesting = false;
				this.permission = 'granted';
			},
			(err) => {
				this.center = null;
				this.granted = false;
				this.requesting = false;
				this.permission = this._classifyPermissionError(err);
			}
		);
	}

	// -------------------------------------------------------------------
	// Internal
	// -------------------------------------------------------------------

	private _classifyPermissionError(err: {
		message: string;
		code?: number;
	}): LocationPermissionState {
		if (err.code === 1 || /denied|permission/i.test(err.message)) return 'denied';
		return 'unavailable';
	}
}

// ---------------------------------------------------------------------------
// Context-DI exports
// ---------------------------------------------------------------------------

/**
 * Instantiate the location service and register it in Svelte context.
 * Call once from the layout or page that owns its lifetime.
 *
 * @param getPosition - Optional injectable geolocation function for testing.
 */
export function createLocation(getPosition?: GetPositionFn): LocationService {
	const svc = new LocationService(getPosition);
	setContext(KEY, svc);
	return svc;
}

/**
 * Retrieve the location service from Svelte context.
 * Must be called inside a component that has `createLocation()` in an ancestor.
 *
 * @throws {Error} when called outside an initialized context.
 */
export function getLocation(): LocationService {
	const svc = getContext<LocationService | undefined>(KEY);
	if (!svc) {
		throw new Error(
			'LocationService not initialised. Call createLocation() in a parent layout or page.'
		);
	}
	return svc;
}
