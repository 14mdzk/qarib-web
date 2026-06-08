<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$core/i18n';
	import { Skeleton } from '$lib/shared/primitives';
	import MapView from '$lib/shared/composites/map-view.svelte';
	import EventCard from './EventCard.svelte';
	import { definePlaceByIdQuery } from '$domains/places/queries.js';
	import { defineSeriesListQuery } from '$domains/events/queries.js';
	import type { PinTier } from '$domains/events/pin-tier.js';
	import type { PageData } from './$types';
	import { l10n } from '$shared/utils/l10n';

	let { data }: { data: PageData } = $props();

	// Route param: place UUID.
	const id: string = page.params.id!;

	// ---------------------------------------------------------------------------
	// Svelte-query: place header
	// ---------------------------------------------------------------------------
	const placeQuery = definePlaceByIdQuery(
		{ id, expand: '' },
		{
			get requestId() {
				return data.requestId;
			},
			get initialData() {
				return data.placeInitialData;
			}
		}
	);

	// ---------------------------------------------------------------------------
	// Svelte-query: kajian for this place
	// ---------------------------------------------------------------------------
	const kajianQuery = defineSeriesListQuery(
		{ place_id: id, expand: 'asatidz', limit: 20 },
		{
			get requestId() {
				return data.requestId;
			},
			get initialData() {
				return data.kajianInitialData ?? undefined;
			}
		}
	);

	// ---------------------------------------------------------------------------
	// Derived state
	// ---------------------------------------------------------------------------
	const place = $derived(placeQuery.data ?? null);
	const kajianList = $derived(kajianQuery.data?.data ?? []);
	const isLoading = $derived(placeQuery.isPending);
	const isError = $derived(placeQuery.isError);

	/**
	 * Region chip text.
	 * PlaceResponse only carries `region_id` (UUID), not resolved province/city
	 * names. The chip is omitted unless a future expand provides region fields.
	 * TODO(phase-E): expand=region on places.get and surface province › city.
	 */
	const regionChip = $derived<string | null>(null);

	/** Leaflet pin for the mini-map. Only built when coords are present. */
	const mapPin = $derived(
		place?.lat != null && place?.lng != null
			? [{ id: id, lat: place.lat, lng: place.lng, tier: 'later' as PinTier }]
			: []
	);
	const mapCenter = $derived<[number, number] | null>(
		place?.lat != null && place?.lng != null ? [place.lat, place.lng] : null
	);
</script>

<!--
  /masjid/[id] — Place (masjid) detail page.
  Route param `id` = place UUID.
  v2 port: PlaceDetail() from docs/design/hifi-v2.js.
  Width: centered readable column — per-route width ownership (no full-bleed for detail pages).
  Rule: styling.md, architecture.md, i18n.md, state-management.md
-->

