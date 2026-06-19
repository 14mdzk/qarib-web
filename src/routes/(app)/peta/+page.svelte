<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { m } from '$core/i18n';
	import { GhostPin, MapToast, ProgressStrip, ContentDim } from '$lib/shared/primitives';
	import MapView from '$lib/shared/composites/map-view.svelte';
	import PinSheet from '$lib/shared/composites/pin-sheet.svelte';
	import type { SheetPlace, SheetEvent } from '$lib/shared/composites/pin-sheet.svelte';
	import MapFilterChips from '$lib/shared/composites/map-filter-chips.svelte';
	import type { FilterChip } from '$lib/shared/composites/map-filter-chips.svelte';
	import MapFab from '$lib/shared/composites/map-fab.svelte';
	import {
		addIsoDateDays,
		formatDistance,
		formatIsoDate,
		formatTime,
		getWeekdayLabels,
		shiftCalendarMonth,
		toDateRange,
		toLocalIsoDate
	} from '$lib/shared/utils/date.js';
	import { createLocation, getLocationPreference } from '$core/location/index.svelte.js';
	import {
		createEventsView,
		MAX_RADIUS_KM,
		RADIUS_STEPS_KM
	} from '$domains/events/store.svelte.js';
	import { defineEventListQuery, defineNearbyInfiniteQuery } from '$domains/events/queries.js';
	import { definePlaceListQuery } from '$domains/places/queries.js';
	import { defineSubjectListQuery } from '$domains/subject/queries.js';
	import { deriveTier } from '$domains/events/pin-tier.js';
	import {
		groupOccurrencesToPlacePins,
		mergeNearbyPlacesWithEventPins
	} from '$domains/events/place-pins.js';
	import type { EventRecurringResponseWithPlace } from '$domains/events/schema.js';
	import type { SubjectResponse } from '$domains/subject/schema.js';
	import { dateModeToInitialPinDay, dateRangeForMode, selectedIsoForMode } from './date-mode.js';
	import {
		CalendarDays,
		ChevronLeft,
		ChevronRight,
		GlobeOff,
		ListFilter,
		Map as MapIcon,
		MapPin,
		Radar
	} from '@lucide/svelte';
	import { l10n } from '$shared/utils/l10n';

	// ---------------------------------------------------------------------------
	// Context-DI: instantiate location + view stores at page scope
	// ---------------------------------------------------------------------------

	const location = createLocation();
	const eventsView = createEventsView();
	const pref = getLocationPreference();
	let browserReady = $state(false);
	let todayIso = $state<string | null>(null);
	let activeFilterSheet = $state<'date' | 'subject' | 'radius' | null>(null);
	let locationNoticeDismissed = $state(false);
	let emptySheetDismissedForKey = $state<string | null>(null);
	let customDatePickerOpen = $state(false);
	let calendarMonth = $state<string | null>(null);

	// ---------------------------------------------------------------------------
	// Date strip — today + next 6 days
	// ---------------------------------------------------------------------------

	function buildDateStrip(today: string): { label: string; iso: string }[] {
		const days: { label: string; iso: string }[] = [];
		for (let i = 0; i < 7; i++) {
			const iso = addIsoDateDays(today, i);
			const label =
				i === 0 ? m.peta_date_today() : formatIsoDate(iso, { weekday: 'short', day: 'numeric' });
			days.push({ label, iso });
		}
		return days;
	}

	const dateStrip = $derived(todayIso ? buildDateStrip(todayIso) : []);

	function addDaysIso(days: number): string | null {
		return todayIso ? addIsoDateDays(todayIso, days) : null;
	}

	const tomorrowIso = $derived(dateStrip[1]?.iso ?? addDaysIso(1));

	function formatDateChip(iso: string | null): string {
		if (!iso || iso === dateStrip[0]?.iso) return m.peta_filter_date_today();
		if (iso === tomorrowIso) return m.peta_filter_date_tomorrow();
		return formatIsoDate(iso, { day: 'numeric', month: 'short' });
	}

	function formatDateModeChip(): string {
		if (eventsView.selectedDateMode === 'today') return m.peta_filter_date_today();
		if (eventsView.selectedDateMode === 'tomorrow') return m.peta_filter_date_tomorrow();
		if (eventsView.selectedDateMode === 'week') return m.peta_filter_date_week();
		return formatDateChip(eventsView.selectedCustomDate);
	}

	function formatFullDate(iso: string): string {
		return formatIsoDate(iso, {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function buildCalendarGrid(monthDate: string): Array<{
		iso: string;
		label: string;
		inMonth: boolean;
	}> {
		const [year, month] = monthDate.split('-').map(Number);
		const firstWeekday = new Date(year, month - 1, 1, 12).getDay();
		const start = addIsoDateDays(monthDate, -firstWeekday);
		const days: Array<{ iso: string; label: string; inMonth: boolean }> = [];
		for (let i = 0; i < 42; i++) {
			const iso = addIsoDateDays(start, i);
			days.push({
				iso,
				label: formatIsoDate(iso, { day: 'numeric' }),
				inMonth: iso.slice(0, 7) === monthDate.slice(0, 7)
			});
		}
		return days;
	}

	function nextRadiusKm(current: number): number {
		return RADIUS_STEPS_KM.find((step) => step > current) ?? MAX_RADIUS_KM;
	}

	function previousMonth(): void {
		if (calendarMonth) calendarMonth = shiftCalendarMonth(calendarMonth, -1);
	}

	function nextMonth(): void {
		if (calendarMonth) calendarMonth = shiftCalendarMonth(calendarMonth, 1);
	}

	// ---------------------------------------------------------------------------
	// Svelte-query: cursor-paginated nearby feed (state-management.md rule)
	// ---------------------------------------------------------------------------

	const dateSelection = $derived({
		mode: eventsView.selectedDateMode,
		customDate: eventsView.selectedCustomDate
	});
	const activeDay = $derived(todayIso ? selectedIsoForMode(todayIso, dateSelection) : null);
	const dateRange = $derived(todayIso ? dateRangeForMode(todayIso, dateSelection) : null);
	const dateReady = $derived(activeDay != null && dateRange != null);

	const isManual = $derived(pref.active?.mode === 'manual');
	const regionId = $derived(pref.active?.mode === 'manual' ? pref.active.city.id : undefined);

	const queryArgs = $derived({
		lat: isManual ? undefined : location.center?.lat,
		lng: isManual ? undefined : location.center?.lng,
		radius_km: isManual ? undefined : eventsView.selectedRadiusKm,
		region_id: regionId,
		subject_id: eventsView.selectedSubjectId ?? undefined,
		date_from: dateRange?.date_from,
		date_to: dateRange?.date_to,
		expand: 'place',
		limit: 10
	});

	const query = defineNearbyInfiniteQuery(() => ({
		args: queryArgs,
		enabled: dateReady
	}));

	// Derived flat list from all pages.
	const events = $derived((query.data?.pages ?? []).flatMap((p) => p.data));

	const nearbyPlaceArgs = $derived({
		near_lat: isManual ? undefined : location.center?.lat,
		near_lng: isManual ? undefined : location.center?.lng,
		radius_km: isManual ? undefined : eventsView.selectedRadiusKm,
		region_id: regionId,
		is_active: true,
		limit: 30
	});
	const nearbyPlacesQuery = definePlaceListQuery(() => nearbyPlaceArgs, {
		enabled: () => browserReady,
		staleTime: 60_000
	});
	const nearbyPlaces = $derived(nearbyPlacesQuery.data?.data ?? []);

	const subjectQuery = defineSubjectListQuery(
		{ limit: 100, is_active: true },
		{ enabled: () => browserReady, staleTime: 5 * 60_000 }
	);
	const subjects = $derived((subjectQuery.data?.data ?? []) as SubjectResponse[]);
	const selectedSubject = $derived(
		subjects.find((subject) => subject.id === eventsView.selectedSubjectId) ?? null
	);

	const showLocationNotice = $derived(
		!locationNoticeDismissed &&
			(location.permission === 'denied' || location.permission === 'unavailable')
	);

	const queryContextKey = $derived(
		[
			activeDay ?? '',
			eventsView.selectedDateMode,
			eventsView.selectedCustomDate ?? '',
			eventsView.selectedRadiusKm,
			eventsView.selectedSubjectId ?? '',
			(location.center?.lat ?? 0).toFixed(5),
			(location.center?.lng ?? 0).toFixed(5)
		].join('|')
	);

	// ---------------------------------------------------------------------------
	// Place pins — grouped by mosque (v2: one pin per place, not per occurrence)
	// ---------------------------------------------------------------------------

	const eventPlacePins = $derived(
		groupOccurrencesToPlacePins(events as EventRecurringResponseWithPlace[], {
			now: m.pin_label_now(),
			later: m.pin_label_later()
		})
	);
	const placeOnlyPinsSource = $derived(
		query.isSuccess &&
			(eventsView.selectedSubjectId == null || emptySheetDismissedForKey === queryContextKey)
			? nearbyPlaces
			: []
	);
	const placePins = $derived(
		mergeNearbyPlacesWithEventPins(eventPlacePins, placeOnlyPinsSource, m.pin_label_place()).map(
			(pin) => ({
				...pin,
				selected: pin.id === eventsView.selectedPlaceId
			})
		)
	);

	// Map center + userLocation derived from location store.
	const mapCenter = $derived<[number, number]>([
		location.center?.lat ??
			(pref.active?.mode === 'manual' && pref.active.city.coordinates
				? pref.active.city.coordinates.lat
				: -6.732),
		location.center?.lng ??
			(pref.active?.mode === 'manual' && pref.active.city.coordinates
				? pref.active.city.coordinates.lng
				: 108.5523)
	]);
	const userLocation = $derived<[number, number] | undefined>(
		location.granted && location.center ? [location.center.lat, location.center.lng] : undefined
	);

	// ---------------------------------------------------------------------------
	// Filter chips — date + subject selectors
	// ---------------------------------------------------------------------------

	const filterChips = $derived<FilterChip[]>([
		{
			key: 'date',
			label: m.peta_filter_date_label({ value: formatDateModeChip() }),
			active: activeFilterSheet === 'date'
		},
		{
			key: 'subject',
			label: m.peta_filter_subject_label({
				value: selectedSubject ? l10n(selectedSubject.name) : m.peta_filter_subject_all()
			}),
			active: activeFilterSheet === 'subject'
		},
		{
			key: 'radius',
			label: m.peta_filter_radius_label({ value: eventsView.selectedRadiusKm }),
			active: activeFilterSheet === 'radius'
		}
	]);

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
	// Pin sheet data — built from a selected-place 7-day occurrence query.
	// ---------------------------------------------------------------------------
	const selectedPlaceRange = $derived(
		todayIso
			? {
					date_from: toDateRange(todayIso).date_from,
					date_to: toDateRange(addIsoDateDays(todayIso, 7)).date_to
				}
			: null
	);

	const selectedPlaceEventsQuery = defineEventListQuery(
		() => ({
			place_id: eventsView.selectedPlaceId ?? undefined,
			subject_id: eventsView.selectedSubjectId ?? undefined,
			date_from: selectedPlaceRange?.date_from,
			date_to: selectedPlaceRange?.date_to,
			expand: 'place,asatidz',
			limit: 30
		}),
		{
			enabled: () =>
				browserReady && eventsView.selectedPlaceId != null && selectedPlaceRange != null,
			staleTime: 60_000
		}
	);

	const selectedPlaceOccurrences = $derived(
		(selectedPlaceEventsQuery.data?.data ?? []) as EventRecurringResponseWithPlace[]
	);

	const selectedMapOccurrence = $derived(
		(events as EventRecurringResponseWithPlace[]).find(
			(e) => e.place?.id === eventsView.selectedPlaceId
		) ?? null
	);

	const selectedNearbyPlace = $derived(
		nearbyPlaces.find((place) => place.id === eventsView.selectedPlaceId) ?? null
	);
	const selectedSubjectLabel = $derived(selectedSubject ? l10n(selectedSubject.name) : '');

	const sheetPlace = $derived<SheetPlace | null>(
		(() => {
			const occurrence = selectedPlaceOccurrences[0] ?? selectedMapOccurrence;
			const place = occurrence?.place ?? selectedNearbyPlace;
			if (!place) return null;
			const distKm = typeof occurrence?.distance_km === 'number' ? occurrence.distance_km : null;
			return {
				name: l10n(place.name),
				distanceLabel: distKm != null ? formatDistance(distKm) : '',
				address: place.address ?? undefined
			};
		})()
	);

	const sheetEvents = $derived<SheetEvent[]>(
		selectedPlaceOccurrences
			.filter((e) => e.date_start != null)
			.map((e) => ({
				id: e.id,
				title: l10n(e.name),
				timeLabel: formatTime(e.date_start),
				anchorLabel: formatIsoDate(toLocalIsoDate(new Date(e.date_start)), {
					weekday: 'short',
					day: 'numeric',
					month: 'short'
				}),
				ustadzName: l10n(e.asatidz?.alias_name ?? e.asatidz?.name) || l10n(e.asatidz?.name),
				subjectLabel: selectedSubjectLabel || undefined,
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
	let lastQueryContextKey = $state<string | null>(null);

	const showEmptySheet = $derived(
		!query.isPending &&
			!query.isError &&
			events.length === 0 &&
			!showLocationNotice &&
			emptySheetDismissedForKey !== queryContextKey
	);

	$effect(() => {
		const key = queryContextKey;
		if (lastQueryContextKey !== null && lastQueryContextKey !== key) {
			eventsView.closeSheet();
			activePinDay = 'today';
		}
		lastQueryContextKey = key;
	});

	// ---------------------------------------------------------------------------
	// Navigation helpers
	// ---------------------------------------------------------------------------

	function navigateToEvent(occurrenceId: string | number): void {
		// Navigate to the EVENT series UUID, not the occurrence int id.
		// occurrences without a series event_id are not linkable.
		const occ = [
			...selectedPlaceOccurrences,
			...(events as EventRecurringResponseWithPlace[])
		].find((e) => e.id === occurrenceId);
		const eventId = occ?.event_id;
		if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
			// No valid series event_id — row should have been non-actionable; bail out.
			return;
		}
		goto(resolve('/(app)/kajian/[id]', { id: eventId }));
	}

	function navigateToPlace(placeId: string): void {
		goto(resolve('/(app)/tempat/[id]', { id: placeId }));
	}

	function chooseDateMode(mode: 'today' | 'tomorrow' | 'week'): void {
		eventsView.selectDateMode(mode);
		customDatePickerOpen = false;
		activeFilterSheet = null;
	}

	function chooseCustomDate(iso: string): void {
		eventsView.selectDateMode('custom', iso);
		customDatePickerOpen = false;
		activeFilterSheet = null;
	}

	function chooseSubject(id: string | null): void {
		eventsView.selectSubject(id);
		activeFilterSheet = null;
	}

	function expandRadius(): void {
		eventsView.expandRadius();
	}

	function selectRadius(radiusKm: number): void {
		eventsView.selectRadius(radiusKm);
		activeFilterSheet = null;
	}

	function handlePinClick(id: string | number): void {
		const placeId = typeof id === 'string' ? id : String(id);
		eventsView.selectPlace(placeId);
		activePinDay = dateModeToInitialPinDay(eventsView.selectedDateMode);
	}

	const calendarDays = $derived(calendarMonth ? buildCalendarGrid(calendarMonth) : []);
	const calendarMonthLabel = $derived(
		calendarMonth ? formatIsoDate(calendarMonth, { month: 'long', year: 'numeric' }) : ''
	);
	const weekdayLabels = getWeekdayLabels('id-ID');

	// ---------------------------------------------------------------------------
	// Ghost pins for cold-load state (scattered static positions, decorative)
	// ---------------------------------------------------------------------------

	const GHOST_PIN_DELAYS = ['0s', '0.3s', '0.6s', '0.9s', '1.2s'];

	onMount(() => {
		browserReady = true;
		const localToday = toLocalIsoDate(new Date());
		todayIso = localToday;
		calendarMonth = `${localToday.slice(0, 7)}-01`;
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
				onpinclick={handlePinClick}
			/>
		</ContentDim>
	{:else}
		<MapView
			center={mapCenter}
			zoom={13}
			pins={placePins}
			{userLocation}
			onpinclick={handlePinClick}
		/>
	{/if}

	<!-- ProgressStrip: background revalidation (data already loaded, now refreshing) -->
	{#if query.isFetching && !query.isPending}
		<div class="absolute top-0 right-0 left-0 z-[999]">
			<ProgressStrip class="h-1 w-full" />
		</div>
	{/if}

	<!-- Cold-load ghost pins + toast -->
	{#if query.isPending}
		<!-- Decorative ghost pins scattered over the map -->
		<div class="pointer-events-none absolute inset-0 z-[998]" aria-hidden="true">
			{#each GHOST_PIN_DELAYS as delay, i (i)}
				<div class="absolute" style="left: {20 + i * 15}%; top: {25 + (i % 3) * 20}%;">
					<GhostPin animationDelay={delay} />
				</div>
			{/each}
		</div>
		<!-- Toast: non-intrusive notification while loading -->
		<div class="absolute top-14 right-4 left-4 z-[999] flex justify-center">
			<MapToast message={m.peta_map_loading_toast()} loading={true} />
		</div>
	{/if}

	<!-- Error state: in-map bottom sheet -->
	{#if query.isError}
		<div
			class="edge-sheet edge-sheet--danger"
			role="alertdialog"
			aria-modal="false"
			aria-labelledby="peta-error-title"
			aria-describedby="peta-error-body"
		>
			<div class="edge-sheet__icon edge-sheet__icon--danger" aria-hidden="true">
				<GlobeOff class="size-5" />
			</div>
			<div class="edge-sheet__copy">
				<p id="peta-error-title" class="edge-sheet__title">
					{m.peta_map_error_title()}
				</p>
				<p id="peta-error-body" class="edge-sheet__body">{m.peta_map_error_body()}</p>
			</div>
			<button
				onclick={() => query.refetch()}
				class="edge-sheet__button edge-sheet__button--primary"
			>
				{m.peta_map_error_retry()}
			</button>
		</div>
	{/if}

	<!-- Location denied/unavailable: warm popup over the live map -->
	{#if showLocationNotice && !isManual}
		<div
			class="edge-sheet"
			role="status"
			aria-live="polite"
			aria-labelledby="peta-location-title"
			aria-describedby="peta-location-body"
		>
			<div class="edge-sheet__icon" aria-hidden="true">
				<MapPin class="size-5" />
			</div>
			<div class="edge-sheet__copy">
				<p id="peta-location-title" class="edge-sheet__title">
					{location.permission === 'denied'
						? m.peta_location_denied_title()
						: m.peta_location_unavailable_title()}
				</p>
				<p id="peta-location-body" class="edge-sheet__body">
					{m.peta_location_default_body()}
				</p>
			</div>
			<div class="edge-sheet__actions">
				<button
					class="edge-sheet__button edge-sheet__button--primary"
					onclick={() => {
						// GPS denied — no default fallback (plan: first-run flow §6)
						locationNoticeDismissed = true;
					}}
				>
					{m.peta_location_default_action()}
				</button>
				<button
					class="edge-sheet__button edge-sheet__button--secondary"
					onclick={() => {
						locationNoticeDismissed = false;
						location.requestGps();
					}}
				>
					{m.peta_location_retry_action()}
				</button>
			</div>
		</div>
	{/if}

	<!-- Empty state: in-map bottom sheet (resolved, 0 events) -->
	{#if showEmptySheet}
		<div
			class="empty-sheet"
			role="status"
			aria-live="polite"
			aria-labelledby="peta-empty-title"
			aria-describedby="peta-empty-body"
		>
			<div class="empty-sheet__head">
				<div class="edge-sheet__icon" aria-hidden="true">
					<MapIcon class="size-6" />
				</div>
				<div class="edge-sheet__copy">
					<p id="peta-empty-title" class="edge-sheet__title">{m.peta_map_empty_title()}</p>
					<p id="peta-empty-body" class="edge-sheet__body">
						{eventsView.selectedDateMode === 'week'
							? m.peta_map_empty_week_body({
									radius: eventsView.selectedRadiusKm,
									nextRadius: nextRadiusKm(eventsView.selectedRadiusKm)
								})
							: m.peta_map_empty_body({
									radius: eventsView.selectedRadiusKm,
									nextRadius: nextRadiusKm(eventsView.selectedRadiusKm)
								})}
					</p>
				</div>
			</div>
			<div class="edge-sheet__actions">
				<button
					class="edge-sheet__button edge-sheet__button--primary"
					onclick={expandRadius}
					disabled={eventsView.selectedRadiusKm >= MAX_RADIUS_KM}
				>
					{eventsView.selectedRadiusKm >= MAX_RADIUS_KM
						? m.peta_radius_max_action()
						: m.peta_radius_expand_action({
								radius: nextRadiusKm(eventsView.selectedRadiusKm)
							})}
				</button>
				<button
					class="edge-sheet__button edge-sheet__button--secondary"
					onclick={() => {
						emptySheetDismissedForKey = queryContextKey;
					}}
				>
					{m.peta_map_empty_places_action()}
				</button>
			</div>
		</div>
	{/if}

	<!-- Floating filter chips at map top -->
	<MapFilterChips
		chips={filterChips}
		onselect={(key) => {
			activeFilterSheet = activeFilterSheet === key ? null : (key as 'date' | 'subject' | 'radius');
		}}
	/>

	{#if activeFilterSheet === 'date'}
		<div class="filter-sheet" role="dialog" aria-label={m.peta_date_sheet_title()}>
			<div class="filter-sheet__header">
				<CalendarDays class="size-4" aria-hidden="true" />
				<span>{m.peta_date_sheet_title()}</span>
			</div>
			<div class="filter-sheet__options">
				<button
					class:active={eventsView.selectedDateMode === 'today'}
					onclick={() => chooseDateMode('today')}
				>
					{m.peta_filter_date_today()}
				</button>
				<button
					class:active={eventsView.selectedDateMode === 'tomorrow'}
					onclick={() => chooseDateMode('tomorrow')}
				>
					{m.peta_filter_date_tomorrow()}
				</button>
				<button
					class:active={eventsView.selectedDateMode === 'week'}
					onclick={() => chooseDateMode('week')}
				>
					{m.peta_filter_date_week()}
				</button>
				<button onclick={() => (customDatePickerOpen = !customDatePickerOpen)}>
					{m.peta_filter_date_custom()}
				</button>
			</div>
			{#if customDatePickerOpen}
				<div class="date-picker">
					<div class="date-picker__head">
						<button type="button" onclick={previousMonth} aria-label={m.peta_date_previous_month()}>
							<ChevronLeft class="size-4" aria-hidden="true" />
						</button>
						<span>{calendarMonthLabel}</span>
						<button type="button" onclick={nextMonth} aria-label={m.peta_date_next_month()}>
							<ChevronRight class="size-4" aria-hidden="true" />
						</button>
					</div>
					<div class="date-picker__weekdays" aria-hidden="true">
						{#each weekdayLabels as weekday (weekday)}
							<span>{weekday}</span>
						{/each}
					</div>
					<div class="date-picker__grid" role="grid" aria-label={m.peta_date_custom_grid_label()}>
						{#each calendarDays as day (day.iso)}
							<button
								type="button"
								class:outside={!day.inMonth}
								class:active={eventsView.selectedDateMode === 'custom' &&
									day.iso === eventsView.selectedCustomDate}
								aria-label={m.peta_date_pick_label({ date: formatFullDate(day.iso) })}
								onclick={() => chooseCustomDate(day.iso)}
							>
								{day.label}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if activeFilterSheet === 'subject'}
		<div
			class="filter-sheet filter-sheet--subject"
			role="dialog"
			aria-label={m.peta_subject_sheet_title()}
		>
			<div class="filter-sheet__header">
				<ListFilter class="size-4" aria-hidden="true" />
				<span>{m.peta_subject_sheet_title()}</span>
			</div>
			<div class="subject-list">
				<button
					class:active={eventsView.selectedSubjectId == null}
					onclick={() => chooseSubject(null)}
				>
					{m.peta_filter_subject_all()}
				</button>
				{#each subjects as subject (subject.id ?? subject.slug ?? l10n(subject.name))}
					{#if subject.id}
						<button
							class:active={eventsView.selectedSubjectId === subject.id}
							onclick={() => chooseSubject(subject.id ?? null)}
						>
							{l10n(subject.name)}
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
	{#if activeFilterSheet === 'radius'}
		<div
			class="filter-sheet filter-sheet--radius"
			role="dialog"
			aria-label={m.peta_radius_sheet_title()}
		>
			<div class="filter-sheet__header">
				<Radar class="size-4" aria-hidden="true" />
				<span>{m.peta_radius_sheet_title()}</span>
			</div>
			<p class="filter-sheet__lede">
				{isManual ? m.peta_radius_manual_body() : m.peta_radius_sheet_body()}
			</p>
			<div class="radius-options">
				{#each RADIUS_STEPS_KM as radius (radius)}
					<button
						class:active={!isManual && eventsView.selectedRadiusKm === radius}
						disabled={isManual}
						onclick={() => selectRadius(radius)}
					>
						{m.peta_filter_radius_label({ value: radius })}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- GPS FAB — bottom-right, lifts above pin sheet when open.
	     --map-fab-bottom inherited from the container via CSS variable cascade. -->
	<MapFab onlocate={() => location.requestGps()} loading={location.requesting} />

	<!-- Pin sheet — shown when a place is selected -->
	{#if eventsView.selectedPlaceId != null && sheetPlace != null}
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
	{/if}
</div>

<style>
	.edge-sheet,
	.empty-sheet,
	.filter-sheet {
		position: absolute;
		left: 12px;
		right: 12px;
		z-index: 999;
		background: color-mix(in srgb, var(--color-paper) 96%, white);
		border: 1px solid var(--color-line);
		box-shadow: var(--shadow-lg);
		backdrop-filter: blur(10px);
	}

	.edge-sheet,
	.empty-sheet {
		top: 50%;
		left: 50%;
		right: auto;
		width: min(calc(100% - 32px), 380px);
		transform: translate(-50%, -50%);
		border-radius: var(--radius-lg);
		padding: 14px;
	}

	.edge-sheet {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 10px;
		align-items: start;
	}

	.edge-sheet--danger {
		border-color: var(--color-danger-bg);
	}

	.edge-sheet__icon {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-sm);
		background: var(--color-orange-50);
		color: var(--color-orange-700);
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}

	.edge-sheet__icon--danger {
		background: var(--color-danger-bg);
		color: var(--color-danger-ink);
	}

	.edge-sheet__copy {
		min-width: 0;
	}

	.edge-sheet__title {
		margin: 0;
		color: var(--color-ink);
		font-size: 14px;
		font-weight: 800;
		line-height: 1.25;
	}

	.edge-sheet__body {
		margin: 3px 0 0;
		color: var(--color-ink-3);
		font-size: 12px;
		line-height: 1.45;
	}

	.edge-sheet__actions {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 2px;
	}

	.edge-sheet__button {
		min-height: 34px;
		border-radius: 17px;
		padding: 0 13px;
		border: 1px solid var(--color-line);
		font-family: inherit;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
	}

	.edge-sheet__button--primary {
		background: var(--color-ink);
		border-color: var(--color-ink);
		color: var(--color-paper);
	}

	.edge-sheet__button--secondary {
		background: var(--color-paper-2);
		color: var(--color-ink-2);
	}

	.edge-sheet__button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.edge-sheet__button:focus-visible,
	.filter-sheet button:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}

	.empty-sheet__head {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}

	.filter-sheet {
		top: 48px;
		border-radius: var(--radius);
		padding: 10px;
		max-height: min(420px, calc(100dvh - 8rem));
	}

	.filter-sheet--subject {
		max-height: min(460px, calc(100dvh - 8rem));
	}

	.filter-sheet__header {
		display: flex;
		align-items: center;
		gap: 7px;
		color: var(--color-ink);
		font-size: 12px;
		font-weight: 800;
		margin-bottom: 8px;
	}

	.filter-sheet__options,
	.subject-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.subject-list {
		overflow-y: auto;
		max-height: 340px;
		padding-right: 2px;
	}

	.filter-sheet__lede {
		margin: -2px 0 10px;
		color: var(--color-ink-3);
		font-size: 12px;
		line-height: 1.45;
	}

	.filter-sheet button {
		min-height: 36px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		color: var(--color-ink-2);
		font-family: inherit;
		font-size: 12px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 0 11px;
		cursor: pointer;
	}

	.filter-sheet button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.filter-sheet button.active {
		background: var(--color-ink);
		border-color: var(--color-ink);
		color: var(--color-paper);
	}

	.date-picker {
		margin-top: 10px;
		border-radius: var(--radius);
		background: var(--color-paper-2);
		padding: 10px;
	}

	.date-picker__head {
		display: grid;
		grid-template-columns: 36px 1fr 36px;
		align-items: center;
		gap: 6px;
		margin-bottom: 10px;
		color: var(--color-ink);
		font-size: 13px;
		font-weight: 800;
		text-align: center;
	}

	.date-picker__head button {
		min-height: 32px;
		justify-content: center;
		padding: 0;
		border-radius: 50%;
		background: var(--color-paper);
	}

	.date-picker__weekdays,
	.date-picker__grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 5px;
	}

	.date-picker__weekdays {
		margin-bottom: 6px;
		color: var(--color-ink-4);
		font-size: 10px;
		font-weight: 800;
		text-align: center;
		text-transform: uppercase;
	}

	.date-picker__grid button {
		min-height: 34px;
		justify-content: center;
		padding: 0;
		border-radius: 50%;
		background: var(--color-paper);
	}

	.date-picker__grid button.outside {
		color: var(--color-ink-4);
		opacity: 0.5;
	}

	.radius-options {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 6px;
	}

	.radius-options button {
		justify-content: center;
		padding: 0 6px;
	}

	@media (min-width: 640px) {
		.filter-sheet {
			left: 10px;
			right: auto;
			width: 320px;
		}
	}
</style>
