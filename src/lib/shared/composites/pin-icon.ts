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
 *     defined in app.css. Tier-specific colors are also in CSS classes via
 *     tier-variant selectors (e.g. `.map-pin-body--now`, `.map-pin-tail-outer--now`).
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

/**
 * Build the HTML string for a v2 map pin divIcon.
 *
 * The returned string is a single wrapper `<div class="map-pin">` containing
 * the pill body and two nested tail divs (outer ink triangle, inner fill
 * triangle). All styling is in CSS classes — no inline styles.
 *
 * `selected` adds the `.map-pin--selected` class which applies transform:scale(1.15).
 */
export function buildPinIconHtml({ tier, label, selected = false }: PinIconOptions): string {
	const safeLabel = escapeHtml(label);
	const displayLabel = tier === 'now' ? `&#9679;&nbsp;${safeLabel}` : safeLabel;

	const tailOuter = `<div class="map-pin-tail-outer map-pin-tail-outer--${tier}"></div>`;
	const tailInner = `<div class="map-pin-tail-inner map-pin-tail-inner--${tier}"></div>`;
	const bodyHtml = `<div class="map-pin-body map-pin-body--${tier}">${displayLabel}${tailOuter}${tailInner}</div>`;

	const wrapperClass = `map-pin${selected ? ' map-pin--selected' : ''}`;

	return `<div class="${wrapperClass}">${bodyHtml}</div>`;
}
