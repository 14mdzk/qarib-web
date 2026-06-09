import { m } from '$core/i18n';

function toOffsetString(date: Date): string {
	const offsetMinutes = -date.getTimezoneOffset();
	const sign = offsetMinutes >= 0 ? '+' : '-';
	const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
	const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
	return `${sign}${hours}:${minutes}`;
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
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function addIsoDateDays(dateStr: string, days: number): string {
	const [year, month, day] = isoDateParts(dateStr);
	const date = new Date(year, month - 1, day, 12);
	date.setDate(date.getDate() + days);
	return toLocalIsoDate(date);
}

export function shiftCalendarMonth(dateStr: string, delta: number): string {
	const [year, month] = isoDateParts(dateStr);
	const date = new Date(year, month - 1, 1, 12);
	date.setMonth(date.getMonth() + delta);
	return toLocalIsoDate(date);
}

export function formatIsoDate(
	dateStr: string,
	options: Intl.DateTimeFormatOptions,
	locale = 'id-ID'
): string {
	const [year, month, day] = isoDateParts(dateStr);
	return new Intl.DateTimeFormat(locale, options).format(new Date(year, month - 1, day, 12));
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
	const [year, month, day] = isoDateParts(dateStr);
	const start = new Date(year, month - 1, day, 0, 0, 0);
	const end = new Date(year, month - 1, day, 23, 59, 59);
	return {
		date_from: `${dateStr}T00:00:00${toOffsetString(start)}`,
		date_to: `${dateStr}T23:59:59${toOffsetString(end)}`
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
