<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		children?: Snippet;
	}

	let { class: klass = '', children, ...rest }: Props = $props();
</script>

<div class={cn('bg-surface-2 border-border rounded border p-4 shadow', klass)} {...rest}>
	{@render children?.()}
</div>
