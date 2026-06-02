import { describe, it, expect } from 'vitest';
import { deriveInitials } from './names.js';

describe('deriveInitials', () => {
	it('strips Ustadz prefix and returns initials of remaining words', () => {
		expect(deriveInitials('Ustadz Subhan Bawazier')).toBe('SB');
	});

	it('strips Ustadzah prefix', () => {
		expect(deriveInitials('Ustadzah Fatimah Zahra')).toBe('FZ');
	});

	it('strips Ust. prefix', () => {
		expect(deriveInitials('Ust. Ali Hassan')).toBe('AH');
	});

	it('returns first two chars uppercase for a single-word name', () => {
		expect(deriveInitials('Subhan')).toBe('SU');
	});

	it('returns first char of first and last word for multi-word names', () => {
		expect(deriveInitials('Ahmad Zain')).toBe('AZ');
	});

	it('returns first char of first and last word for three-word names', () => {
		expect(deriveInitials('Ahmad Rizal Bawazier')).toBe('AB');
	});

	it('returns ? for empty string', () => {
		expect(deriveInitials('')).toBe('?');
	});

	it('is case-insensitive for prefix matching', () => {
		expect(deriveInitials('USTADZ Malik Ibrahim')).toBe('MI');
	});
});
