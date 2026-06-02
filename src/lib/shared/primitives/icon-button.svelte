<script lang="ts">
	/**
	 * IconButton — a round button for icon-only actions.
	 *
	 * @requires aria-label — must be passed via rest props for screen-reader accessibility.
	 *   Example: <IconButton aria-label="Close dialog">…</IconButton>
	 */
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';
	import { iconButtonClasses } from './icon-button-variants.js';

	type Size = 'sm' | 'md';

	interface Props extends HTMLButtonAttributes {
		size?: Size;
		class?: string;
		children?: Snippet;
	}

	let { size = 'md', class: klass = '', children, ...rest }: Props = $props();
</script>

<button class={cn(iconButtonClasses({ size }), klass)} {...rest}>
	{@render children?.()}
</button>