<div class="mx-auto max-w-2xl px-4 pb-16">
	{#if isLoading}
		<!-- Loading skeleton mirrors the v2 PlaceDetail structure -->
		<div class="flex flex-col gap-4 pt-4">
			<Skeleton class="h-32 w-full rounded" />
			<Skeleton class="h-8 w-3/4 rounded" />
			<Skeleton class="h-4 w-1/2 rounded" />
			<Skeleton class="mt-2 h-10 rounded" />
			<Skeleton class="h-40 rounded" />
			<Skeleton class="h-24 rounded" />
			<Skeleton class="h-20 rounded" />
		</div>
	{:else if isError}
		<div class="py-10 text-center">
			<p class="text-ink font-bold">{m.masjid_error_title()}</p>
			<p class="text-ink-3 mt-1 text-sm">{m.masjid_error_body()}</p>
			<button
				class="bg-ink text-paper mt-4 rounded px-4 py-2 text-sm font-semibold"
				onclick={() => placeQuery.refetch()}
			>
				{m.masjid_error_retry()}
			</button>
		</div>
	{:else if place}
		<!-- ── Hero (photo/gradient bg) ─────────────────────────────────────── -->
		<div
			class="bg-paper-2 flex h-32 w-full items-end rounded-b-none px-4 pt-4 pb-3"
			style="background: linear-gradient(160deg, #f5f0e8 0%, #e8dcc8 100%);"
			data-testid="place-hero"
		>
			{#if regionChip}
				<span
					class="rounded-sm border border-orange-100 bg-white/80 px-2.5 py-1 text-xs font-semibold text-orange-700 backdrop-blur-sm"
					data-testid="region-chip"
				>
					{regionChip}
				</span>
			{/if}
		</div>

		<!-- ── Name + address ────────────────────────────────────────────────── -->
		<div class="border-line border-b px-0 pt-4 pb-4" data-testid="place-header">
			<h1
				class="text-ink text-2xl leading-tight font-extrabold tracking-tight"
				data-testid="place-name"
			>
				{l10n(place.name)}
			</h1>
			{#if place.address}
				<p class="text-ink-3 mt-1 text-sm leading-relaxed" data-testid="place-address">
					{place.address}
				</p>
			{/if}

			<!-- Action row: directions · phone · share -->
			<div class="mt-3 flex gap-2">
				<!-- Petunjuk arah — external Google Maps URL, only when coords present -->
				{#if place.lat != null && place.lng != null}
					<a
						href="https://maps.google.com/?q={place.lat},{place.lng}"
						target="_blank"
						rel="noopener noreferrer"
						class="bg-orange text-paper flex flex-1 items-center justify-center gap-1.5 rounded-sm px-4 py-2 text-sm font-semibold"
						aria-label={m.masjid_directions()}
						data-testid="directions-btn"
					>
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg
						>
						{m.masjid_directions()}
					</a>
				{/if}

				<!-- Phone (only when field is present) -->
				{#if place.phone}
					<a
						href="tel:{place.phone}"
						class="border-line bg-paper-2 text-ink flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-sm border"
						aria-label={m.masjid_phone()}
						data-testid="phone-btn"
					>
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
							><path
								d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
							/></svg
						>
					</a>
				{/if}

				<!-- Share -->
				<button
					class="border-line bg-paper-2 text-ink flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-sm border"
					aria-label={m.masjid_share()}
					data-testid="share-btn"
					onclick={() => {
						if (typeof navigator !== 'undefined' && navigator.share) {
							navigator.share({
								title: l10n(place?.name),
								url: window.location.href
							});
						}
					}}
				>
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
						><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle
							cx="18"
							cy="19"
							r="3"
						/><line x1="8.6" x2="15.4" y1="13.5" y2="17.5" /><line
							x1="15.4"
							x2="8.6"
							y1="6.5"
							y2="10.5"
						/></svg
					>
				</button>
			</div>
		</div>

		<!-- ── Scroll body ────────────────────────────────────────────────────── -->
		<div class="flex flex-col gap-4 pt-4">
			<!-- Mini-map (only when coords available) -->
			{#if mapCenter}
				<div
					class="border-line h-40 overflow-hidden rounded border"
					aria-label={m.masjid_map_aria_label()}
					data-testid="mini-map"
				>
					<MapView center={mapCenter} zoom={15} pins={mapPin} />
				</div>
			{/if}

			<!-- Kajian rutin section -->
			<div data-testid="kajian-section">
				<div
					class="text-ink-3 mb-2.5 flex items-baseline justify-between text-[11px] font-bold tracking-widest uppercase"
				>
					<span>{m.masjid_kajian_section_title()}</span>
					{#if kajianList.length > 0}
						<span class="text-ink-4 text-[11px] font-normal tracking-normal normal-case">
							{m.masjid_kajian_count({ n: kajianList.length })}
						</span>
					{/if}
				</div>

				<div class="flex flex-col gap-2">
					{#each kajianList as series (series.id)}
						<EventCard {series} />
					{:else}
						<div class="border-line rounded border p-4 text-center">
							<p class="text-ink-3 text-sm">{m.kajian_no_upcoming()}</p>
						</div>
					{/each}
				</div>

				<!-- TODO(phase-E): wire full schedule page -->
				<button
					class="border-line bg-paper-2 text-ink mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm border py-2 text-sm font-semibold"
					data-testid="see-all-btn"
				>
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
						><rect width="18" height="18" x="3" y="4" rx="2" /><line
							x1="16"
							y1="2"
							y2="6"
							x2="16"
						/><line x1="8" y1="2" y2="6" x2="8" /><line x1="3" y1="10" y2="10" x2="21" /></svg
					>
					{m.masjid_kajian_see_all()}
				</button>
			</div>
		</div>
	{/if}
</div>
