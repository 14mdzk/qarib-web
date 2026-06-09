import { m } from '$core/i18n';

export const QARIB_TIME_ZONE = 'Asia/Jakarta';
const QARIB_UTC_OFFSET = '+07:00';

function isoFromUtcDate(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function isoDateParts(dateStr: string): [year: number, month: number, day: number] {
	const [year, month, day] = dateStr.split('-').map(Number);
	return [year, month, day];
}

export function formatDate(dateStr: string): string {
	return new Intl.DateTimeFormat('id-ID', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(new Date(dateStr));
}

export function formatTime(dateStr: string): string {
	const d = new Date(dateStr);
	const hh = String(d.getHours()).padStart(2, '0');
	const mm = String(d.getMinutes()).padStart(2, '0');
	return `${hh}:${mm}`;
}

export function formatDistance(km: number): string {
	if (km < 1) {
		return `${Math.round(km * 1000)} m`;
	}
	return `${km.toFixed(1)} km`;
}

export function toLocalIsoDate(date: Date): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: QARIB_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);
	const year = parts.find((part) => part.type === 'year')?.value ?? '';
	const month = parts.find((part) => part.type === 'month')?.value ?? '';
	const day = parts.find((part) => part.type === 'day')?.value ?? '';
	return `${year}-${month}-${day}`;
}

export function addIsoDateDays(dateStr: string, days: number): string {
	const [year, month, day] = isoDateParts(dateStr);
	return isoFromUtcDate(new Date(Date.UTC(year, month - 1, day + days, 12)));
}

export function shiftCalendarMonth(dateStr: string, delta: number): string {
	const [year, month] = isoDateParts(dateStr);
	return isoFromUtcDate(new Date(Date.UTC(year, month - 1 + delta, 1, 12)));
}

export function formatIsoDate(
	dateStr: string,
	options: Intl.DateTimeFormatOptions,
	locale = 'id-ID'
): string {
	return new Intl.DateTimeFormat(locale, {
		...options,
		timeZone: QARIB_TIME_ZONE
	}).format(new Date(`${dateStr}T12:00:00Z`));
}

export function getWeekdayLabels(locale = 'id-ID'): string[] {
	return Array.from({ length: 7 }, (_, index) =>
		formatIsoDate(addIsoDateDays('2026-01-04', index), { weekday: 'short' }, locale).replace(
			/\.$/,
			''
		)
	);
}

export function toDateRange(dateStr: string): { date_from: string; date_to: string } {
	return {
		date_from: `${dateStr}T00:00:00${QARIB_UTC_OFFSET}`,
		date_to: `${dateStr}T23:59:59${QARIB_UTC_OFFSET}`
	};
}

export function getRelativeDateLabel(dateStr: string, now: Date = new Date()): string {
	const date = new Date(dateStr);
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const time = formatTime(dateStr);

	if (date.toDateString() === now.toDateString()) {
		return m.relative_today({ time });
	}
	if (date.toDateString() === tomorrow.toDateString()) {
		return m.relative_tomorrow({ time });
	}

	const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
	return `${dayName}, ${time}`;
}
