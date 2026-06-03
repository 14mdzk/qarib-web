<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';
	import { skeletonStyle } from './skeleton-variants.js';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		class?: string;
	}

	let { class: klass = '', ...rest }: Props = $props();
</script>

<!--
  v2 warm shimmer: linear-gradient over paper-2/paper-3, animated with the
  @keyframes shimmer defined in app.css.
  Rule: styling.md — no arbitrary hex; all values reference design tokens.
-->
<div class={cn('rounded', klass)} style={skeletonStyle} aria-hidden="true" {...rest}></div>
