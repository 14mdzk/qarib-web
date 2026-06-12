<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$core/i18n';
	import { Skeleton } from '$lib/shared/primitives';
	import EventCard from './EventCard.svelte';
	import MonthCalendar from '$lib/shared/composites/month-calendar.svelte';
	import { defineAsatidzByIdQuery } from '$domains/asatidz/queries.js';
	import {
		defineSeriesListQuery,
		defineDomainCalendarQuery,
		deriveEventDates
	} from '$domains/events/queries.js';
	import { deriveInitials } from '$lib/shared/utils/names.js';
	import { toLocalIsoDate, addIsoDateDays, shiftCalendarMonth } from '$lib/shared/utils/date';
	import type { PageData } from './$types';
	import { l10n } from '$shared/utils/l10n';

	let { data }: { data: PageData } = $props();

	// Route param: asatidz UUID.
	const id: string = page.params.id!;

	// ---------------------------------------------------------------------------
	// Svelte-query: asatidz header
	// ---------------------------------------------------------------------------
	const asatidzQuery = defineAsatidzByIdQuery(
		{ id, expand: '' },
		{
			get requestId() {
				return data.requestId;
			},
			get initialData() {
				return data.asatidzInitialData;
			}
		}
	);

	// ---------------------------------------------------------------------------
	// Svelte-query: kajian for this asatidz
	// ---------------------------------------------------------------------------
	const kajianQuery = defineSeriesListQuery(
		{ asatidz_id: id, expand: 'place', limit: 20 },
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
	const asatidz = $derived(asatidzQuery.data ?? null);
	const kajianList = $derived(kajianQuery.data?.data ?? []);
	const isLoading = $derived(asatidzQuery.isPending);
	const isError = $derived(asatidzQuery.isError);
	/**
	 * Display name: prefer alias_name if present, fall back to name.
	 * Both are L10nString.
	 */
	const displayName = $derived(l10n(asatidz?.alias_name ?? asatidz?.name) || l10n(asatidz?.name));

	/**
	 * Initials for the avatar — strips the honorary "Ustadz " prefix.
	 */
	const initials = $derived(displayName ? deriveInitials(displayName) : '?');

	/**
	 * Bio text from the description field (L10nString|null).
	 * The AsatidzResponse schema has `description` (L10nString|null);
	 * it is used as the biography / "Tentang" text.
	 * specializations and location are NOT in the schema — those sections are omitted.
	 */
	const bioText = $derived(l10n(asatidz?.description));

	// ---------------------------------------------------------------------------
	// Calendar state
	// ---------------------------------------------------------------------------

	let showCalendar = $state(false);
	let calendarAnchor = $state(toLocalIsoDate(new Date()).substring(0, 7) + '-01');
	let activeCalendarDate = $state<string | null>(null);

	const monthStart = $derived(calendarAnchor);
	const monthEnd = $derived(shiftCalendarMonth(calendarAnchor, 1));

	const calendarDateFrom = $derived(addIsoDateDays(monthStart, -7));
	const calendarDateTo = $derived(addIsoDateDays(shiftCalendarMonth(monthEnd, 0), 7));

	const calendarQuery = defineDomainCalendarQuery(
		{
			domainType: 'asatidz',
			domainId: id,
			get dateFrom() {
				return calendarDateFrom;
			},
			get dateTo() {
				return calendarDateTo;
			}
		},
		{
			get enabled() {
				return showCalendar;
			}
		}
	);

	const eventDates = $derived(deriveEventDates(calendarQuery.data?.data ?? []));

	function handleCalendarDateClick(isoDate: string) {
		activeCalendarDate = isoDate;
		setTimeout(() => {
			document.getElementById('kajian-section')?.scrollIntoView({ behavior: 'smooth' });
		}, 100);
	}

	function resetCalendarFilter() {
		activeCalendarDate = null;
	}

	const filteredKajianList = $derived.by(() => {
		if (!activeCalendarDate) return null;
		// Get event_ids from calendar occurrences on the clicked date
		const occurrencesOnDate = (calendarQuery.data?.data ?? []).filter(
			(occ) => occ.date_start?.substring(0, 10) === activeCalendarDate
		);
		const seriesIdsOnDate = new Set(occurrencesOnDate.map((occ) => occ.event_id));
		// Filter the series list to matching series
		return kajianList.filter((series) => seriesIdsOnDate.has(series.id));
	});
</script>

<!--
  /ustadz/[id] — Asatidz (ustadz) detail page.
  Route param `id` = asatidz UUID.
  v2 port: UstadzDetail() from docs/design/hifi-v2.js.
  Width: centered readable column — per-route width ownership.
  Rule: styling.md, architecture.md, i18n.md, state-management.md

  Schema gaps (fields from v2 spec NOT present in AsatidzResponse):
    - specializations / subjects → spec-pill section omitted gracefully
    - location / city            → location sub-line omitted gracefully
  Only description (L10nString|null) is used as bio substitute.
-->

<div class="mx-auto max-w-2xl px-4 pb-16">
	{#if isLoading}
		<!-- Loading skeleton mirrors the v2 UstadzDetail structure -->
		<div class="flex flex-col items-center gap-4 pt-8">
			<Skeleton class="h-24 w-24 rounded-full" />
			<Skeleton class="h-4 w-16" />
			<Skeleton class="h-8 w-2/3" />
			<Skeleton class="h-4 w-1/2" />
			<Skeleton class="mt-2 h-24 w-full rounded" />
			<Skeleton class="h-20 w-full rounded" />
			<Skeleton class="h-20 w-full rounded" />
		</div>
	{:else if isError}
		<div class="py-10 text-center">
			<p class="text-ink font-bold">{m.ustadz_error_title()}</p>
			<p class="text-ink-3 mt-1 text-sm">{m.ustadz_error_body()}</p>
			<button
				class="bg-ink text-paper mt-4 rounded px-4 py-2 text-sm font-semibold"
				onclick={() => asatidzQuery.refetch()}
			>
				{m.ustadz_error_retry()}
			</button>
		</div>
	{:else if asatidz}
		<!-- ── Centered hero: avatar + name ──────────────────────────────────── -->
		<div class="pt-8 text-center" data-testid="ustadz-hero">
			<div
				class="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-white text-4xl font-extrabold tracking-tight"
				style="background: linear-gradient(135deg, var(--color-orange-100) 0%, var(--color-orange-50) 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.1); color: var(--color-orange-700); letter-spacing: -0.03em;"
				aria-hidden="true"
				data-testid="ustadz-avatar"
			>
				{initials}
			</div>

			<div
				class="text-ink-3 mt-3.5 text-[10.5px] font-bold tracking-widest uppercase"
				data-testid="ustadz-eyebrow"
			>
				{m.ustadz_eyebrow()}
			</div>

			<h1
				class="text-ink mt-0.5 text-2xl leading-tight font-extrabold tracking-tight"
				data-testid="ustadz-name"
			>
				{displayName}
			</h1>

			<p class="text-ink-3 mt-1 text-sm" data-testid="ustadz-sub-line">
				{m.ustadz_sub_line({ n: kajianList.length })}
			</p>
		</div>

		<!-- ── Scroll body ────────────────────────────────────────────────────── -->
		<div class="flex flex-col gap-4 pt-5">
			<!-- "Tentang" about block — only when bio text is available -->
			{#if bioText}
				<div
					class="border-line rounded border bg-[var(--color-paper-2)] p-3.5"
					data-testid="ustadz-about"
				>
					<div class="text-ink-3 mb-1.5 text-[10.5px] font-bold tracking-widest uppercase">
						{m.ustadz_about_title()}
					</div>
					<p class="text-ink-2 text-[13.5px] leading-[1.55]">
						{bioText}
					</p>
				</div>
			{/if}

			<!-- ── Calendar toggle button ────────────────────────────────────────── -->
			<button
				class="border-line bg-paper-2 text-ink flex w-full items-center justify-center gap-2 rounded-sm border py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--color-orange-50)]"
				data-testid="calendar-toggle-btn"
				onclick={() => {
					showCalendar = !showCalendar;
					if (!showCalendar) {
						activeCalendarDate = null;
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
					><rect width="18" height="18" x="3" y="4" rx="2" /><line
						x1="16"
						y1="2"
						x2="16"
						y2="6"
					/><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg
				>
				{showCalendar ? m.calendar_toggle_list() : m.calendar_toggle_calendar()}
			</button>

			<!-- ── MonthCalendar (when toggled on) ──────────────────────────────── -->
			{#if showCalendar}
				<MonthCalendar
					domainName={displayName}
					{eventDates}
					loading={calendarQuery.isPending}
					error={calendarQuery.isError ? m.calendar_error_body() : null}
					onRetry={() => calendarQuery.refetch()}
					onDateClick={handleCalendarDateClick}
				/>
			{/if}

			<!-- Kajian aktif section -->
			<div id="kajian-section" data-testid="kajian-section">
				<div
					class="text-ink-3 mb-2.5 flex items-baseline justify-between text-[11px] font-bold tracking-widest uppercase"
				>
					<span
						>{activeCalendarDate
							? m.calendar_date_label({ date: activeCalendarDate })
							: m.ustadz_kajian_section_title()}</span
					>
					{#if activeCalendarDate}
						<button
							class="text-orange cursor-pointer text-[11px] font-semibold normal-case"
							onclick={resetCalendarFilter}
							data-testid="calendar-reset-btn"
						>
							{m.calendar_toggle_list()}
						</button>
					{:else if kajianList.length > 0}
						<span class="text-ink-4 text-[11px] font-normal tracking-normal normal-case">
							{m.ustadz_kajian_count({ n: kajianList.length })}
						</span>
					{/if}
				</div>

				<div class="flex flex-col gap-3">
					{#if activeCalendarDate && (filteredKajianList ?? []).length === 0}
						<div class="border-line rounded border p-4 text-center">
							<p class="text-ink-3 text-sm">{m.kajian_no_upcoming()}</p>
						</div>
					{:else}
						{#each filteredKajianList ?? kajianList as series (series.id)}
							<EventCard {series} />
						{:else}
							<div class="border-line rounded border p-4 text-center">
								<p class="text-ink-3 text-sm">{m.kajian_no_upcoming()}</p>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
