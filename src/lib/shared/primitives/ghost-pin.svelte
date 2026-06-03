<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';
	import { ghostPinStyle } from './ghost-pin-variants.js';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		/** Stagger the pulse animation; pass a CSS time value e.g. "0.3s". */
		animationDelay?: string;
	}

	let { class: klass = '', animationDelay = '0s', ...rest }: Props = $props();
</script>

<!--
  Ghost map pin placeholder — pulsing muted teardrop shape shown during cold load.
  @keyframes ghost-pulse defined in app.css; reduced-motion rule neutralises it.
  aria-hidden: decorative indicator; screen readers should be informed of loading
  state by a separate live region (e.g. MapToast).
-->
<div aria-hidden="true" class={cn(klass)} style={ghostPinStyle(animationDelay)} {...rest}></div>
