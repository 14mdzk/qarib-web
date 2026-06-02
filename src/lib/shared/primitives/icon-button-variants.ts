import { cn } from '$lib/shared/utils/cn.js';

type Size = 'sm' | 'md';

const BASE =
	'inline-grid place-items-center rounded-full border border-border-2 text-content transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none';

const SIZE: Record<Size, string> = {
	sm: 'h-9 w-9',
	md: 'h-11 w-11'
};

export function iconButtonClasses({ size = 'md' }: { size?: Size }): string {
	return cn(BASE, SIZE[size]);
}
