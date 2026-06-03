<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';
	import { contentDimOverlayStyle } from './content-dim-variants.js';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		children: Snippet;
	}

	let { class: klass = '', children, ...rest }: Props = $props();
</script>

<!--
  Wraps content with a translucent warm cream overlay signalling stale data
  during revalidation. Content remains visible and tappable.
-->
<div class={cn('relative', klass)} {...rest}>
	{@render children()}
	<span aria-hidden="true" style={contentDimOverlayStyle}></span>
</div>
