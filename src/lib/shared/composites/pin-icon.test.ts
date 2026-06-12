/**
 * Unit tests for pin-icon.ts — pure HTML builder for v2 map pins.
 */
import { describe, it, expect } from 'vitest';
import { buildPinIconHtml, escapeHtml } from './pin-icon.js';

// ---------------------------------------------------------------------------
// XSS escaping
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
	it('escapes & < > " \' characters', () => {
		expect(escapeHtml('&')).toBe('&amp;');
		expect(escapeHtml('<')).toBe('&lt;');
		expect(escapeHtml('>')).toBe('&gt;');
		expect(escapeHtml('"')).toBe('&quot;');
		expect(escapeHtml("'")).toBe('&#39;');
	});

	it('a label containing <b>"& is escaped in buildPinIconHtml output', () => {
		const result = buildPinIconHtml({ tier: 'soon', label: '<b>"&' });
		expect(result).toContain('&lt;b&gt;&quot;&amp;');
		expect(result).not.toContain('<b>');
	});
});

// ---------------------------------------------------------------------------
// Label rendering
// ---------------------------------------------------------------------------

describe('buildPinIconHtml — label', () => {
	it('renders the provided label text', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).toContain('18:00');
	});

	it('prepends ● to label for now tier', () => {
		const html = buildPinIconHtml({ tier: 'now', label: 'NOW' });
		// ● is rendered as &#9679; and followed by &nbsp;
		expect(html).toContain('&#9679;');
		expect(html).toContain('NOW');
	});

	it('does not prepend ● for soon tier', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: 'SOON' });
		expect(html).not.toContain('&#9679;');
	});

	it('does not prepend ● for today tier', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '20:00' });
		expect(html).not.toContain('&#9679;');
	});

	it('does not prepend ● for later tier', () => {
		const html = buildPinIconHtml({ tier: 'later', label: 'Besok' });
		expect(html).not.toContain('&#9679;');
	});
});

// ---------------------------------------------------------------------------
// Per-tier color vars
// ---------------------------------------------------------------------------

describe('buildPinIconHtml — tier colors', () => {
	it('now: contains --color-pin-now background', () => {
		const html = buildPinIconHtml({ tier: 'now', label: 'NOW' });
		expect(html).toContain('var(--color-pin-now)');
	});

	it('now: contains --color-orange-700 border (tail outer)', () => {
		const html = buildPinIconHtml({ tier: 'now', label: 'NOW' });
		expect(html).toContain('var(--color-orange-700)');
	});

	it('soon: contains --color-pin-soon background', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).toContain('var(--color-pin-soon)');
	});

	it('soon: contains --color-orange border', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).toContain('var(--color-orange)');
	});

	it('today: contains --color-pin-today background', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '20:00' });
		expect(html).toContain('var(--color-pin-today)');
	});

	it('today: contains --color-ink border', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '20:00' });
		expect(html).toContain('var(--color-ink)');
	});

	it('later: contains --color-paper-2 background', () => {
		const html = buildPinIconHtml({ tier: 'later', label: 'Besok' });
		expect(html).toContain('var(--color-paper-2)');
	});

	it('later: contains --color-ink-4 border', () => {
		const html = buildPinIconHtml({ tier: 'later', label: 'Besok' });
		expect(html).toContain('var(--color-ink-4)');
	});

	it('later: contains --color-ink-3 text color', () => {
		const html = buildPinIconHtml({ tier: 'later', label: 'Besok' });
		expect(html).toContain('var(--color-ink-3)');
	});
});

// ---------------------------------------------------------------------------
// Selected state
// ---------------------------------------------------------------------------

describe('buildPinIconHtml — selected', () => {
	it('applies map-pin--selected CSS class when selected=true', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00', selected: true });
		expect(html).toContain('map-pin--selected');
	});

	it('does not apply map-pin--selected CSS class when selected=false (default)', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).not.toContain('map-pin--selected');
	});

	it('does not apply map-pin--selected CSS class when selected is omitted', () => {
		const html = buildPinIconHtml({ tier: 'now', label: 'NOW' });
		expect(html).not.toContain('map-pin--selected');
	});
});

// ---------------------------------------------------------------------------
// Pill structure
// ---------------------------------------------------------------------------

describe('buildPinIconHtml — pill structure', () => {
	it('uses map-pin-body CSS class for the pill', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('class="map-pin-body"');
	});

	it('uses map-pin-tail-outer CSS class for the outer tail', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('class="map-pin-tail-outer"');
	});

	it('uses map-pin-tail-inner CSS class for the inner tail', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('class="map-pin-tail-inner"');
	});

	it('includes tier-specific border-top-color for outer tail', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).toContain('border-top-color:var(--color-orange)');
	});

	it('includes tier-specific border-top-color for inner tail', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).toContain('border-top-color:var(--color-pin-soon)');
	});
});
