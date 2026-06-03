<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { m } from '$core/i18n';
	import { GhostPin, MapToast, ProgressStrip, ContentDim } from '$lib/shared/primitives';
	import MapView from '$lib/shared/composites/map-view.svelte';
	import PinSheet from '$lib/shared/composites/pin-sheet.svelte';
	import type { SheetPlace, SheetEvent } from '$lib/shared/composites/pin-sheet.svelte';
	import MapFilterChips from '$lib/shared/composites/map-filter-chips.svelte';
	import type { FilterChip } from '$lib/shared/composites/map-filter-chips.svelte';
	import MapFab from '$lib/shared/composites/map-fab.svelte';
	import { toDateRange, formatTime, formatDistance } from '$lib/shared/utils/date.js';
	import { createLocation } from '$core/location/index.svelte.js';
	import { createEventsView } from '$domains/events/store.svelte.js';
	import { defineNearbyInfiniteQuery } from '$domains/events/queries.js';
	import { deriveTier } from '$domains/events/pin-tier.js';
	import { groupOccurrencesToPlacePins } from '$domains/events/place-pins.js';
	import { buildQueryClient } from '$core/query';
	import type { Paginated } from '$core/api';
	import type {
		EventRecurringResponse,
		EventRecurringResponseWithPlace
	} from '$domains/events/schema.js';
	import type { InfiniteData } from '@tanstack/svelte-query';
	import type { PageData } from './$types';

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

	const activeDay = $derived(eventsView.selectedDate ?? dateStrip[0].iso);
	const dateRange = $derived(toDateRange(activeDay));

	const queryArgs = $derived({
		lat: location.center.lat,
		lng: location.center.lng,
		date_from: dateRange.date_from,
		date_to: dateRange.date_to,
		expand: 'place',
		limit: 10
	});

	// SSR seed
	const _initData = $derived(data.initialData as Paginated<EventRecurringResponse[]> | null);

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

	// Derived flat list from all pages.
	const events = $derived((query.data?.pages ?? []).flatMap((p) => p.data));

	// ---------------------------------------------------------------------------
	// Place pins — grouped by mosque (v2: one pin per place, not per occurrence)
	// ---------------------------------------------------------------------------

	const placePins = $derived(
		groupOccurrencesToPlacePins(events as EventRecurringResponseWithPlace[], {
			now: m.pin_label_now(),
			later: m.pin_label_later()
		}).map((pin) => ({
			...pin,
			selected: pin.id === eventsView.selectedPlaceId
		}))
	);

	// Map center + userLocation derived from location store.
	const mapCenter = $derived<[number, number]>([location.center.lat, location.center.lng]);
	const userLocation = $derived<[number, number] | undefined>(
		location.granted ? [location.center.lat, location.center.lng] : undefined
	);

	// ---------------------------------------------------------------------------
	// Filter chips — date strip as chips
	// ---------------------------------------------------------------------------

	const filterChips = $derived<FilterChip[]>(
		dateStrip.map((day) => ({
			key: day.iso,
			label: day.label,
			active: activeDay === day.iso
		}))
	);

	// ---------------------------------------------------------------------------
	// FAB bottom offset — clears pin sheet when open
	// ---------------------------------------------------------------------------

	const fabBottom = $derived(
		eventsView.selectedPlaceId != null
			? eventsView.sheetMode === 'full'
				? '320px'
				: '220px'
			: '20px'
	);

	// ---------------------------------------------------------------------------
	// Pin sheet data — built from the selected place's occurrences
	// ---------------------------------------------------------------------------

	function localise(l10n: Record<string, string> | null | undefined): string {
		if (!l10n) return '';
		return l10n['id'] ?? Object.values(l10n)[0] ?? '';
	}

	const selectedPlaceOccurrences = $derived(
		eventsView.selectedPlaceId != null
			? (events as EventRecurringResponseWithPlace[]).filter(
					(e) => e.place?.id === eventsView.selectedPlaceId
				)
			: []
	);

	const sheetPlace = $derived<SheetPlace | null>(
		selectedPlaceOccurrences.length > 0
			? (() => {
					const place = selectedPlaceOccurrences[0].place;
					const distKm =
						typeof selectedPlaceOccurrences[0].distance_km === 'number'
							? selectedPlaceOccurrences[0].distance_km
							: null;
					return {
						name: localise(place.name),
						distanceLabel: distKm != null ? formatDistance(distKm) : '',
						address: place.address ?? undefined
					};
				})()
			: null
	);

	const sheetEvents = $derived<SheetEvent[]>(
		selectedPlaceOccurrences
			.filter((e) => e.date_start != null)
			.map((e) => ({
				id: e.id,
				title: localise(e.name),
				timeLabel: formatTime(e.date_start),
				ustadzName: '',
				tier: deriveTier(e.date_start),
				dateStart: e.date_start,
				// occurrences without a series event_id are not linkable
				hasEventLink: typeof e.event_id === 'string' && e.event_id.trim() !== ''
			}))
	);

	// ---------------------------------------------------------------------------
	// Pin sheet day-chip state — controls which day bucket is shown in full mode
	// ---------------------------------------------------------------------------

	let activePinDay = $state<'today' | 'tomorrow' | 'week'>('today');

	// ---------------------------------------------------------------------------
	// Navigation helpers
	// ---------------------------------------------------------------------------

	function navigateToEvent(occurrenceId: string | number): void {
		// Navigate to the EVENT series UUID, not the occurrence int id.
		// occurrences without a series event_id are not linkable.
		const occ = (events as EventRecurringResponseWithPlace[]).find((e) => e.id === occurrenceId);
		const eventId = occ?.event_id;
		if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
			// No valid series event_id — row should have been non-actionable; bail out.
			return;
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- /kajian/[event_id] lands in phase D; resolve() added once the route file exists.
		goto(`${base}/kajian/${eventId}`);
	}

	function navigateToPlace(placeId: string): void {
		// TODO(phase-D): place detail route
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- /masjid/[id] lands in phase D; resolve() added once the route file exists.
		goto(`${base}/masjid/${placeId}`);
	}

	// ---------------------------------------------------------------------------
	// Ghost pins for cold-load state (scattered static positions, decorative)
	// ---------------------------------------------------------------------------

	const GHOST_PIN_DELAYS = ['0s', '0.3s', '0.6s', '0.9s', '1.2s'];

	onMount(() => {
		// requestGps() updates location.center on success → queryArgs changes →
		// createInfiniteQuery re-fetches automatically (new queryKey).
		location.requestGps();
	});
