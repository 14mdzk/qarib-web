import { addIsoDateDays, toDateRange } from '$lib/shared/utils/date.js';

export type PetaDateMode = 'today' | 'tomorrow' | 'week' | 'custom';
export type PinDay = 'today' | 'tomorrow' | 'week';

export interface PetaDateSelection {
	mode: PetaDateMode;
	customDate: string | null;
}

export interface PinDayCounts {
	today: number;
	tomorrow: number;
	week: number;
}

export function selectedIsoForMode(todayIso: string, selection: PetaDateSelection): string {
	if (selection.mode === 'tomorrow') return addIsoDateDays(todayIso, 1);
	if (selection.mode === 'custom' && selection.customDate) return selection.customDate;
	return todayIso;
}

export function dateRangeForMode(
	todayIso: string,
	selection: PetaDateSelection
): { date_from: string; date_to: string } {
	const startIso = selectedIsoForMode(todayIso, selection);
	const endIso = selection.mode === 'week' ? addIsoDateDays(todayIso, 7) : startIso;
	const start = toDateRange(startIso);
	const end = toDateRange(endIso);
	return { date_from: start.date_from, date_to: end.date_to };
}

export function dateModeToInitialPinDay(mode: PetaDateMode, counts?: PinDayCounts): PinDay {
	if (mode === 'tomorrow') return 'tomorrow';
	if (mode === 'week' && counts) {
		if (counts.today > 0) return 'today';
		if (counts.tomorrow > 0) return 'tomorrow';
		if (counts.week > 0) return 'week';
	}
	return 'today';
}
