import { describe, it, expect } from 'vitest';
import { resolveHeaderMode } from './header-mode';

describe('resolveHeaderMode', () => {
	it('returns "back" for / (marketing landing, not app home)', () => {
		expect(resolveHeaderMode('/')).toBe('back');
	});

	it('returns "home" for /peta', () => {
		expect(resolveHeaderMode('/peta')).toBe('home');
	});

	it('returns "back" for /kajian/abc', () => {
		expect(resolveHeaderMode('/kajian/abc')).toBe('back');
	});

	it('returns "back" for /masjid/1', () => {
		expect(resolveHeaderMode('/masjid/1')).toBe('back');
	});
});
