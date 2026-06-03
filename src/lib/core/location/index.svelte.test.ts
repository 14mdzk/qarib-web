/**
 * Unit tests for the LocationService factory.
 *
 * The service is tested by injecting a stub `getPosition` dep so no
 * browser API is needed. Context (setContext/getContext) is not exercised
 * here — that path is a thin wrapper over the class.
 *
 * Conformance: rule .claude/rules/testing.md (factory tested with stub deps).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
	LocationService,
	DEFAULT_CENTER,
	getLocation,
	type GetPositionFn
} from './index.svelte.js';

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
		error({ message: 'User denied Geolocation' });
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
		// Default construction with a never-resolving stub (no browser API called).
		svc = new LocationService(makeNeverGetPosition());
	});

	it('starts with the Cirebon default center', () => {
		expect(svc.center.lat).toBeCloseTo(DEFAULT_CENTER.lat, 3);
		expect(svc.center.lng).toBeCloseTo(DEFAULT_CENTER.lng, 3);
	});

	it('starts with mode=default, granted=false, requesting=false', () => {
		expect(svc.mode).toBe('default');
		expect(svc.granted).toBe(false);
		expect(svc.requesting).toBe(false);
	});

	it('sets requesting=true while GPS request is in flight', () => {
		const svc2 = new LocationService(makeNeverGetPosition());
		svc2.requestGps();
		expect(svc2.requesting).toBe(true);
	});

	it('updates center + mode + granted on GPS success', () => {
		const svc2 = new LocationService(makeSuccessGetPosition(-6.9, 107.6));
		svc2.requestGps();
		expect(svc2.center.lat).toBeCloseTo(-6.9, 4);
		expect(svc2.center.lng).toBeCloseTo(107.6, 4);
		expect(svc2.mode).toBe('gps');
		expect(svc2.granted).toBe(true);
		expect(svc2.requesting).toBe(false);
	});

	it('keeps default center on GPS denial', () => {
		const svc2 = new LocationService(makeDenyGetPosition());
		svc2.requestGps();
		expect(svc2.center.lat).toBeCloseTo(DEFAULT_CENTER.lat, 3);
		expect(svc2.center.lng).toBeCloseTo(DEFAULT_CENTER.lng, 3);
		expect(svc2.mode).toBe('default');
		expect(svc2.granted).toBe(false);
		expect(svc2.requesting).toBe(false);
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
		// In Svelte 5, getContext() throws lifecycle_outside_component when called
		// outside a component — before our custom guard message can be reached.
		// We assert that *some* error is thrown (the contract: do not silently return).
		expect(() => getLocation()).toThrow();
	});
});
