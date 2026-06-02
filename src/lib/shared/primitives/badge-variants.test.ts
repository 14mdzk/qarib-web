import { describe, it, expect } from 'vitest';
import { badgeClasses } from './badge-variants.js';

describe('badgeClasses', () => {
	it('default variant has bg-surface-3 and text-content-2', () => {
		const cls = badgeClasses({ variant: 'default' });
		expect(cls).toContain('bg-surface-3');
		expect(cls).toContain('text-content-2');
	});

	it('accent variant has bg-primary and text-surface', () => {
		const cls = badgeClasses({ variant: 'accent' });
		expect(cls).toContain('bg-primary');
		expect(cls).toContain('text-surface');
	});

	it('soft variant has bg-orange-50 and text-orange-700', () => {
		const cls = badgeClasses({ variant: 'soft' });
		expect(cls).toContain('bg-orange-50');
		expect(cls).toContain('text-orange-700');
	});

	it('ghost variant has border-border-2 and text-content-3', () => {
		const cls = badgeClasses({ variant: 'ghost' });
		expect(cls).toContain('border');
		expect(cls).toContain('border-border-2');
		expect(cls).toContain('text-content-3');
	});

	it('defaults to default variant', () => {
		const cls = badgeClasses({});
		expect(cls).toContain('bg-surface-3');
	});

	it('has base classes (rounded-full, text-xs)', () => {
		const cls = badgeClasses({ variant: 'default' });
		expect(cls).toContain('rounded-full');
		expect(cls).toContain('text-xs');
	});
});
