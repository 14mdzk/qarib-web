/**
 * pin-icon.ts — pure HTML builder for Qarib Hi-Fi v2 map pins.
 *
 * Returns a raw HTML string suitable for Leaflet's `L.divIcon({ html: ... })`.
 * Kept pure (no Leaflet import, no DOM) so it is unit-testable in Vitest.
 *
 * Pin anatomy:
 *   - A pill `.map-pin-body` (height 30px, border-radius 16px, border 2px).
 *   - A downward ink triangle tail implemented as two nested border-trick divs
 *     (`.map-pin-tail-outer` / `.map-pin-tail-inner`) since divIcon is raw HTML
 *     with no pseudo-element support.
 *   - Structural styles are in CSS classes (`map-pin`, `map-pin-body`, etc.)
 *     defined in app.css. Tier-specific colors are kept as inline styles since
 *     they are dynamic per-pin.
 *
 * Caller supplies `label` (e.g. "18:00", "NOW", "Besok") and `tier`.
 * The `now` tier prepends "● " to the label per v2 spec.
 */

import type { PinTier } from '$domains/events/pin-tier.js';

/** Escape HTML special chars to prevent XSS in divIcon label interpolation. */
export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export interface PinIconOptions {
	tier: PinTier;
	label: string;
	selected?: boolean;
}

// Per-tier body style — values that vary by tier (background, border-color,
// color, box-shadow). The rest of the body styling is in CSS class .map-pin-body.
// now:   orange fill, orange-700 border, white text, warm ring shadow.
// soon:  orange-50 fill, orange border, orange-700 text.
// today: paper-white fill, ink border, ink text.
// later: paper-2 fill, ink-4 border, ink-3 text, fw 600.
const TIER_BODY_STYLE: Record<PinTier, string> = {
	now: [
		'background:var(--color-pin-now)',
		'border-color:var(--color-orange-700)',
		'color:#fff',
		'box-shadow:0 0 0 4px rgba(232,139,46,0.25),0 3px 8px rgba(232,139,46,0.4)'
	].join(';'),
	soon: [
		'background:var(--color-pin-soon)',
		'border-color:var(--color-orange)',
		'color:var(--color-orange-700)',
		'box-shadow:0 3px 8px rgba(26,21,16,0.2)'
	].join(';'),
	today: [
		'background:var(--color-pin-today)',
		'border-color:var(--color-ink)',
		'color:var(--color-ink)',
		'box-shadow:0 3px 8px rgba(26,21,16,0.2)'
	].join(';'),
	later: [
		'background:var(--color-paper-2)',
		'border-color:var(--color-ink-4)',
		'color:var(--color-ink-3)',
		'font-weight:600',
		'box-shadow:0 3px 8px rgba(26,21,16,0.2)'
	].join(';')
};

// The outer (ink) triangle border-trick color per tier.
const TIER_TAIL_OUTER: Record<PinTier, string> = {
	now: 'var(--color-orange-700)',
	soon: 'var(--color-orange)',
	today: 'var(--color-ink)',
	later: 'var(--color-ink-4)'
};

// The inner (fill) triangle color per tier — matches body background.
const TIER_TAIL_INNER: Record<PinTier, string> = {
	now: 'var(--color-pin-now)',
	soon: 'var(--color-pin-soon)',
	today: 'var(--color-pin-today)',
	later: 'var(--color-paper-2)'
};

/**
 * Build the HTML string for a v2 map pin divIcon.
 *
 * The returned string is a single wrapper `<div class="map-pin">` containing
 * the pill body and two nested tail divs (outer ink triangle, inner fill
 * triangle). Structural positioning is in CSS classes; tier-specific colors
 * are inline since they vary per pin.
 *
 * `selected` adds the `.map-pin--selected` class which applies transform:scale(1.15).
 */
export function buildPinIconHtml({ tier, label, selected = false }: PinIconOptions): string {
	const safeLabel = escapeHtml(label);
	const displayLabel = tier === 'now' ? `&#9679;&nbsp;${safeLabel}` : safeLabel;

	// Outer ink tail — border-top-color is tier-specific (inline).
	const tailOuter = `<div class="map-pin-tail-outer" style="border-top-color:${TIER_TAIL_OUTER[tier]}"></div>`;

	// Inner fill tail — border-top-color is tier-specific (inline).
	const tailInner = `<div class="map-pin-tail-inner" style="border-top-color:${TIER_TAIL_INNER[tier]}"></div>`;

	// Body — only tier-varying props are inline; structural props are in CSS.
	const bodyHtml = `<div class="map-pin-body" style="${TIER_BODY_STYLE[tier]}">${displayLabel}${tailOuter}${tailInner}</div>`;

	const wrapperClass = `map-pin${selected ? ' map-pin--selected' : ''}`;

	return `<div class="${wrapperClass}">${bodyHtml}</div>`;
}
