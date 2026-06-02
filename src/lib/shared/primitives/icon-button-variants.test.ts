import { describe, it, expect } from 'vitest';
import { iconButtonClasses } from './icon-button-variants.js';

describe('iconButtonClasses', () => {
	it('md size has h-11 w-11', () => {
		const cls = iconButtonClasses({ size: 'md' });
		expect(cls).toContain('h-11');
		expect(cls).toContain('w-11');
	});

	it('sm size has h-9 w-9', () => {
		const cls = iconButtonClasses({ size: 'sm' });
		expect(cls).toContain('h-9');
		expect(cls).toContain('w-9');
	});

	it('has focus-visible ring', () => {
		const cls = iconButtonClasses({ size: 'md' });
		expect(cls).toContain('focus-visible:ring-2');
		expect(cls).toContain('focus-visible:ring-primary');
		expect(cls).toContain('focus-visible:ring-offset-surface');
	});

	it('has rounded-full and border-border-2', () => {
		const cls = iconButtonClasses({ size: 'md' });
		expect(cls).toContain('rounded-full');
		expect(cls).toContain('border-border-2');
	});

	it('defaults to md size', () => {
		const cls = iconButtonClasses({});
		expect(cls).toContain('h-11');
		expect(cls).toContain('w-11');
	});
});
