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
// Per-tier CSS classes (replaces old inline-style checks)
// ---------------------------------------------------------------------------

describe('buildPinIconHtml — tier CSS classes', () => {
	it('now: body uses map-pin-body--now class', () => {
		const html = buildPinIconHtml({ tier: 'now', label: 'NOW' });
		expect(html).toContain('map-pin-body--now');
	});

	it('now: tail outer uses map-pin-tail-outer--now class', () => {
		const html = buildPinIconHtml({ tier: 'now', label: 'NOW' });
		expect(html).toContain('map-pin-tail-outer--now');
	});

	it('now: tail inner uses map-pin-tail-inner--now class', () => {
		const html = buildPinIconHtml({ tier: 'now', label: 'NOW' });
		expect(html).toContain('map-pin-tail-inner--now');
	});

	it('soon: body uses map-pin-body--soon class', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).toContain('map-pin-body--soon');
	});

	it('soon: tail outer uses map-pin-tail-outer--soon class', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).toContain('map-pin-tail-outer--soon');
	});

	it('soon: tail inner uses map-pin-tail-inner--soon class', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).toContain('map-pin-tail-inner--soon');
	});

	it('today: body uses map-pin-body--today class', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '20:00' });
		expect(html).toContain('map-pin-body--today');
	});

	it('today: tail outer uses map-pin-tail-outer--today class', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '20:00' });
		expect(html).toContain('map-pin-tail-outer--today');
	});

	it('today: tail inner uses map-pin-tail-inner--today class', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '20:00' });
		expect(html).toContain('map-pin-tail-inner--today');
	});

	it('later: body uses map-pin-body--later class', () => {
		const html = buildPinIconHtml({ tier: 'later', label: 'Besok' });
		expect(html).toContain('map-pin-body--later');
	});

	it('later: tail outer uses map-pin-tail-outer--later class', () => {
		const html = buildPinIconHtml({ tier: 'later', label: 'Besok' });
		expect(html).toContain('map-pin-tail-outer--later');
	});

	it('later: tail inner uses map-pin-tail-inner--later class', () => {
		const html = buildPinIconHtml({ tier: 'later', label: 'Besok' });
		expect(html).toContain('map-pin-tail-inner--later');
	});

	it('rejects inline style attribute on body', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).not.toMatch(/class="map-pin-body" style=/);
	});

	it('rejects inline style attribute on tail outer', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).not.toMatch(/class="map-pin-tail-outer" style=/);
	});

	it('rejects inline style attribute on tail inner', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).not.toMatch(/class="map-pin-tail-inner" style=/);
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
		expect(html).toContain('class="map-pin-body');
	});

	it('uses map-pin-tail-outer CSS class for the outer tail', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('class="map-pin-tail-outer');
	});

	it('uses map-pin-tail-inner CSS class for the inner tail', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('class="map-pin-tail-inner');
	});

	it('body class includes tier variant', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('class="map-pin-body map-pin-body--today"');
	});

	it('outer tail class includes tier variant', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('class="map-pin-tail-outer map-pin-tail-outer--today"');
	});

	it('inner tail class includes tier variant', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('class="map-pin-tail-inner map-pin-tail-inner--today"');
	});
});
