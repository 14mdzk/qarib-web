<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';
	import { badgeClasses } from './badge-variants.js';

	type Variant = 'default' | 'accent' | 'soft' | 'ghost';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		variant?: Variant;
		class?: string;
		children?: Snippet;
	}

	let { variant = 'default', class: klass = '', children, ...rest }: Props = $props();
</script>

<span class={cn(badgeClasses({ variant }), klass)} {...rest}>
	{@render children?.()}
</span>
