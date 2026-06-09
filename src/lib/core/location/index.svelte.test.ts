/**
 * Unit tests for the LocationService factory.
 *
 * The service is tested by injecting a stub `getPosition` dep so no
 * browser API is needed. Context (setContext/getContext) is not exercised
 * here — that path is a thin wrapper over the class.
 *
 * Conformance:
 *   - rule .claude/rules/testing.md (factory tested with stub deps)
 *   - docs/plans/location-onboarding-settings.md § "First-run flow"
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { LocationService, getLocation, type GetPositionFn } from './index.svelte.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSuccessGetPosition(lat: number, lng: number): GetPositionFn {
	return (success) => {
		success({ coords: { latitude: lat, longitude: lng } });
	};
}

function makeDenyGetPosition(): GetPositionFn {
	return (_, error) => {
		error({ message: 'User denied Geolocation', code: 1 });
	};
}

function makeUnavailableGetPosition(): GetPositionFn {
	return (_, error) => {
		error({ message: 'Position unavailable', code: 2 });
	};
}

function makeNeverGetPosition(): GetPositionFn {
	return () => {
		// Never resolves — simulates pending prompt.
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LocationService', () => {
	let svc: LocationService;

	beforeEach(() => {
		svc = new LocationService(makeNeverGetPosition());
	});

	it('starts with null center (no default)', () => {
		expect(svc.center).toBeNull();
	});

	it('starts with granted=false, requesting=false, permission=idle', () => {
		expect(svc.granted).toBe(false);
		expect(svc.requesting).toBe(false);
		expect(svc.permission).toBe('idle');
	});

	it('sets requesting=true while GPS request is in flight', () => {
		const svc2 = new LocationService(makeNeverGetPosition());
		svc2.requestGps();
		expect(svc2.requesting).toBe(true);
		expect(svc2.permission).toBe('requesting');
	});

	it('updates center + granted on GPS success', () => {
		const svc2 = new LocationService(makeSuccessGetPosition(-6.9, 107.6));
		svc2.requestGps();
		expect(svc2.center!.lat).toBeCloseTo(-6.9, 4);
		expect(svc2.center!.lng).toBeCloseTo(107.6, 4);
		expect(svc2.granted).toBe(true);
		expect(svc2.requesting).toBe(false);
		expect(svc2.permission).toBe('granted');
	});

	it('sets center to null and marks permission denied on GPS denial (no default fallback)', () => {
		const svc2 = new LocationService(makeDenyGetPosition());
		svc2.requestGps();
		expect(svc2.center).toBeNull();
		expect(svc2.granted).toBe(false);
		expect(svc2.requesting).toBe(false);
		expect(svc2.permission).toBe('denied');
	});

	it('marks permission unavailable when geolocation fails without denial semantics', () => {
		const svc2 = new LocationService(makeUnavailableGetPosition());
		svc2.requestGps();
		expect(svc2.permission).toBe('unavailable');
		expect(svc2.center).toBeNull();
		expect(svc2.granted).toBe(false);
	});

	it('does not re-enter if already requesting', () => {
		let callCount = 0;
		const stuckSvc = new LocationService(() => {
			callCount++;
		});
		stuckSvc.requestGps();
		stuckSvc.requestGps(); // second call should be ignored
		expect(callCount).toBe(1);
	});
});

describe('getLocation', () => {
	it('throws when called outside a createLocation() context', () => {
		expect(() => getLocation()).toThrow();
	});
});
