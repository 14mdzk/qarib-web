import { m } from '$core/i18n';

// Keys match the wire format emitted by the backend: strtolower(EventDatePrayer->name).
// Canonical set: subuh, dzuhr, asr, maghrib, isha.
// 'dhuha' has no backend enum case yet — kept as a forward-compatible stub.
// Thunks defer Paraglide locale resolution to call time rather than module load time.
const PRAYER_MESSAGE_MAP: Record<string, () => string> = {
	subuh: () => m.prayer_subuh(),
	dzuhr: () => m.prayer_dzuhr(),
	asr: () => m.prayer_asr(),
	maghrib: () => m.prayer_maghrib(),
	isha: () => m.prayer_isha(),
	dhuha: () => m.prayer_dhuha()
};

export function getPrayerLabel(prayerTime: string | null | undefined): string | null {
	if (!prayerTime) return null;
	const key = prayerTime.toLowerCase();
	const fn = PRAYER_MESSAGE_MAP[key];
	return fn ? fn() : prayerTime;
}
