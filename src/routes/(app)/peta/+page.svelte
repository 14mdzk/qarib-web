<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$core/i18n';
	import { Button } from '$lib/shared/primitives';
	import LoadingState from '$lib/shared/composites/loading-state.svelte';
	import EmptyState from '$lib/shared/composites/empty-state.svelte';
	import { toDateRange } from '$lib/shared/utils/date.js';
	import { createLocation } from '$core/location/index.svelte.js';
	import { createEventsView } from '$domains/events/store.svelte.js';
	import { defineNearbyInfiniteQuery } from '$domains/events/queries.js';
	import { buildQueryClient } from '$core/query';
	import type { Paginated } from '$core/api';
	import type { EventRecurringResponse } from '$domains/events/schema.js';
	import type { InfiniteData } from '@tanstack/svelte-query';
	import EventCard from '$lib/domains/events/components/event-card.svelte';
	import type { PageData } from './$types'; // merged from +page.server.ts load

	let { data }: { data: PageData } = $props();

	// ---------------------------------------------------------------------------
	// Context-DI: instantiate location + view stores at page scope
	// ---------------------------------------------------------------------------

	const location = createLocation();
	const eventsView = createEventsView();

	// QueryClient — created page-locally until QueryClientProvider is wired in
	// a root layout (no singleton; each page instance owns its own client).
	const qc = buildQueryClient({ staleTime: 30_000 });

	// ---------------------------------------------------------------------------
	// Date strip — today + next 6 days
	// ---------------------------------------------------------------------------

	function buildDateStrip(): { label: string; iso: string }[] {
		const days: { label: string; iso: string }[] = [];
		// Plain Date is fine here — runs once at component creation to build a
		// static non-reactive array. SvelteDate is not needed.
		const now = new Date();
		for (let i = 0; i < 7; i++) {
			// eslint-disable-next-line svelte/prefer-svelte-reactivity -- static non-reactive computation
			const d = new Date(now);
			d.setDate(d.getDate() + i);
			const iso = d.toISOString().slice(0, 10);
			const label =
				i === 0
					? m.peta_date_today()
					: new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(d);
			days.push({ label, iso });
		}
		return days;
	}

	const dateStrip = buildDateStrip();

	// ---------------------------------------------------------------------------
	// Svelte-query: cursor-paginated nearby feed (state-management.md rule)
	// ---------------------------------------------------------------------------

	// The active ISO day — falls back to today.
	const activeDay = $derived(eventsView.selectedDate ?? dateStrip[0].iso);

	// Build the date range args for the query.
	const dateRange = $derived(toDateRange(activeDay));

	// Reactive base args (without cursor — the query manages that internally).
	const queryArgs = $derived({
		lat: location.center.lat,
		lng: location.center.lng,
		date_from: dateRange.date_from,
		date_to: dateRange.date_to,
		expand: 'place',
		limit: 10
	});

	// SSR seed: $derived so it reacts to data re-delivery on client navigation.
	// Cast is sound — PageServerData returns initialData typed as the raw api()
	// return, which is exactly Paginated<EventRecurringResponse[]>.
	const _initData = $derived(data.initialData as Paginated<EventRecurringResponse[]> | null);

	// Infinite query — svelte-query owns all server state (state-management.md).
	// initialData and queryArgs are accessed inside the accessor so createInfiniteQuery
	// tracks them reactively without capturing stale closure values.
	// Both queryArgs and _initData are $derived — reading them inside the
	// options getter lets createInfiniteQuery track the reactive dependencies.
	const query = defineNearbyInfiniteQuery(
		() => ({
			args: queryArgs,
			initialData: _initData
				? ({
						pages: [_initData],
						pageParams: [null]
					} satisfies InfiniteData<Paginated<EventRecurringResponse[]>, string | null>)
				: undefined
		}),
		qc
	);

	// Derived flat list from all pages accumulated by the infinite query.
	const events = $derived((query.data?.pages ?? []).flatMap((p) => p.data));

	onMount(() => {
		// requestGps() updates location.center on success → queryArgs changes →
		// createInfiniteQuery re-fetches automatically (new queryKey).
		location.requestGps();
	});
</script>

<div class="flex flex-col gap-0">
	<!-- Date strip -->
	<div
		class="border-border bg-surface scrollbar-hide flex gap-1 overflow-x-auto border-b px-4 py-2"
	>
		{#each dateStrip as day (day.iso)}
			<button
				type="button"
				onclick={() => eventsView.selectDate(day.iso)}
				class="ring-ring rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none {activeDay ===
				day.iso
					? 'bg-primary text-primary-foreground font-semibold'
					: 'text-content-2 hover:bg-surface-2'}"
			>
				{day.label}
			</button>
		{/each}
	</div>

	<!-- Location affordance -->
	<div class="border-border flex items-center gap-2 border-b px-4 py-2">
		<button
			type="button"
			onclick={() => location.requestGps()}
			disabled={location.requesting}
			class="text-primary text-sm font-medium disabled:opacity-50"
		>
			{location.requesting ? m.peta_location_requesting() : m.peta_location_request()}
		</button>
		{#if location.granted}
			<span class="text-content-3 text-xs">{m.peta_location_granted()}</span>
		{/if}
	</div>

	<!-- Event list area -->
	<div class="px-4 py-4">
		{#if query.isPending}
			<LoadingState />
		{:else if query.isError}
			<div class="flex flex-col items-center gap-3 py-12 text-center">
				<p class="text-content font-medium">{m.peta_error_title()}</p>
				<p class="text-content-3 text-sm">{m.peta_error_body()}</p>
				<Button variant="outline" onclick={() => query.refetch()} size="sm">
					{m.peta_load_more()}
				</Button>
			</div>
		{:else if events.length === 0}
			<EmptyState title={m.peta_empty_title()} description={m.peta_empty_body()} />
		{:else}
			<ul class="flex flex-col gap-3" role="list">
				{#each events as event (event.id)}
					<li>
						<EventCard occurrence={event} />
					</li>
				{/each}
			</ul>

			{#if query.hasNextPage}
				<div class="mt-4 flex justify-center">
					<Button
						variant="outline"
						onclick={() => query.fetchNextPage()}
						disabled={query.isFetchingNextPage}
					>
						{query.isFetchingNextPage ? m.peta_loading_more() : m.peta_load_more()}
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</div>
