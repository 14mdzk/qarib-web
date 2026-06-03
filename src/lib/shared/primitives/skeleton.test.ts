/**
 * Unit tests for Skeleton shimmer style constant.
 *
 * Environment: node (no DOM). Skeleton is aria-hidden (decorative placeholder).
 * Tests confirm the shimmer gradient uses the correct paper token pair and that
 * the shimmer animation name is present.
 *
 * Conformance: rule .claude/rules/testing.md (unit tests for pure logic).
 */
import { describe, it, expect } from 'vitest';
import { skeletonStyle } from './skeleton-variants.js';

describe('skeletonStyle', () => {
	it('uses a 90-degree linear-gradient', () => {
		expect(skeletonStyle).toContain('linear-gradient(90deg');
	});

	it('uses paper-2 token as the shimmer start/end colour', () => {
		expect(skeletonStyle).toContain('var(--color-paper-2)');
	});

	it('uses paper-3 token as the shimmer midpoint colour', () => {
		expect(skeletonStyle).toContain('var(--color-paper-3)');
	});

	it('sets background-size to 200% to allow animation travel', () => {
		expect(skeletonStyle).toContain('background-size: 200% 100%');
	});

	it('references the shimmer keyframe animation', () => {
		expect(skeletonStyle).toContain('animation: shimmer');
	});

	it('has a 1.6s duration', () => {
		expect(skeletonStyle).toContain('1.6s');
	});

	it('has a 6px border-radius', () => {
		expect(skeletonStyle).toContain('border-radius: 6px');
	});
});
