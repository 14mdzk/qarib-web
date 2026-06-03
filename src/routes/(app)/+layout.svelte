<script lang="ts">
	import { page } from '$app/state';
	import AppHeader from '$lib/shared/composites/app-header.svelte';
	import { resolveHeaderMode } from '$lib/shared/composites/header-mode';
	let { children } = $props();
	const mode = $derived(resolveHeaderMode(page.url.pathname));
</script>

<AppHeader {mode} />
<main class="w-full">{@render children()}</main>
