/**
 * Pin urgency tiers for the Qarib map (Hi-Fi v2).
 *
 * Ported from `qarib-cms/resources/js/lib/services/pinTierService.ts` and
 * adapted to the web design token system. Each tier maps to a CSS custom
 * property (token) from `app.css` so the map styling inherits the design
 * system rather than hard-coding colours.
 *
 * Tier rules (relative to `now`):
 *   - `now`   — diff in [-120, 30] min: event started up to 2 h ago or starts
 *               within 30 min. Long-past events fall through to today/later.
 *   - `soon`  — diff in (30, 180] min (future only): event starts in 31–180 min.
 *   - `today` — start falls on the same local calendar day as `now`.
 *   - `later` — any other day.
 */

export type PinTier = 'now' | 'soon' | 'today' | 'later';

const NOW_UPPER_MINUTES = 30;
const NOW_LOWER_MINUTES = -120;
const SOON_THRESHOLD_MINUTES = 180;

/**
 * Derive the urgency tier for a pin given a session start time.
 *
 * @param dateStart  ISO string or Date of the occurrence's start.
 * @param now        Reference instant; defaults to `new Date()`. Injectable
 *                   for deterministic unit tests.
 */
export function deriveTier(dateStart: Date | string, now: Date = new Date()): PinTier {
	const start = typeof dateStart === 'string' ? new Date(dateStart) : dateStart;
	const diffMinutes = (start.getTime() - now.getTime()) / 60_000;

	if (diffMinutes <= NOW_UPPER_MINUTES && diffMinutes >= NOW_LOWER_MINUTES) {
		return 'now';
	}
	if (diffMinutes <= SOON_THRESHOLD_MINUTES && diffMinutes >= 0) {
		return 'soon';
	}
	// Same calendar day (LOCAL time) → today; any other day → later.
	// WIB users are UTC+7; evening sessions (Maghrib/Isha) near local midnight
	// would be mis-bucketed if we compare UTC dates instead of local dates.
	if (
		start.getFullYear() === now.getFullYear() &&
		start.getMonth() === now.getMonth() &&
		start.getDate() === now.getDate()
	) {
		return 'today';
	}
	return 'later';
}

/**
 * Map a pin tier to a CSS custom property token from `app.css`.
 *
 * `now`   → `--color-pin-now`   (#e88b2e — orange, most urgent)
 * `soon`  → `--color-pin-soon`  (#fce4c7 — warm cream)
 * `today` → `--color-pin-today` (#fdfaf4 — paper white)
 * `later` → `--color-pin-later` (#a89e8e — muted ink-4)
 */
export function tierToTokenColor(tier: PinTier): string {
	switch (tier) {
		case 'now':
			return 'var(--color-pin-now)';
		case 'soon':
			return 'var(--color-pin-soon)';
		case 'today':
			return 'var(--color-pin-today)';
		case 'later':
			return 'var(--color-pin-later)';
	}
}
