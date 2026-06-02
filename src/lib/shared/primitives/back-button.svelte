<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { m } from '$core/i18n';
	import IconButton from './icon-button.svelte';

	interface Props extends HTMLButtonAttributes {
		'aria-label'?: string;
		class?: string;
	}

	let {
		'aria-label': ariaLabel = m.back_button_label(),
		class: klass = '',
		...rest
	}: Props = $props();
</script>

<IconButton aria-label={ariaLabel} class={klass} {...rest}>
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="h-5 w-5"
	>
		<path d="m15 18-6-6 6-6" />
	</svg>
</IconButton>
