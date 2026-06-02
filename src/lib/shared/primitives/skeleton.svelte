<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		class?: string;
	}

	let { class: klass = '', ...rest }: Props = $props();
</script>

<div class={cn('bg-surface-3 animate-pulse rounded', klass)} {...rest}></div>
