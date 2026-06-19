import { afterEach, describe, expect, it } from 'vitest';
import {
	dateModeToInitialPinDay,
	dateRangeForMode,
	selectedIsoForMode,
	type PetaDateSelection
} from './date-mode.js';

const ORIGINAL_TZ = process.env.TZ;
const TODAY = '2026-06-19';

afterEach(() => {
	process.env.TZ = ORIGINAL_TZ;
});

function selection(mode: PetaDateSelection['mode'], customDate: string | null = null) {
	return { mode, customDate };
}

describe('selectedIsoForMode', () => {
	it('uses today for today mode', () => {
		expect(selectedIsoForMode(TODAY, selection('today'))).toBe('2026-06-19');
	});

	it('uses the next local day for tomorrow mode', () => {
		expect(selectedIsoForMode(TODAY, selection('tomorrow'))).toBe('2026-06-20');
	});

	it('uses today as the anchor for week mode', () => {
		expect(selectedIsoForMode(TODAY, selection('week'))).toBe('2026-06-19');
	});

	it('uses the custom date for custom mode', () => {
		expect(selectedIsoForMode(TODAY, selection('custom', '2026-06-23'))).toBe('2026-06-23');
	});
});

describe('dateRangeForMode', () => {
	it('uses a one-day local range for today mode', () => {
		process.env.TZ = 'Asia/Jakarta';

		expect(dateRangeForMode(TODAY, selection('today'))).toEqual({
			date_from: '2026-06-19T00:00:00+07:00',
			date_to: '2026-06-19T23:59:59+07:00'
		});
	});

	it('uses a one-day local range for tomorrow mode', () => {
		process.env.TZ = 'Asia/Jakarta';

		expect(dateRangeForMode(TODAY, selection('tomorrow'))).toEqual({
			date_from: '2026-06-20T00:00:00+07:00',
			date_to: '2026-06-20T23:59:59+07:00'
		});
	});

	it('uses today through today plus seven days for week mode', () => {
		process.env.TZ = 'Asia/Jakarta';

		expect(dateRangeForMode(TODAY, selection('week'))).toEqual({
			date_from: '2026-06-19T00:00:00+07:00',
			date_to: '2026-06-26T23:59:59+07:00'
		});
	});

	it('uses a one-day local range for custom mode', () => {
		process.env.TZ = 'Asia/Jakarta';

		expect(dateRangeForMode(TODAY, selection('custom', '2026-06-23'))).toEqual({
			date_from: '2026-06-23T00:00:00+07:00',
			date_to: '2026-06-23T23:59:59+07:00'
		});
	});
});

describe('dateModeToInitialPinDay', () => {
	it('defaults today, custom, and empty week modes to the today chip', () => {
		expect(dateModeToInitialPinDay('today')).toBe('today');
		expect(dateModeToInitialPinDay('custom')).toBe('today');
		expect(dateModeToInitialPinDay('week')).toBe('today');
	});

	it('maps tomorrow mode to the tomorrow chip', () => {
		expect(dateModeToInitialPinDay('tomorrow')).toBe('tomorrow');
	});

	it('maps week mode to the first non-empty bucket when counts are known', () => {
		expect(dateModeToInitialPinDay('week', { today: 0, tomorrow: 2, week: 3 })).toBe('tomorrow');
		expect(dateModeToInitialPinDay('week', { today: 0, tomorrow: 0, week: 3 })).toBe('week');
		expect(dateModeToInitialPinDay('week', { today: 1, tomorrow: 2, week: 3 })).toBe('today');
	});
});
