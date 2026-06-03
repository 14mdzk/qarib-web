/**
 * Unit tests for ProgressStrip style constants.
 *
 * Environment: node (no DOM). Confirms the track and thumb style constants
 * contain the correct design token references and animation.
 *
 * Conformance: rule .claude/rules/testing.md (unit tests for pure logic).
 */
import { describe, it, expect } from 'vitest';
import { progressStripTrackStyle, progressStripThumbStyle } from './progress-strip-variants.js';

describe('progressStripTrackStyle', () => {
	it('is full width and 3px tall', () => {
		expect(progressStripTrackStyle).toContain('width: 100%');
		expect(progressStripTrackStyle).toContain('height: 3px');
	});

	it('uses orange-50 token for background', () => {
		expect(progressStripTrackStyle).toContain('var(--color-orange-50)');
	});
});

describe('progressStripThumbStyle', () => {
	it('fills 40% of the track width', () => {
		expect(progressStripThumbStyle).toContain('width: 40%');
	});

	it('uses orange token for fill colour', () => {
		expect(progressStripThumbStyle).toContain('var(--color-orange)');
	});

	it('is absolutely positioned at the top-left', () => {
		expect(progressStripThumbStyle).toContain('position: absolute');
		expect(progressStripThumbStyle).toContain('top: 0');
		expect(progressStripThumbStyle).toContain('left: 0');
	});

	it('has the stripe animation', () => {
		expect(progressStripThumbStyle).toContain('animation: stripe');
	});
});
