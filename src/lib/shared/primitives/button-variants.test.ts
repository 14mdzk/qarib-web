import { describe, it, expect } from 'vitest';
import { buttonClasses } from './button-variants.js';

describe('buttonClasses', () => {
	it('primary variant has bg-primary and focus-visible ring', () => {
		const cls = buttonClasses({ variant: 'primary', size: 'md' });
		expect(cls).toContain('bg-primary');
		expect(cls).toContain('focus-visible:ring-primary');
		expect(cls).toContain('focus-visible:ring-offset-surface');
	});

	it('ghost variant has hover:bg-surface-2, text-content and does NOT have bg-primary', () => {
		const cls = buttonClasses({ variant: 'ghost', size: 'md' });
		expect(cls).toContain('hover:bg-surface-2');
		expect(cls).toContain('text-content');
		expect(cls).not.toContain('bg-primary');
	});

	it('outline variant has border and text-content', () => {
		const cls = buttonClasses({ variant: 'outline', size: 'md' });
		expect(cls).toContain('border');
		expect(cls).toContain('border-border-2');
		expect(cls).toContain('text-content');
	});

	it('size sm has h-9', () => {
		const cls = buttonClasses({ variant: 'primary', size: 'sm' });
		expect(cls).toContain('h-9');
	});

	it('size md has h-11', () => {
		const cls = buttonClasses({ variant: 'primary', size: 'md' });
		expect(cls).toContain('h-11');
	});

	it('size lg has h-12', () => {
		const cls = buttonClasses({ variant: 'primary', size: 'lg' });
		expect(cls).toContain('h-12');
	});

	it('defaults to primary variant and md size', () => {
		const cls = buttonClasses({});
		expect(cls).toContain('bg-primary');
		expect(cls).toContain('h-11');
	});
});
