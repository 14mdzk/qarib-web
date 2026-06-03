type Size = 'sm' | 'lg';
type Variant = 'default' | 'white';

export const spinnerSizeStyles: Record<Size, string> = {
	sm: 'width: 16px; height: 16px; border-width: 2px;',
	lg: 'width: 22px; height: 22px; border-width: 2.5px;'
};

export const spinnerVariantStyles: Record<Variant, string> = {
	default: 'border-color: rgba(26,21,16,0.15); border-top-color: var(--color-orange);',
	white: 'border-color: rgba(255,255,255,0.25); border-top-color: white;'
};

export function spinnerStyle(size: Size = 'sm', variant: Variant = 'default'): string {
	return `${spinnerSizeStyles[size]} ${spinnerVariantStyles[variant]} border-style: solid; animation: spin 0.8s linear infinite;`;
}
