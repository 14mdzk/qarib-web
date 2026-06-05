<script lang="ts">
	import { page } from '$app/state';
	import AppHeader from '$lib/shared/composites/app-header.svelte';
	import { resolveHeaderMode } from '$lib/shared/composites/header-mode';

	let { children } = $props();

	const mode = $derived(resolveHeaderMode(page.url.pathname));
	const meta = $derived(page.data?.meta || {});
</script>

<div class="bg-surface mx-auto min-h-screen max-w-2xl">
	<AppHeader {mode} title={meta?.title} />
	<main>{@render children()}</main>
</div>
