/**
 * Geolocation service — context-DI factory.
 *
 * Provides a `createLocation()` factory + `getLocation()` reader pair. The
 * service manages a center coordinate (default Cirebon, the pilot region),
 * geolocation permission state, and optional `localStorage` persistence of
 * the last known center.
 *
 * Conformance:
 *   - rule .claude/rules/state-management.md  (factory + getter, Symbol key, no singleton)
 *   - ADR docs/decisions/0001-svelte5-context-di.md
 */
import { getContext, setContext } from 'svelte';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default center: Cirebon, West Java — the pilot region. */
export const DEFAULT_CENTER = { lat: -6.732, lng: 108.5523 } as const;

const STORAGE_KEY = 'qarib:location:center';

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
	center = $state<{ lat: number; lng: number }>({ ...DEFAULT_CENTER });
	mode = $state<'gps' | 'default'>('default');
	granted = $state(false);
	requesting = $state(false);
	permission = $state<LocationPermissionState>('idle');

	private readonly _getPosition: GetPositionFn;

	constructor(getPosition?: GetPositionFn) {
		// Inject a custom getPosition for tests; fall back to the browser API.
		this._getPosition =
			getPosition ??
			((success, error) => {
				if (typeof navigator !== 'undefined' && navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(success, error);
				} else {
					error({ message: 'Geolocation is not available' });
				}
			});

		this._hydrateFromStorage();
	}

	/** Request GPS permission. On success, updates center + mode. On failure, keeps the default. */
	requestGps(): void {
		if (this.requesting) return;

		this.requesting = true;
		this.permission = 'requesting';

		this._getPosition(
			(pos) => {
				this.center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				this.granted = true;
				this.mode = 'gps';
				this.requesting = false;
				this.permission = 'granted';
				this._persistCenter(this.center);
			},
			(err) => {
				this.useDefaultCenter();
				this.permission = this._classifyPermissionError(err);
			}
		);
	}

	/** Keep or restore the pilot-region center without implying GPS was granted. */
	useDefaultCenter(): void {
		this.center = { ...DEFAULT_CENTER };
		this.mode = 'default';
		this.granted = false;
		this.requesting = false;
	}

	private _classifyPermissionError(err: {
		message: string;
		code?: number;
	}): LocationPermissionState {
		if (err.code === 1 || /denied|permission/i.test(err.message)) return 'denied';
		return 'unavailable';
	}

	private _hydrateFromStorage(): void {
		if (typeof window === 'undefined') return;
		try {
			const raw = window.localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as unknown;
			if (
				parsed &&
				typeof parsed === 'object' &&
				'lat' in parsed &&
				'lng' in parsed &&
				typeof (parsed as { lat: unknown }).lat === 'number' &&
				typeof (parsed as { lng: unknown }).lng === 'number' &&
				!Number.isNaN((parsed as { lat: number }).lat) &&
				!Number.isNaN((parsed as { lng: number }).lng)
			) {
				this.center = {
					lat: (parsed as { lat: number }).lat,
					lng: (parsed as { lng: number }).lng
				};
			}
		} catch {
			// Quota or privacy mode — silently ignore.
		}
	}

	private _persistCenter(center: { lat: number; lng: number }): void {
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(center));
		} catch {
			// Quota or privacy mode — silently ignore.
		}
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
			'LocationService not initialized. Call createLocation() in a parent layout or page.'
		);
	}
	return svc;
}
