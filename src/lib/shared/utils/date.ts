import { m } from '$core/i18n';

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

export function toDateRange(dateStr: string): { date_from: string; date_to: string } {
	const date = new Date(dateStr + 'T00:00:00');
	const offset = -date.getTimezoneOffset();
	const sign = offset >= 0 ? '+' : '-';
	const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
	const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
	const tz = `${sign}${hours}:${minutes}`;

	return {
		date_from: `${dateStr}T00:00:00${tz}`,
		date_to: `${dateStr}T23:59:59${tz}`
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
