import { cn } from '$lib/shared/utils/cn.js';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const BASE =
	'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none';

const VARIANT: Record<Variant, string> = {
	primary: 'bg-primary text-surface hover:bg-primary-hover',
	outline: 'border border-border-2 text-content hover:bg-surface-2',
	ghost: 'text-content hover:bg-surface-2'
};

const SIZE: Record<Size, string> = {
	sm: 'h-9 px-3 text-sm',
	md: 'h-11 px-4 text-sm',
	lg: 'h-12 px-6 text-base'
};

export function buttonClasses({
	variant = 'primary',
	size = 'md'
}: {
	variant?: Variant;
	size?: Size;
}): string {
	return cn(BASE, VARIANT[variant], SIZE[size]);
}
