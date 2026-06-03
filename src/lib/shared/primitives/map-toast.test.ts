/**
 * Unit tests for MapToast style constants.
 *
 * Environment: node (no DOM). MapToast carries role="status" + aria-live so
 * screen readers announce map updates without losing focus. The component
 * accepts a caller-supplied message string and an optional loading flag.
 * Tests confirm the container style constants are correct.
 *
 * Conformance: rule .claude/rules/testing.md (unit tests for pure logic).
 * Conformance: rule .claude/rules/i18n.md — message is caller-supplied;
 *   map_toast_loading_label key is provided in id.json for consumer use.
 */
import { describe, it, expect } from 'vitest';
import { mapToastContainerStyle } from './map-toast-variants.js';

describe('mapToastContainerStyle', () => {
	it('uses the ink design token for background', () => {
		expect(mapToastContainerStyle).toContain('var(--color-ink)');
	});

	it('has the v2 padding (10px 14px)', () => {
		expect(mapToastContainerStyle).toContain('padding: 10px 14px');
	});

	it('uses 12px font-size and 500 font-weight', () => {
		expect(mapToastContainerStyle).toContain('font-size: 12px');
		expect(mapToastContainerStyle).toContain('font-weight: 500');
	});

	it('has 10px gap between spinner and text', () => {
		expect(mapToastContainerStyle).toContain('gap: 10px');
	});

	it('has a dark drop shadow', () => {
		expect(mapToastContainerStyle).toContain('box-shadow');
		expect(mapToastContainerStyle).toContain('rgba(26,21,16,0.25)');
	});

	it('is a flex row (display:flex + align-items:center)', () => {
		expect(mapToastContainerStyle).toContain('display: flex');
		expect(mapToastContainerStyle).toContain('align-items: center');
	});
});
