/**
 * Pin urgency tiers for the Qarib map (Phase C).
 *
 * Ported from `qarib-cms/resources/js/lib/services/pinTierService.ts` and
 * adapted to the web design token system. Each tier maps to a CSS custom
 * property (token) from `app.css` so the map styling inherits the design
 * system rather than hard-coding colours.
 *
 * Tier rules (relative to `now`):
 *   - `now`   — starts in ≤ 30 min, or has already started (diff ≤ 30 min)
 *   - `soon`  — starts in ≤ 180 min (3 h)
 *   - `today` — anything later today
 *
 * Events beyond today are filtered upstream by the API (`date_from`/`date_to`
 * constraints), so this function only handles within-day buckets.
 */

export type PinTier = 'now' | 'soon' | 'today';

const NOW_THRESHOLD_MINUTES = 30;
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

	if (diffMinutes <= NOW_THRESHOLD_MINUTES) {
		return 'now';
	}
	if (diffMinutes <= SOON_THRESHOLD_MINUTES) {
		return 'soon';
	}
	return 'today';
}

/**
 * Map a pin tier to a CSS custom property token from `app.css`.
 *
 * `now`   → `--color-primary`   (most urgent, highest visual weight)
 * `soon`  → `--color-accent`    (approaching, warm highlight)
 * `today` → `--color-content-3` (later today, muted)
 */
export function tierToTokenColor(tier: PinTier): string {
	switch (tier) {
		case 'now':
			return 'var(--color-primary)';
		case 'soon':
			return 'var(--color-accent)';
		case 'today':
			return 'var(--color-content-3)';
	}
}
