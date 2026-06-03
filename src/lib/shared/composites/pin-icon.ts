/**
 * pin-icon.ts — pure HTML builder for Qarib Hi-Fi v2 map pins.
 *
 * Returns a raw HTML string suitable for Leaflet's `L.divIcon({ html: ... })`.
 * Kept pure (no Leaflet import, no DOM) so it is unit-testable in Vitest.
 *
 * Pin anatomy (ported 1:1 from docs/design/hifi-v2.html `.map-pin`):
 *   - A pill `.body` (height 30px, border-radius 16px, border 2px).
 *   - A downward ink triangle tail implemented as two nested border-trick divs
 *     (::after outer / ::before fill) since divIcon is raw HTML with no
 *     pseudo-element support.
 *
 * Caller supplies `label` (e.g. "18:00", "NOW", "Besok") and `tier`.
 * The `now` tier prepends "● " to the label per v2 spec (`.body` renders
 * `●&nbsp;label`).
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

// Per-tier inline style strings — values map directly to app.css tokens.
// now:   orange fill, orange-700 border, white text, warm ring shadow.
// soon:  orange-50 fill (#fce4c7), orange border, orange-700 text.
// today: paper-white fill (#fdfaf4), ink border, ink text.
// later: paper-2 fill (#f7f1e5), ink-4 border, ink-3 text, fw 600.
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
 * Build the HTML string for a v2 `.map-pin` divIcon.
 *
 * The returned string is a single wrapper `<div>` containing the pill body
 * and two nested tail divs (outer ink triangle, inner fill triangle).
 *
 * `selected` wraps the whole element at `transform:scale(1.15)`.
 */
export function buildPinIconHtml({ tier, label, selected = false }: PinIconOptions): string {
	const safeLabel = escapeHtml(label);
	const displayLabel = tier === 'now' ? `&#9679;&nbsp;${safeLabel}` : safeLabel;

	// Outer ink tail (border trick: 6px wide, 7px tall)
	const tailOuter = `<div style="${[
		'position:absolute',
		'bottom:-7px',
		'left:50%',
		'transform:translateX(-50%)',
		'width:0',
		'height:0',
		'border-left:6px solid transparent',
		'border-right:6px solid transparent',
		`border-top:7px solid ${TIER_TAIL_OUTER[tier]}`
	].join(';')}"></div>`;

	// Inner fill tail (border trick: 4px wide, 5px tall; z-index:1 above outer)
	const tailInner = `<div style="${[
		'position:absolute',
		'bottom:-4px',
		'left:50%',
		'transform:translateX(-50%)',
		'width:0',
		'height:0',
		'border-left:4px solid transparent',
		'border-right:4px solid transparent',
		`border-top:5px solid ${TIER_TAIL_INNER[tier]}`,
		'z-index:1'
	].join(';')}"></div>`;

	const bodyStyle = [
		'min-width:38px',
		'height:30px',
		'border-radius:16px',
		'border:2px solid',
		'display:flex',
		'align-items:center',
		'justify-content:center',
		'padding:0 9px',
		'font-size:11px',
		'font-weight:700',
		'font-family:inherit',
		'gap:4px',
		'position:relative',
		'white-space:nowrap',
		TIER_BODY_STYLE[tier]
	].join(';');

	const wrapStyle = selected
		? 'transform:scale(1.15);display:inline-flex;flex-direction:column;align-items:center'
		: 'display:inline-flex;flex-direction:column;align-items:center';

	return `<div style="${wrapStyle}"><div style="${bodyStyle}">${displayLabel}${tailOuter}${tailInner}</div></div>`;
}
