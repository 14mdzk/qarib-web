<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { m } from '$core/i18n';
	import { Button } from '$lib/shared/primitives';
	import LoadingState from '$lib/shared/composites/loading-state.svelte';
	import EmptyState from '$lib/shared/composites/empty-state.svelte';
	import MapView from '$lib/shared/composites/map-view.svelte';
	import { toDateRange } from '$lib/shared/utils/date.js';
	import { createLocation } from '$core/location/index.svelte.js';
	import { createEventsView } from '$domains/events/store.svelte.js';
	import { defineNearbyInfiniteQuery } from '$domains/events/queries.js';
	import { deriveTier } from '$domains/events/pin-tier.js';
	import { buildQueryClient } from '$core/query';
	import type { Paginated } from '$core/api';
	import type {
		EventRecurringResponse,
		EventRecurringResponseWithPlace
	} from '$domains/events/schema.js';
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

	// ---------------------------------------------------------------------------
	// Map pins — derived from events with valid place coordinates
	// ---------------------------------------------------------------------------

	const pins = $derived(
		(events as EventRecurringResponseWithPlace[])
			.filter(
				(e) =>
					e.id != null &&
					e.date_start != null &&
					e.place != null &&
					typeof e.place.lat === 'number' &&
					typeof e.place.lng === 'number' &&
					!isNaN(e.place.lat) &&
					!isNaN(e.place.lng)
			)
			.map((e) => ({
				id: e.id,
				lat: e.place.lat,
				lng: e.place.lng,
				tier: deriveTier(e.date_start)
			}))
	);

	// Map center + userLocation derived from location store.
	const mapCenter = $derived<[number, number]>([location.center.lat, location.center.lng]);
	const userLocation = $derived<[number, number] | undefined>(
		location.granted ? [location.center.lat, location.center.lng] : undefined
	);

	// ---------------------------------------------------------------------------
	// Selected pin callout — the occurrence for the active pin ID
	// ---------------------------------------------------------------------------

	const selectedEvent = $derived(
		eventsView.selectedPinId != null
			? (events.find((e) => e.id === eventsView.selectedPinId) ?? null)
			: null
	);

	function localise(l10n: Record<string, string> | null | undefined): string {
		if (!l10n) return '';
		return l10n['id'] ?? Object.values(l10n)[0] ?? '';
	}

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

	<!-- Location affordance + view toggle -->
	<div class="border-border flex items-center justify-between gap-2 border-b px-4 py-2">
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

		<!-- Map / List segmented toggle -->
		<div
			class="bg-surface-2 border-border ml-auto flex shrink-0 overflow-hidden rounded-full border"
			role="group"
			aria-label={m.peta_view_toggle_label()}
		>
			<button
				type="button"
				onclick={() => eventsView.setViewMode('list')}
				aria-pressed={eventsView.viewMode === 'list'}
				class="px-3 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none {eventsView.viewMode ===
				'list'
					? 'bg-primary text-primary-foreground font-semibold'
					: 'text-content-2 hover:bg-surface-3'}"
			>
				{m.peta_view_list()}
			</button>
			<button
				type="button"
				onclick={() => eventsView.setViewMode('map')}
				aria-pressed={eventsView.viewMode === 'map'}
				class="px-3 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none {eventsView.viewMode ===
				'map'
					? 'bg-primary text-primary-foreground font-semibold'
					: 'text-content-2 hover:bg-surface-3'}"
			>
				{m.peta_view_map()}
			</button>
		</div>
	</div>

	<!-- Main content area: list or map -->
	{#if eventsView.viewMode === 'map'}
		<!-- Map view: fixed height container, MapView fills it -->
		<div class="relative" style="height: calc(100dvh - 10rem);">
			<MapView
				center={mapCenter}
				zoom={13}
				{pins}
				{userLocation}
				onpinclick={(id) => {
					eventsView.selectPin(typeof id === 'number' ? id : null);
				}}
			/>

			<!-- Pin callout overlay — shows when a pin is selected -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -- /kajian/[id] lands in C4; base+path is correct. TODO(c4): switch to resolve(). -->
			{#if selectedEvent != null}
				{@const calloutTitle = localise(selectedEvent.name)}
				<div
					class="border-border bg-surface absolute right-3 bottom-6 left-3 z-[1000] rounded-xl border p-4 shadow-lg"
					role="dialog"
					aria-modal="true"
					aria-label={calloutTitle || m.peta_callout_untitled()}
				>
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<p class="text-content line-clamp-2 leading-snug font-medium">
								{calloutTitle || m.peta_callout_untitled()}
							</p>
						</div>
						<button
							type="button"
							onclick={() => eventsView.selectPin(null)}
							class="text-content-3 hover:text-content shrink-0 text-sm focus-visible:ring-2 focus-visible:outline-none"
							aria-label={m.peta_callout_close()}
						>
							{m.peta_callout_close()}
						</button>
					</div>
					<div class="mt-3">
						<a
							href="{base}/kajian/{selectedEvent.id}"
							class="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
						>
							{m.peta_callout_open()}
						</a>
					</div>
				</div>
			{/if}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{:else}
		<!-- List view (C3a — unchanged) -->
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
	{/if}
</div>
