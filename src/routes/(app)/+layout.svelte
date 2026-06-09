<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import AppHeader from '$lib/shared/composites/app-header.svelte';
	import { resolveHeaderMode } from '$lib/shared/composites/header-mode';
	import { createLocationPreference, normaliseReturnTo } from '$lib/core/location/index.svelte.js';

	let { children } = $props();

	const mode = $derived(resolveHeaderMode(page.url.pathname));
	const meta = $derived(page.data?.meta || {});

	// Instantiate context-scoped services once per app lifetime.
	const pref = createLocationPreference();

	// -------------------------------------------------------------------
	// Client reconciliation
	// -------------------------------------------------------------------

	let ready = $state(false);
	let reconciliationDone = $state(false);

	$effect(() => {
		if (!browser || reconciliationDone) return;

		// Re-read after hydration in case SSR left active=null.
		if (pref.active === null) {
			// Marker present but preference missing/invalid — storage recovery.
			const safeReturn = normaliseReturnTo(page.url.pathname + page.url.search);
			reconciliationDone = true;
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(`/lokasi?returnTo=${encodeURIComponent(safeReturn)}`, { replaceState: true });
			return;
		}

		ready = true;
		reconciliationDone = true;
	});
</script>

<div class="bg-surface mx-auto min-h-screen max-w-2xl">
	<AppHeader {mode} title={meta?.title} />
	{#if ready}
		<main>{@render children()}</main>
	{/if}
</div>
