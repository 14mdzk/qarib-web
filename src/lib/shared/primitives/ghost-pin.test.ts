/**
 * Unit tests for GhostPin style logic.
 *
 * Environment: node (no DOM). GhostPin is aria-hidden (decorative); it has no
 * label of its own. Tests confirm shape/animation constants and that the
 * animationDelay prop is threaded through correctly.
 *
 * Conformance: rule .claude/rules/testing.md (unit tests for pure logic).
 */
import { describe, it, expect } from 'vitest';
import { ghostPinBaseStyle, ghostPinStyle } from './ghost-pin-variants.js';

describe('ghostPinBaseStyle', () => {
	it('is 18×22px teardrop shape', () => {
		expect(ghostPinBaseStyle).toContain('width: 18px');
		expect(ghostPinBaseStyle).toContain('height: 22px');
	});

	it('uses ink-4 token for background', () => {
		expect(ghostPinBaseStyle).toContain('var(--color-ink-4)');
	});

	it('is semi-transparent (opacity 0.4)', () => {
		expect(ghostPinBaseStyle).toContain('opacity: 0.4');
	});

	it('has teardrop border-radius', () => {
		expect(ghostPinBaseStyle).toContain('border-radius: 50% 50% 50% 0');
	});

	it('has ghost-pulse animation', () => {
		expect(ghostPinBaseStyle).toContain('animation: ghost-pulse');
	});
});

describe('ghostPinStyle', () => {
	it('defaults to 0s animation delay', () => {
		const style = ghostPinStyle();
		expect(style).toContain('animation-delay: 0s');
	});

	it('passes through a custom animation delay', () => {
		const style = ghostPinStyle('0.3s');
		expect(style).toContain('animation-delay: 0.3s');
	});

	it('includes base shape styles with the delay', () => {
		const style = ghostPinStyle('0.6s');
		expect(style).toContain('var(--color-ink-4)');
		expect(style).toContain('animation-delay: 0.6s');
	});
});
