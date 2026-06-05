<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$core/i18n';
	import { Skeleton } from '$lib/shared/primitives';
	import { defineSeriesByIdQuery, defineOccurrencesByEventQuery } from '$domains/events/queries.js';
	import { prayerIntToLabel } from '$lib/shared/utils/prayer.js';
	import { formatTime, formatDate } from '$lib/shared/utils/date.js';
	import { deriveInitials } from '$lib/shared/utils/names.js';
	import type { EventRecurringResponse } from '$domains/events/schema.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Route param: event series UUID. Non-null because SvelteKit guarantees
	// the [id] segment is present when this page matches.
	const id: string = page.params.id!;

	// ---------------------------------------------------------------------------
	// Svelte-query: series header (single fetch, not infinite)
	// ---------------------------------------------------------------------------
	// `data.requestId` is captured via a reactive getter to satisfy Svelte 5's
	// state_referenced_locally rule (the closure re-reads the prop on each query).
	const seriesQuery = defineSeriesByIdQuery(
		{ id, expand: 'place,asatidz' },
		{
			get requestId() {
				return data.requestId;
			},
			get initialData() {
				return data.seriesInitialData;
			}
		}
	);

	// ---------------------------------------------------------------------------
	// Svelte-query: upcoming occurrences for schedule strip
	// ---------------------------------------------------------------------------
	const today = new Date().toISOString().slice(0, 10);
	const occurrencesQuery = defineOccurrencesByEventQuery(
		{ event_id: id, date_from: today, expand: 'place,asatidz', limit: 20 },
		{
			get requestId() {
				return data.requestId;
			},
			get initialData() {
				return data.occurrencesInitialData ?? undefined;
			}
		}
	);

	// ---------------------------------------------------------------------------
	// Derived state
	// ---------------------------------------------------------------------------
	const series = $derived(seriesQuery.data ?? null);
	const occurrences = $derived(occurrencesQuery.data?.data ?? []);
	const isLoading = $derived(seriesQuery.isPending);
	const isError = $derived(seriesQuery.isError);

	/** Localise an L10nString (id first, then first available). */
	function l10n(map: Record<string, string> | null | undefined): string {
		if (!map) return '';
		return map['id'] ?? Object.values(map)[0] ?? '';
	}

	/** Next (nearest) occurrence — first item in the list. */
	const nextSession = $derived(occurrences[0] ?? null);

	/** Days until the next session (0 = today, 1 = tomorrow, etc.). */
	function daysUntil(dateStr: string | undefined): number {
		if (!dateStr) return 0;
		const start = new Date(dateStr);
		const now = new Date();
		const diffMs = start.getTime() - now.getTime();
		return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
	}

	/** Format the next-session countdown label. */
	function nextSessionLabel(dateStr: string | undefined): string {
		const d = daysUntil(dateStr);
		if (d === 0) return m.kajian_next_session_today();
		if (d === 1) return m.kajian_next_session_tomorrow();
		return m.kajian_next_session_days_away({ n: d });
	}

	/** Format "18:00 — 19:30 · Ba'da Maghrib" */
	function sessionTimeLabel(
		startStr: string | undefined,
		endStr: string | null | undefined,
		datePrayer: number | null | undefined
	): string {
		if (!startStr) return '';
		const start = formatTime(startStr);
		const end = endStr ? formatTime(endStr) : null;
		const prayer = prayerIntToLabel(datePrayer);
		const range = end ? `${start} — ${end}` : start;
		return prayer ? `${range} · ${prayer}` : range;
	}

	/** Build the 15-day calendar strip (date numbers with session flags). */
	function buildCalStrip(): { day: number; has: boolean; today: boolean }[] {
		const strip: { day: number; has: boolean; today: boolean }[] = [];
		const now = new Date();
		const sessionDays = new Set(
			occurrences
				.filter((o: EventRecurringResponse) => o.date_start != null)
				.map((o: EventRecurringResponse) => {
					const d = new Date(o.date_start as string);
					return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
				})
		);

		for (let i = 0; i < 15; i++) {
			// eslint-disable-next-line svelte/prefer-svelte-reactivity -- static non-reactive computation
			const d = new Date(now);
			d.setDate(d.getDate() + i);
			const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
			strip.push({
				day: d.getDate(),
				has: sessionDays.has(key),
				today: i === 0
			});
		}
		return strip;
	}

	const calStrip = $derived(buildCalStrip());

	/** WhatsApp share URL. */
	function waShareUrl(): string {
		if (typeof window === 'undefined') return '#';
		const title = l10n(series?.name);
		const url = window.location.href;
		const text = encodeURIComponent(`${title}\n${url}`);
		return `https://wa.me/?text=${text}`;
	}

	// Place and ustadz from the series (expanded).
	const place = $derived(series?.place ?? null);
	const asatidz = $derived(series?.asatidz ?? null);

	/** Initials for the ustadz avatar. */
	const asatidzInitials = $derived(asatidz ? deriveInitials(l10n(asatidz.name)) : '?');

	// Effective IDs for link targets.
	const placeId = $derived(series?.place_id ?? place?.id ?? null);
	const asatidzId = $derived(series?.asatidz_id ?? asatidz?.id ?? null);

	/** Series recurrence human label (from date_rule, simplified). */
	function recurrenceLabel(rule: string | null | undefined): string {
		if (!rule) return '';
		const r = rule.toUpperCase();
		if (r.includes('WEEKLY') || r.includes('FREQ=WEEKLY')) return 'Mingguan';
		if (r.includes('MONTHLY') || r.includes('FREQ=MONTHLY')) return 'Bulanan';
		if (r.includes('DAILY') || r.includes('FREQ=DAILY')) return 'Harian';
		return rule;
	}
