<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { m } from '$core/i18n';
	let { children } = $props();
</script>

<svelte:head>
	<title>{m.app_title()}</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="bg-surface text-content min-h-screen">{@render children()}</div>
