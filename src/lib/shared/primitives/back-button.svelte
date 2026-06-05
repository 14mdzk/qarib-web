<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { m } from '$core/i18n';
	import IconButton from './icon-button.svelte';
	import { ChevronLeft } from '@lucide/svelte';

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
	<ChevronLeft />
</IconButton>