</script>

<!--
  /kajian/[id] — Event detail page.
  Route param `id` = event series UUID.
  v2 port: EventDetail(hasPoster) from docs/design/hifi-v2.js.
  Width: centered readable column — per-route width ownership (no full-bleed for detail pages).
  Rule: styling.md, architecture.md, i18n.md, state-management.md
-->

<div class="mx-auto max-w-2xl px-4 pb-16">
	{#if isLoading}
		<!-- Loading skeleton mirrors the v2 EventDetail structure -->
		<div class="flex flex-col gap-4 pt-4">
			<Skeleton class="h-8 w-3/4 rounded" />
			<Skeleton class="h-4 w-1/2 rounded" />
			<Skeleton class="mt-2 h-28 rounded" />
			<Skeleton class="h-24 rounded" />
			<Skeleton class="h-20 rounded" />
		</div>
	{:else if isError}
		<div class="py-10 text-center">
			<p class="text-ink font-bold">{m.kajian_error_title()}</p>
			<p class="text-ink-3 mt-1 text-sm">{m.kajian_error_body()}</p>
			<button
				class="bg-ink text-paper mt-4 rounded px-4 py-2 text-sm font-semibold"
				onclick={() => seriesQuery.refetch()}
			>
				{m.kajian_error_retry()}
			</button>
		</div>
	{:else if series}
		<!-- ── Title block (poster variant not yet supported: series has no poster field in v1 spec) -->
		<div class="border-line border-b px-0 pt-4 pb-4" data-testid="kajian-title-block">
			<div class="mb-2 flex flex-wrap gap-1.5">
				{#if series.date_rule}
					<span
						class="rounded-sm border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
						>🔁 {recurrenceLabel(series.date_rule)}</span
					>
				{/if}
			</div>
			<h1
				class="text-ink text-2xl leading-tight font-extrabold tracking-tight"
				data-testid="kajian-title"
			>
				{l10n(series.name)}
			</h1>
			{#if series.description && l10n(series.description)}
				<p class="text-ink-3 mt-1 text-sm leading-relaxed">
					{l10n(series.description)}
				</p>
			{/if}
		</div>

		<!-- ── Scroll body ────────────────────────────────────────────────── -->
		<div class="flex flex-col gap-4 pt-4">
			<!-- Next session card (v2: .next-session) -->
			{#if nextSession}
				<div
					class="rounded border border-orange-100 bg-white p-3.5 shadow-sm"
					aria-label={m.kajian_next_session_label()}
					data-testid="next-session-card"
				>
					<div class="mb-1 text-[10.5px] font-bold tracking-widest text-orange-700 uppercase">
						{m.kajian_next_session_label()} · {nextSessionLabel(nextSession.date_start)}
					</div>
					<div class="text-ink mt-1 text-lg font-bold tracking-tight">
						{nextSession.date_start ? formatDate(nextSession.date_start) : ''}
					</div>
					<div class="text-ink-2 mt-0.5 text-sm">
						{sessionTimeLabel(
							nextSession.date_start,
							nextSession.date_end,
							nextSession.date_prayer
						)}
					</div>
					<div class="mt-3 flex gap-2">
						<!-- TODO(phase-E): wire ICS generation; calendar add is a placeholder -->
						<button
							class="bg-orange text-paper flex flex-1 items-center justify-center gap-1.5 rounded-sm px-4 py-2 text-sm font-semibold opacity-60"
							aria-label={m.kajian_add_to_calendar()}
							disabled
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
							{m.kajian_add_to_calendar()}
						</button>
						{#if place?.lat && place?.lng}
							<a
								href="https://maps.google.com/?q={place.lat},{place.lng}"
								target="_blank"
								rel="noopener noreferrer"
								class="border-line bg-paper-2 text-ink flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-sm border"
								aria-label={m.kajian_directions()}
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
							</a>
						{/if}
						<button
							class="border-line bg-paper-2 text-ink flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-sm border"
							aria-label={m.kajian_share()}
							onclick={() => {
								if (typeof navigator !== 'undefined' && navigator.share) {
									navigator.share({
										title: l10n(series?.name),
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
			{:else}
				<div class="border-line rounded border p-4 text-center">
					<p class="text-ink-3 text-sm">{m.kajian_no_upcoming()}</p>
				</div>
			{/if}

			<!-- Di mana & siapa (v2: .linked-rows) -->
			<div>
				<div class="text-ink-3 mb-2 text-[11px] font-bold tracking-widest uppercase">
					{m.kajian_where_who()}
				</div>
				<div class="border-line bg-paper overflow-hidden rounded border">
					<!-- Place row -->
					{#if place || placeId}
						<!-- eslint-disable svelte/no-navigation-without-resolve -- TODO(phase-D): /masjid route lands later -->
						<a
							href="/masjid/{placeId}"
							class="hover:bg-paper-2 flex cursor-pointer items-center gap-3 p-3.5 transition-colors"
							aria-label={l10n(place?.name) || 'Masjid'}
							data-testid="place-row"
						>
							<!-- TODO(phase-D2): place/ustadz routes — links resolve to intended paths when routes land -->
							<div
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-orange-50 text-lg font-bold text-orange-700"
							>
								🕌
							</div>
							<div class="min-w-0 flex-1">
								<div class="text-ink truncate text-sm leading-tight font-bold">
									{l10n(place?.name) || placeId || '—'}
								</div>
								{#if place?.address}
									<div class="text-ink-3 mt-0.5 truncate text-xs">
										{place.address}
									</div>
								{/if}
							</div>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-ink-4 shrink-0"
								aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg
							>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/if}

					<!-- Ustadz row -->
					{#if asatidz || asatidzId}
						<!-- eslint-disable svelte/no-navigation-without-resolve -- TODO(phase-D): /ustadz route lands later -->
						<a
							href="/ustadz/{asatidzId}"
							class="border-line hover:bg-paper-2 flex cursor-pointer items-center gap-3 border-t p-3.5 transition-colors"
							aria-label={l10n(asatidz?.name) || 'Ustadz'}
							data-testid="ustadz-row"
						>
							<!-- TODO(phase-D2): place/ustadz routes — links resolve to intended paths when routes land -->
							<div
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-orange-700"
							>
								{asatidzInitials}
							</div>
							<div class="min-w-0 flex-1">
								<div class="text-ink truncate text-sm leading-tight font-bold">
									{l10n(asatidz?.name) || asatidzId || '—'}
								</div>
								<div class="text-ink-3 mt-0.5 text-xs">{m.kajian_ustadz_label()}</div>
							</div>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-ink-4 shrink-0"
								aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg
							>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/if}
				</div>
			</div>

			<!-- Schedule strip: 15-day cal-strip (v2: .cal-strip) -->
			<div>
				<div
					class="text-ink-3 mb-2.5 flex items-baseline justify-between text-[11px] font-bold tracking-widest uppercase"
				>
					<span>{m.kajian_schedule_title()}</span>
					{#if series.date_rule}
						<span class="text-ink-4 text-[11px] font-normal tracking-normal normal-case">
							{m.kajian_schedule_every({ recurrence: recurrenceLabel(series.date_rule) })}
						</span>
					{/if}
				</div>
				<div
					class="grid grid-cols-[repeat(15,1fr)] gap-[3px]"
					aria-label={m.kajian_schedule_title()}
				>
					{#each calStrip as cell (cell.day)}
						<div
							class="flex aspect-square items-center justify-center rounded-[6px] text-[11px] font-medium"
							class:bg-orange={cell.has}
							class:text-white={cell.has}
							class:font-bold={cell.has}
							class:bg-paper-2={!cell.has}
							class:text-ink-3={!cell.has}
							style={cell.today && !cell.has
								? 'outline: 2px solid var(--color-ink); outline-offset: 1px;'
								: cell.today && cell.has
									? 'outline: 2px solid white; outline-offset: 1px;'
									: ''}
							aria-current={cell.today ? 'date' : undefined}
						>
							{cell.day}
						</div>
					{/each}
				</div>
				<!-- TODO(phase-E): open full calendar modal on click -->
				<button
					class="border-line bg-paper-2 text-ink mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-sm border py-2 text-sm font-semibold"
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
					{m.kajian_schedule_see_full()}
				</button>
			</div>

			<!-- About block (series description, v2: .about-block) -->
			{#if series.description && l10n(series.description)}
				<div class="pb-1">
					<div class="text-ink-3 mb-1.5 text-[10.5px] font-bold tracking-widest uppercase">
						{m.kajian_about_title()}
					</div>
					<p class="text-ink-2 text-sm leading-relaxed">
						{l10n(series.description)}
					</p>
				</div>
			{/if}

			<!-- Bagikan via WhatsApp (v2: .btn.wa) -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -- TODO(phase-D): /calendar route lands later; waShareUrl() returns external https://wa.me URL, resolve() not applicable -->
			<a
				href={waShareUrl()}
				target="_blank"
				rel="noopener noreferrer"
				class="flex w-full items-center justify-center gap-2 rounded py-2.5 text-sm font-semibold text-white"
				style="background: #25D366;"
				aria-label={m.kajian_share_whatsapp()}
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
				{m.kajian_share_whatsapp()}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{/if}
</div>
