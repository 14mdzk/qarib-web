/**
 * Unit tests for ContentDim overlay style constant.
 *
 * Environment: node (no DOM). ContentDim wraps children with a semi-transparent
 * warm-cream overlay signalling stale data. The overlay span is aria-hidden;
 * the component itself needs no accessible label (the caller's content is still
 * visible and readable). Tests confirm the overlay style values are correct.
 *
 * Conformance: rule .claude/rules/testing.md (unit tests for pure logic).
 */
import { describe, it, expect } from 'vitest';
import { contentDimOverlayStyle } from './content-dim-variants.js';

describe('contentDimOverlayStyle', () => {
	it('is positioned absolutely covering the full area', () => {
		expect(contentDimOverlayStyle).toContain('position: absolute');
		expect(contentDimOverlayStyle).toContain('inset: 0');
	});

	it('uses the paper colour at 55% opacity', () => {
		expect(contentDimOverlayStyle).toContain('rgba(253,250,244,0.55)');
	});

	it('does not block pointer events on underlying content', () => {
		expect(contentDimOverlayStyle).toContain('pointer-events: none');
	});

	it('inherits border-radius from the parent', () => {
		expect(contentDimOverlayStyle).toContain('border-radius: inherit');
	});
});
