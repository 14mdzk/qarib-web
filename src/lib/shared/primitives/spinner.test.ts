/**
 * Unit tests for Spinner variant logic.
 *
 * Environment: node (no DOM). Tests confirm the style/class helpers produce
 * the correct output for each size × variant combination.
 *
 * Conformance: rule .claude/rules/testing.md (unit tests for pure logic).
 */
import { describe, it, expect } from 'vitest';
import { spinnerSizeStyles, spinnerVariantStyles, spinnerStyle } from './spinner-variants.js';

describe('spinner size styles', () => {
	it('sm produces 16px dimensions and 2px border', () => {
		expect(spinnerSizeStyles.sm).toContain('width: 16px');
		expect(spinnerSizeStyles.sm).toContain('height: 16px');
		expect(spinnerSizeStyles.sm).toContain('border-width: 2px');
	});

	it('lg produces 22px dimensions and 2.5px border', () => {
		expect(spinnerSizeStyles.lg).toContain('width: 22px');
		expect(spinnerSizeStyles.lg).toContain('height: 22px');
		expect(spinnerSizeStyles.lg).toContain('border-width: 2.5px');
	});
});

describe('spinner variant styles', () => {
	it('default variant references orange token for border-top-color', () => {
		expect(spinnerVariantStyles.default).toContain('var(--color-orange)');
	});

	it('white variant uses white border-top-color', () => {
		expect(spinnerVariantStyles.white).toContain('border-top-color: white');
	});

	it('white variant has semi-transparent border-color', () => {
		expect(spinnerVariantStyles.white).toContain('rgba(255,255,255,0.25)');
	});
});

describe('spinnerStyle', () => {
	it('defaults to sm size and default variant', () => {
		const style = spinnerStyle();
		expect(style).toContain('width: 16px');
		expect(style).toContain('var(--color-orange)');
	});

	it('sm + default produces correct composite style', () => {
		const style = spinnerStyle('sm', 'default');
		expect(style).toContain('width: 16px');
		expect(style).toContain('height: 16px');
		expect(style).toContain('border-width: 2px');
		expect(style).toContain('var(--color-orange)');
		expect(style).toContain('animation: spin');
	});

	it('lg + white produces correct composite style', () => {
		const style = spinnerStyle('lg', 'white');
		expect(style).toContain('width: 22px');
		expect(style).toContain('height: 22px');
		expect(style).toContain('border-width: 2.5px');
		expect(style).toContain('border-top-color: white');
	});

	it('always includes spin animation', () => {
		expect(spinnerStyle('sm', 'default')).toContain('animation: spin');
		expect(spinnerStyle('lg', 'white')).toContain('animation: spin');
	});

	it('always includes border-style: solid', () => {
		expect(spinnerStyle('sm', 'default')).toContain('border-style: solid');
	});
});
