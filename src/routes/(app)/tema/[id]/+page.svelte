<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import { m } from '$core/i18n';
	import { Skeleton } from '$lib/shared/primitives';
	import EventCard from '$lib/domains/events/components/event-card.svelte';
	import MonthCalendar from '$lib/shared/composites/month-calendar.svelte';
	import { defineSubjectByIdQuery } from '$domains/subject/queries.js';
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

	// Route param: subject UUID.
	const id: string = page.params.id!;

	// ---------------------------------------------------------------------------
	// Svelte-query: subject header
	// ---------------------------------------------------------------------------
	const subjectQuery = defineSubjectByIdQuery(
		{ id, expand: '' },
		{
			get requestId() {
				return data.requestId;
			},
			get initialData() {
				return data.subjectInitialData;
			}
		}
	);

	// ---------------------------------------------------------------------------
	// Svelte-query: kajian for this subject
	// expand=place,asatidz so we can derive stat counts and ustadz carousel.
	// ---------------------------------------------------------------------------
	const kajianQuery = defineSeriesListQuery(
		{ subject_id: id, expand: 'place,asatidz', limit: 30 },
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
	const subject = $derived(subjectQuery.data ?? null);
	const kajianList = $derived(kajianQuery.data?.data ?? []);
	const isLoading = $derived(subjectQuery.isPending);
	const isError = $derived(subjectQuery.isError);

	/**
	 * Stat row — derived from the loaded kajian list.
	 *
	 * Kajian count: total series templates in the list.
	 * Ustadz count: unique asatidz_id values (non-null) across series.
	 * Masjid count: unique place_id values (non-null) across series.
	 */
	const statKajian = $derived(kajianList.length);

	const statUstadz = $derived(() => {
		const seen = new SvelteSet<string>();
		for (const series of kajianList) {
			const aid = series.asatidz?.id ?? series.asatidz_id ?? null;
			if (aid) seen.add(aid);
		}
		return seen.size;
	});

	const statMasjid = $derived(() => {
		const seen = new SvelteSet<string>();
		for (const series of kajianList) {
			const pid = series.place?.id ?? series.place_id ?? null;
			if (pid) seen.add(pid);
		}
		return seen.size;
	});

	/**
	 * Unique ustadz for the carousel — deduplicated by asatidz_id.
	 *
	 * Each item carries: id (for the /ustadz/[id] link) and display name.
	 * Derived from the expanded asatidz objects present on the kajian list.
	 */
	const uniqueUstadzList = $derived(() => {
		const seen = new SvelteSet<string>();
		const result: Array<{ id: string; name: string }> = [];
		for (const series of kajianList) {
			const asatidz = series.asatidz;
			const aid = asatidz?.id ?? series.asatidz_id ?? null;
			if (!aid || seen.has(aid)) continue;
			seen.add(aid);
			// Display name: prefer expanded asatidz name, fall back to id fragment.
			const displayName = l10n(asatidz?.alias_name ?? asatidz?.name) || l10n(asatidz?.name) || aid;
			result.push({ id: aid, name: displayName });
		}
		return result;
	});

	// ---------------------------------------------------------------------------
	// Calendar state
	// ---------------------------------------------------------------------------

	let showCalendar = $state(false);
	let calendarAnchor = $state(toLocalIsoDate(new Date()).substring(0, 7) + '-01');
	let activeCalendarDate = $state<string | null>(null);

	/** Date range with ±7 day padding around the month being viewed. */
	const monthStart = $derived(calendarAnchor);
	const monthEnd = $derived(shiftCalendarMonth(calendarAnchor, 1));

	const calendarDateFrom = $derived(addIsoDateDays(monthStart, -7));
	const calendarDateTo = $derived(addIsoDateDays(shiftCalendarMonth(monthEnd, 0), 7));

	const calendarQuery = defineDomainCalendarQuery(
		{
			domainType: 'subject',
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
		// Scroll to the kajian section
		setTimeout(() => {
			document.getElementById('kajian-section')?.scrollIntoView({ behavior: 'smooth' });
		}, 100);
	}

	function resetCalendarFilter() {
		activeCalendarDate = null;
	}

	/** Filtered kajian list when a calendar date is active. */
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
  /tema/[id] — Subject (tema kajian) detail page.
  Route param `id` = subject UUID.
  v2 port: SubjectDetail() from docs/design/hifi-v2.js.
  Width: centered readable column — per-route width ownership.
  Rule: styling.md, architecture.md, i18n.md, state-management.md

  Schema gaps (fields from v2 spec NOT present in SubjectResponse):
    - stat counts (kajian/ustadz/masjid)  → derived from kajian list at load time
    - ustadz carousel data               → derived from kajian list (expand=place,asatidz)
  Only name (L10nString) and description (L10nString|null) are in SubjectResponse.
-->

<div class="mx-auto max-w-2xl px-4 pb-16">
	{#if isLoading}
		<!-- Loading skeleton mirrors the v2 SubjectDetail structure -->
		<div class="flex flex-col gap-4 pt-6">
			<Skeleton class="h-4 w-24 rounded" />
			<Skeleton class="h-8 w-3/4 rounded" />
			<Skeleton class="h-14 w-full rounded" />
			<Skeleton class="mt-2 h-16 w-full rounded" />
			<Skeleton class="h-10 w-full rounded" />
			<Skeleton class="h-20 w-full rounded" />
			<Skeleton class="h-20 w-full rounded" />
		</div>
	{:else if isError}
		<div class="py-10 text-center">
			<p class="text-ink font-bold">{m.tema_error_title()}</p>
			<p class="text-ink-3 mt-1 text-sm">{m.tema_error_body()}</p>
			<button
				class="bg-ink text-paper mt-4 rounded px-4 py-2 text-sm font-semibold"
				onclick={() => subjectQuery.refetch()}
			>
				{m.tema_error_retry()}
			</button>
		</div>
	{:else if subject}
		<!-- ── Subject header: kicker + title + description ──────────────────── -->
		<div class="border-line border-b pt-6 pb-4" data-testid="subject-header">
			<!-- Kicker "Tema Kajian" -->
			<div
				class="text-ink-3 text-[10.5px] font-bold tracking-widest uppercase"
				data-testid="subject-kicker"
			>
				{m.tema_kicker()}
			</div>

			<!-- Subject name -->
			<h1
				class="text-ink mt-1 text-2xl leading-tight font-extrabold tracking-tight"
				data-testid="subject-name"
			>
				{l10n(subject.name)}
			</h1>

			<!-- Description — rendered only when present -->
			{#if l10n(subject.description)}
				<p class="text-ink-2 mt-2 text-[13.5px] leading-[1.55]" data-testid="subject-description">
					{l10n(subject.description)}
				</p>
			{/if}
		</div>

		<!-- ── Scroll body ────────────────────────────────────────────────────── -->
		<div class="flex flex-col gap-5 pt-4">
			<!-- ── Stat row: Kajian · Ustadz · Masjid ──────────────────────────── -->
			<div
				class="border-line flex items-center justify-around rounded border bg-[var(--color-paper-2)] py-4"
				data-testid="stat-row"
			>
				<div class="flex flex-col items-center gap-0.5" data-testid="stat-kajian">
					<span class="text-ink text-xl font-extrabold tracking-tight">{statKajian}</span>
					<span class="text-ink-3 text-[11px] font-semibold tracking-wide"
						>{m.tema_stat_kajian()}</span
					>
				</div>
				<div class="border-line h-8 border-l" aria-hidden="true"></div>
				<div class="flex flex-col items-center gap-0.5" data-testid="stat-ustadz">
					<span class="text-ink text-xl font-extrabold tracking-tight">{statUstadz()}</span>
					<span class="text-ink-3 text-[11px] font-semibold tracking-wide"
						>{m.tema_stat_ustadz()}</span
					>
				</div>
				<div class="border-line h-8 border-l" aria-hidden="true"></div>
				<div class="flex flex-col items-center gap-0.5" data-testid="stat-masjid">
					<span class="text-ink text-xl font-extrabold tracking-tight">{statMasjid()}</span>
					<span class="text-ink-3 text-[11px] font-semibold tracking-wide"
						>{m.tema_stat_masjid()}</span
					>
				</div>
			</div>

			<!-- ── Ustadz mini carousel ──────────────────────────────────────────── -->
			{#if uniqueUstadzList().length > 0}
				<div data-testid="ustadz-carousel">
					<div
						class="text-ink-3 mb-2.5 text-[11px] font-bold tracking-widest uppercase"
						data-testid="ustadz-carousel-title"
					>
						{m.tema_ustadz_section_title()}
					</div>
					<div class="flex flex-wrap gap-2">
						{#each uniqueUstadzList() as ustadz (ustadz.id)}
							<a
								href={resolve('/(app)/ustadz/[id]', { id: ustadz.id })}
								class="border-line bg-paper hover:bg-paper-2 flex items-center gap-2 rounded-sm border px-2.5 py-1.5 transition-colors"
								data-testid="ustadz-mini-chip"
							>
								<span
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
									style="background: linear-gradient(135deg, var(--color-orange-100) 0%, var(--color-orange-50) 100%); color: var(--color-orange-700);"
									aria-hidden="true"
								>
									{deriveInitials(ustadz.name)}
								</span>
								<span class="text-ink max-w-[120px] truncate text-xs font-semibold"
									>{ustadz.name}</span
								>
							</a>
						{/each}
					</div>
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
					domainName={l10n(subject.name || subjectQuery.data?.name)}
					{eventDates}
					loading={calendarQuery.isPending}
					error={calendarQuery.isError ? m.calendar_error_body() : null}
					activeDate={activeCalendarDate}
					onRetry={() => calendarQuery.refetch()}
					onDateClick={handleCalendarDateClick}
				/>
			{/if}

			<!-- ── Jadwal mendatang section ──────────────────────────────────────── -->
			<div id="kajian-section" data-testid="kajian-section">
				<div
					class="text-ink-3 mb-2.5 flex items-baseline justify-between text-[11px] font-bold tracking-widest uppercase"
					data-testid="kajian-section-title"
				>
					<span>
						{activeCalendarDate ? m.kajian_next_session_today() : m.tema_kajian_section_title()}
					</span>
					{#if activeCalendarDate}
						<button
							class="text-orange cursor-pointer text-[11px] font-semibold normal-case"
							onclick={resetCalendarFilter}
							data-testid="calendar-reset-btn"
						>
							{m.calendar_toggle_list()}
						</button>
					{/if}
				</div>

				{#if activeCalendarDate}
					<p class="text-ink-4 mb-2 text-xs">
						{m.calendar_date_label({ date: activeCalendarDate })}
					</p>
				{/if}

				<div class="flex flex-col gap-2">
					{#if activeCalendarDate && (filteredKajianList ?? []).length === 0}
						<div class="border-line rounded border p-4 text-center">
							<p class="text-ink-3 text-sm">{m.kajian_no_upcoming()}</p>
						</div>
					{:else}
						{#each filteredKajianList ?? kajianList as series (series.id)}
							<EventCard {series} hideSubjectLink={true} />
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
