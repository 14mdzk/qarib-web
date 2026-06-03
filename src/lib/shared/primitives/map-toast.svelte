<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/shared/utils/cn.js';
	import Spinner from './spinner.svelte';
	import { mapToastContainerStyle } from './map-toast-variants.js';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Localised message string — caller supplies via $core/i18n. */
		message: string;
		/** When true, shows the white-variant spinner next to the message. */
		loading?: boolean;
		class?: string;
	}

	let { message, loading = false, class: klass = '', ...rest }: Props = $props();
</script>

<!--
  Dark map notification strip — appears at the top of the map during GPS/data fetch.
  Role="status" + aria-live so screen readers announce updates without losing focus.
-->
<div
	role="status"
	aria-live="polite"
	class={cn('flex items-center rounded-[10px] text-white', klass)}
	style={mapToastContainerStyle}
	{...rest}
>
	{#if loading}
		<Spinner size="sm" variant="white" />
	{/if}
	<span>{message}</span>
</div>
