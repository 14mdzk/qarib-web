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
	it('applies scale(1.15) transform when selected=true', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00', selected: true });
		expect(html).toContain('scale(1.15)');
	});

	it('does not apply scale transform when selected=false (default)', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).not.toContain('scale(1.15)');
	});

	it('does not apply scale when selected is omitted', () => {
		const html = buildPinIconHtml({ tier: 'now', label: 'NOW' });
		expect(html).not.toContain('scale(1.15)');
	});
});

// ---------------------------------------------------------------------------
// Pill structure
// ---------------------------------------------------------------------------

describe('buildPinIconHtml — pill structure', () => {
	it('includes border-radius:16px for the pill', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('border-radius:16px');
	});

	it('includes height:30px for the pill', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('height:30px');
	});

	it('includes min-width:38px for the pill', () => {
		const html = buildPinIconHtml({ tier: 'today', label: '19:30' });
		expect(html).toContain('min-width:38px');
	});

	it('includes two tail divs (outer 7px + inner 5px)', () => {
		const html = buildPinIconHtml({ tier: 'soon', label: '18:00' });
		expect(html).toContain('border-top:7px solid');
		expect(html).toContain('border-top:5px solid');
	});
});