</script>

<!--
  Full-bleed map page — no phone-column constraint (the parent layout's <main>
  is full-width after the shell de-constraint in step 1).
  Height: viewport minus the 3.5rem (14-unit) AppHeader.
  --map-fab-bottom is propagated via CSS variable so MapFab lifts above the pin sheet.
-->
<div
	class="relative"
	style="height: calc(100dvh - 3.5rem); overflow: hidden; --map-fab-bottom: {fabBottom};"
>
	<!-- Map fills the entire container. ContentDim dims on background revalidation (stale data signal). -->
	{#if query.isFetching && !query.isPending}
		<ContentDim class="absolute inset-0">
			<MapView
				center={mapCenter}
				zoom={13}
				pins={placePins}
				{userLocation}
				onpinclick={(id) => {
					eventsView.selectPlace(typeof id === 'string' ? id : String(id));
				}}
			/>
		</ContentDim>
	{:else}
		<MapView
			center={mapCenter}
			zoom={13}
			pins={placePins}
			{userLocation}
			onpinclick={(id) => {
				eventsView.selectPlace(typeof id === 'string' ? id : String(id));
			}}
		/>
	{/if}

	<!-- ProgressStrip: background revalidation (data already loaded, now refreshing) -->
	{#if query.isFetching && !query.isPending}
		<div class="absolute top-0 right-0 left-0 z-30">
			<ProgressStrip class="h-1 w-full" />
		</div>
	{/if}

	<!-- Cold-load ghost pins + toast -->
	{#if query.isPending}
		<!-- Decorative ghost pins scattered over the map -->
		<div class="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
			{#each GHOST_PIN_DELAYS as delay, i (i)}
				<div class="absolute" style="left: {20 + i * 15}%; top: {25 + (i % 3) * 20}%;">
					<GhostPin animationDelay={delay} />
				</div>
			{/each}
		</div>
		<!-- Toast: non-intrusive notification while loading -->
		<div class="absolute top-14 right-4 left-4 z-30 flex justify-center">
			<MapToast message={m.peta_map_loading_toast()} loading={true} />
		</div>
	{/if}

	<!-- Error state: in-map error card -->
	{#if query.isError}
		<div
			class="absolute inset-x-4 top-1/2 z-30 -translate-y-1/2 rounded-[14px] bg-white p-6 text-center shadow-xl"
		>
			<div
				class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full"
				style="background: var(--color-danger-bg); color: var(--color-danger-ink);"
			>
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					<path d="m2 2 20 20M10.7 5.3 15 3v15M9 5v15l-6 2V7l3.8-1.3M21 15l-6 3M3 17l6-2" />
				</svg>
			</div>
			<p class="mb-1 text-sm font-bold" style="color: var(--color-ink);">
				{m.peta_map_error_title()}
			</p>
			<p class="mb-4 text-xs leading-relaxed" style="color: var(--color-ink-3);">
				{m.peta_map_error_body()}
			</p>
			<button
				onclick={() => query.refetch()}
				class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white"
				style="background: var(--color-orange);"
			>
				{m.peta_map_error_retry()}
			</button>
		</div>
	{/if}

	<!-- Empty state: in-map empty card (resolved, 0 events) -->
	{#if !query.isPending && !query.isError && events.length === 0}
		<div class="absolute top-1/2 right-0 left-0 z-30 -translate-y-1/2 px-9 text-center">
			<div
				class="mx-auto mb-3 grid h-[52px] w-[52px] place-items-center rounded-full border shadow-md"
				style="background: white; border-color: var(--color-line); color: var(--color-ink-3);"
			>
				<svg
					width="26"
					height="26"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
				>
					<circle cx="11" cy="11" r="7" />
					<path d="m21 21-4.3-4.3M8 11h6" />
				</svg>
			</div>
			<p class="mb-1 text-sm font-bold" style="color: var(--color-ink);">
				{m.peta_map_empty_title()}
			</p>
			<p class="mb-3 text-xs leading-snug" style="color: var(--color-ink-3);">
				{m.peta_map_empty_body()}
			</p>
			<button
				onclick={() => {
					const tomorrow = dateStrip[1];
					if (tomorrow) eventsView.selectDate(tomorrow.iso);
				}}
				class="rounded-[18px] border-none px-4 py-2 text-xs font-semibold text-white"
				style="background: var(--color-ink);"
			>
				{m.peta_map_empty_action()}
			</button>
		</div>
	{/if}

	<!-- Floating filter chips at map top -->
	<MapFilterChips chips={filterChips} onselect={(key) => eventsView.selectDate(key)} />

	<!-- GPS FAB — bottom-right, lifts above pin sheet when open.
	     --map-fab-bottom inherited from the container via CSS variable cascade. -->
	<MapFab onlocate={() => location.requestGps()} loading={location.requesting} />

	<!-- Pin sheet — shown when a place is selected -->
	{#if eventsView.selectedPlaceId != null && sheetPlace != null}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- navigates to /kajian/{event_id} (UUID) and /masjid/{place_id}; routes land in phase D. -->
		<PinSheet
			place={sheetPlace}
			events={sheetEvents}
			mode={eventsView.sheetMode}
			activeDay={activePinDay}
			onexpand={() => eventsView.expandSheet()}
			oncollapse={() => eventsView.collapseSheet()}
			ondayselect={(key) => {
				activePinDay = key;
			}}
			onselectevent={(id) => {
				// occurrences without a series event_id are not linkable — guard in navigateToEvent
				navigateToEvent(id);
			}}
			onopenplace={() => {
				const placeId = eventsView.selectedPlaceId;
				if (placeId) navigateToPlace(placeId);
			}}
		/>
		<!-- Scrim: tap outside sheet to close -->
		<button
			class="absolute inset-0 z-10 cursor-default bg-transparent"
			style="bottom: {eventsView.sheetMode === 'full' ? '72%' : '40%'};"
			aria-label={m.pin_sheet_collapse()}
			onclick={() => eventsView.closeSheet()}
		></button>
	{/if}
</div>
