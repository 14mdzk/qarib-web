<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';
	import { m } from '$core/i18n';
	import { spinnerStyle } from './spinner-variants.js';

	type Size = 'sm' | 'lg';
	type Variant = 'default' | 'white';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		size?: Size;
		variant?: Variant;
		class?: string;
	}

	let { size = 'sm', variant = 'default', class: klass = '', ...rest }: Props = $props();
</script>

<!--
  Inline activity spinner — v2 fidelity port.
  Role="status" + aria-label so screen readers announce loading state.
  Animation (@keyframes spin) is defined in app.css; reduced-motion rule
  in app.css neutralises it.
-->
<span
	role="status"
	aria-label={m.loading_spinner_label()}
	class={cn('inline-block rounded-full', klass)}
	style={spinnerStyle(size, variant)}
	{...rest}
></span>
