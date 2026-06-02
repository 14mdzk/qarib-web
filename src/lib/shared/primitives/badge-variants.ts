import { cn } from '$lib/shared/utils/cn.js';

type Variant = 'default' | 'accent' | 'soft' | 'ghost';

const BASE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

const VARIANT: Record<Variant, string> = {
	default: 'bg-surface-3 text-content-2',
	accent: 'bg-primary text-surface',
	soft: 'bg-orange-50 text-orange-700',
	ghost: 'border border-border-2 text-content-3'
};

export function badgeClasses({ variant = 'default' }: { variant?: Variant }): string {
	return cn(BASE, VARIANT[variant]);
}
