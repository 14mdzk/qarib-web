<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { m } from '$core/i18n';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { createQueryClient } from '$core/query';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const queryClient = createQueryClient({ staleTime: 60_000 });
</script>

<svelte:head>
	<title>{m.app_title()}</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="text-content min-h-screen bg-gray-50">{@render children()}</div>
</QueryClientProvider>
