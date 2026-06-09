/**
 * Tests for safe returnTo normalisation.
 *
 * Conformance:
 *   - docs/plans/location-onboarding-settings.md § "/lokasi route contract"
 *   - rule .claude/rules/testing.md
 */
import { describe, expect, it } from 'vitest';
import { normaliseReturnTo, DEFAULT_RETURN_TO } from './return-to.js';

describe('normaliseReturnTo', () => {
	it('defaults to /peta when candidate is null', () => {
		expect(normaliseReturnTo(null)).toBe(DEFAULT_RETURN_TO);
	});

	it('defaults to /peta when candidate is undefined', () => {
		expect(normaliseReturnTo(undefined)).toBe(DEFAULT_RETURN_TO);
	});

	it('defaults to /peta when candidate is empty string', () => {
		expect(normaliseReturnTo('')).toBe(DEFAULT_RETURN_TO);
	});

	it('returns a valid app path as-is', () => {
		expect(normaliseReturnTo('/peta')).toBe('/peta');
	});

	it('preserves query strings on valid app paths', () => {
		expect(normaliseReturnTo('/peta?x=1')).toBe('/peta?x=1');
	});

	it('preserves pathname and search for detail routes', () => {
		expect(normaliseReturnTo('/kajian/uuid-123')).toBe('/kajian/uuid-123');
	});

	it('rejects protocol-relative URLs', () => {
		expect(normaliseReturnTo('//evil.com/peta')).toBe(DEFAULT_RETURN_TO);
	});

	it('rejects absolute cross-origin URLs', () => {
		expect(normaliseReturnTo('https://evil.com/peta')).toBe(DEFAULT_RETURN_TO);
	});

	it('rejects URLs with credentials', () => {
		expect(normaliseReturnTo('/peta@evil.com')).toBe(DEFAULT_RETURN_TO);
	});

	it('rejects URLs with fragments', () => {
		expect(normaliseReturnTo('/peta#section')).toBe(DEFAULT_RETURN_TO);
	});

	it('rejects /lokasi itself to prevent redirect loops', () => {
		expect(normaliseReturnTo('/lokasi')).toBe(DEFAULT_RETURN_TO);
		expect(normaliseReturnTo('/lokasi?returnTo=/peta')).toBe(DEFAULT_RETURN_TO);
	});

	it('rejects strings that do not start with /', () => {
		expect(normaliseReturnTo('peta')).toBe(DEFAULT_RETURN_TO);
	});
});
