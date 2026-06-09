import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	LOCATION_PREFERENCE_KEY,
	locationPreferenceSchema,
	LocationPreferenceService,
	type GpsPreference,
	type ManualPreference,
	type StagedChoice
} from './preference.svelte.js';

const LEGACY_KEY = 'qarib:location:center';

function stubWindow(storage?: Map<string, string>) {
	const store = storage ?? new Map<string, string>();
	Object.defineProperty(globalThis, 'window', {
		configurable: true,
		writable: true,
		value: {
			localStorage: {
				getItem: (key: string) => store.get(key) ?? null,
				setItem: (key: string, value: string) => {
					store.set(key, value);
				},
				removeItem: (key: string) => {
					store.delete(key);
				},
				clear: () => {
					store.clear();
				}
			}
		}
	});
	return store;
}

function removeWindow() {
	delete (globalThis as { window?: unknown }).window;
}

const validGps: GpsPreference = {
	version: 1,
	mode: 'gps',
	savedAt: '2026-06-10T08:00:00+07:00',
	coordinates: { lat: -6.9147, lng: 107.6098 }
};
const validManual: ManualPreference = {
	version: 1,
	mode: 'manual',
	savedAt: '2026-06-10T08:00:00+07:00',
	province: { id: '32', name: 'Jawa Barat' },
	city: { id: '3273', name: 'Kota Bandung' }
};

describe('locationPreferenceSchema', () => {
	it('parses valid GPS', () => {
		const p = locationPreferenceSchema.parse(validGps);
		expect(p.mode).toBe('gps');
		if (p.mode === 'gps') expect(p.coordinates.lat).toBe(-6.9147);
	});

	it('parses valid manual', () => {
		const p = locationPreferenceSchema.parse(validManual);
		expect(p.mode).toBe('manual');
		if (p.mode === 'manual') expect(p.city.name).toBe('Kota Bandung');
	});
});

describe('schema rejections', () => {
	it('rejects unknown version', () => {
		expect(() => locationPreferenceSchema.parse({ ...validGps, version: 2 })).toThrow();
	});
	it('rejects non-finite coordinates', () => {
		expect(() =>
			locationPreferenceSchema.parse({ ...validGps, coordinates: { lat: Infinity, lng: 0 } })
		).toThrow();
	});
	it('rejects out-of-range coordinates', () => {
		expect(() =>
			locationPreferenceSchema.parse({ ...validGps, coordinates: { lat: 91, lng: 0 } })
		).toThrow();
	});
	it('rejects blank province id', () => {
		expect(() =>
			locationPreferenceSchema.parse({ ...validManual, province: { id: '', name: 'Jawa Barat' } })
		).toThrow();
	});
	it('rejects blank city name', () => {
		expect(() =>
			locationPreferenceSchema.parse({ ...validManual, city: { id: '3273', name: '' } })
		).toThrow();
	});
	it('rejects malformed JSON', () => {
		stubWindow();
		try {
			window.localStorage.setItem(LOCATION_PREFERENCE_KEY, 'not-json');
			expect(new LocationPreferenceService().active).toBeNull();
		} finally {
			removeWindow();
		}
	});
	it('rejects missing savedAt', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { savedAt: _savedAt, ...rest } = validGps;
		expect(() => locationPreferenceSchema.parse(rest)).toThrow();
	});
});

describe('LocationPreferenceService', () => {
	beforeEach(() => stubWindow());
	afterEach(() => removeWindow());

	it('returns null when no preference', () => {
		expect(new LocationPreferenceService().active).toBeNull();
	});

	it('reads stored GPS preference', () => {
		window.localStorage.setItem(LOCATION_PREFERENCE_KEY, JSON.stringify(validGps));
		expect(new LocationPreferenceService().active).toEqual(validGps);
	});

	it('reads stored manual preference', () => {
		window.localStorage.setItem(LOCATION_PREFERENCE_KEY, JSON.stringify(validManual));
		expect(new LocationPreferenceService().active).toEqual(validManual);
	});

	it('writeActive replaces record', () => {
		const svc = new LocationPreferenceService();
		svc.writeActive(validGps);
		expect(svc.active).toEqual(validGps);
		expect(JSON.parse(window.localStorage.getItem(LOCATION_PREFERENCE_KEY)!)).toEqual(validGps);
	});

	it('commitStaged builds GPS', () => {
		const svc = new LocationPreferenceService();
		const pref = svc.commitStaged({ mode: 'gps', coordinates: { lat: -6.2, lng: 106.8 } });
		expect(pref.mode).toBe('gps');
		if (pref.mode === 'gps') expect(pref.coordinates.lat).toBe(-6.2);
		expect(pref.savedAt).toBeTruthy();
		expect(svc.active).toEqual(pref);
	});

	it('commitStaged builds manual', () => {
		const svc = new LocationPreferenceService();
		const staged: StagedChoice = {
			mode: 'manual',
			province: { id: '32', name: 'Jawa Barat' },
			city: { id: '3273', name: 'Kota Bandung' }
		};
		const pref = svc.commitStaged(staged);
		expect(pref.mode).toBe('manual');
		if (pref.mode === 'manual') expect(pref.city.name).toBe('Kota Bandung');
		expect(svc.active).toEqual(pref);
	});

	it('summarises GPS', () => {
		const svc = new LocationPreferenceService();
		svc.writeActive(validGps);
		expect(svc.summary()).toBe('GPS');
	});

	it('summarises manual', () => {
		const svc = new LocationPreferenceService();
		svc.writeActive(validManual);
		expect(svc.summary()).toBe('Kota Bandung, Jawa Barat');
	});

	it('empty summary when no preference', () => {
		expect(new LocationPreferenceService().summary()).toBe('');
	});
});

describe('legacy key cleanup', () => {
	beforeEach(() => stubWindow());
	afterEach(() => removeWindow());

	it('removes legacy key on construction', () => {
		window.localStorage.setItem(LEGACY_KEY, JSON.stringify({ lat: 1, lng: 2 }));
		new LocationPreferenceService();
		expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
	});

	it('does not promote legacy data', () => {
		window.localStorage.setItem(LEGACY_KEY, JSON.stringify({ lat: 1, lng: 2 }));
		const svc = new LocationPreferenceService();
		expect(svc.active).toBeNull();
		expect(window.localStorage.getItem(LOCATION_PREFERENCE_KEY)).toBeNull();
	});
});

describe('staged choice isolation', () => {
	beforeEach(() => stubWindow());
	afterEach(() => removeWindow());

	it('keeps active unchanged until commitStaged', () => {
		window.localStorage.setItem(LOCATION_PREFERENCE_KEY, JSON.stringify(validGps));
		const svc = new LocationPreferenceService();
		expect(svc.active).toEqual(validGps);

		const staged: StagedChoice = {
			mode: 'manual',
			province: { id: '32', name: 'Jawa Barat' },
			city: { id: '3273', name: 'Kota Bandung' }
		};
		svc.stageChoice(staged);
		expect(svc.active).toEqual(validGps);

		svc.commitStaged(staged);
		expect(svc.active?.mode).toBe('manual');
	});
});
