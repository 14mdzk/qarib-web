<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';
	import { buttonClasses } from './button-variants.js';

	type Variant = 'primary' | 'outline' | 'ghost';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		class?: string;
		children?: Snippet;
	}

	let { variant = 'primary', size = 'md', class: klass = '', children, ...rest }: Props = $props();
</script>

<button class={cn(buttonClasses({ variant, size }), klass)} {...rest}>
	{@render children?.()}
</button>
