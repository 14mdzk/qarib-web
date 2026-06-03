<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import { m } from '$core/i18n';
	import { buildQueryClient } from '$core/query';
	import { Skeleton } from '$lib/shared/primitives';
	import EventCard from '$lib/domains/events/components/event-card.svelte';
	import { defineSubjectByIdQuery } from '$domains/subject/queries.js';
	import { defineOccurrencesByEventQuery } from '$domains/events/queries.js';
	import { deriveInitials } from '$lib/shared/utils/names.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Route param: subject UUID.
	const id: string = page.params.id!;

	// ---------------------------------------------------------------------------
	// QueryClient — page-local until QueryClientProvider is wired in root layout.
	// Same pattern as /ustadz. TODO(phase-D): replace with shared provider.
	// ---------------------------------------------------------------------------
	const qc = buildQueryClient({ staleTime: 60_000 });

	// ---------------------------------------------------------------------------
	// Svelte-query: subject header
	// ---------------------------------------------------------------------------
	const subjectQuery = defineSubjectByIdQuery(
		{ id, expand: '' },
		{
			get requestId() {
				return data.requestId;
			}
		},
		qc
	);

	// ---------------------------------------------------------------------------
	// Svelte-query: kajian for this subject
	// expand=place,asatidz so we can derive stat counts and ustadz carousel.
	// ---------------------------------------------------------------------------
	const kajianQuery = defineOccurrencesByEventQuery(
		{ subject_id: id, expand: 'place,asatidz', limit: 30 },
		{
			get requestId() {
				return data.requestId;
			}
		},
		qc
	);

	// ---------------------------------------------------------------------------
	// Derived state
	// ---------------------------------------------------------------------------
	const subject = $derived(subjectQuery.data ?? null);
	const kajianList = $derived(kajianQuery.data?.data ?? []);
	const isLoading = $derived(subjectQuery.isPending);
	const isError = $derived(subjectQuery.isError);

	/** Localise an L10nString (id first, then first available). */
	function l10n(map: Record<string, string> | null | undefined): string {
		if (!map) return '';
		return map['id'] ?? Object.values(map)[0] ?? '';
	}

	/**
	 * Stat row — derived from the loaded kajian list.
	 *
	 * Kajian count: total occurrences in the list.
	 * Ustadz count: unique asatidz_id values (non-null) across occurrences.
	 *   The occurrence carries asatidz_id (UUID) from its own override or
	 *   the parent series. We dedupe by asatidz_id.
	 * Masjid count: unique place_id values (non-null) across occurrences.
	 *   Same derivation pattern as ustadz.
	 *
	 * NOTE: asatidz_id / place_id on EventRecurringResponse are the override IDs
	 * (null when inherited from the series). When we expand=asatidz,place the
	 * effective resolved objects are present on the occurrence. We use the
	 * expanded objects' IDs for deduplication since they reflect effective values.
	 */
	const statKajian = $derived(kajianList.length);

	const statUstadz = $derived(() => {
		const seen = new SvelteSet<string>();
		for (const occ of kajianList) {
			// Use expanded asatidz.id when available (effective, resolved ID).
			const aid = occ.asatidz?.id ?? occ.asatidz_id ?? null;
			if (aid) seen.add(aid);
		}
		return seen.size;
	});

	const statMasjid = $derived(() => {
		const seen = new SvelteSet<string>();
		for (const occ of kajianList) {
			// Use expanded place.id when available (effective, resolved ID).
			const pid = occ.place?.id ?? occ.place_id ?? null;
			if (pid) seen.add(pid);
		}
		return seen.size;
	});

	/**
	 * Unique ustadz for the carousel — deduplicated by asatidz_id.
	 *
	 * Each item carries: id (for the /ustadz/[id] link) and display name.
	 * Derived from the expanded asatidz objects present on the kajian list.
	 * If the expanded object is absent, the occurrence is skipped (no name to show).
	 */
	const uniqueUstadzList = $derived(() => {
		const seen = new SvelteSet<string>();
		const result: Array<{ id: string; name: string }> = [];
		for (const occ of kajianList) {
			const asatidz = occ.asatidz;
			const aid = asatidz?.id ?? occ.asatidz_id ?? null;
			if (!aid || seen.has(aid)) continue;
			seen.add(aid);
			// Display name: prefer expanded asatidz name, fall back to id fragment.
			const displayName = l10n(asatidz?.alias_name ?? asatidz?.name) || l10n(asatidz?.name) || aid;
			result.push({ id: aid, name: displayName });
		}
		return result;
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
			<Skeleton class="rounded-radius h-4 w-24" />
			<Skeleton class="rounded-radius h-8 w-3/4" />
			<Skeleton class="rounded-radius h-14 w-full" />
			<Skeleton class="rounded-radius mt-2 h-16 w-full" />
			<Skeleton class="rounded-radius h-10 w-full" />
			<Skeleton class="rounded-radius h-20 w-full" />
			<Skeleton class="rounded-radius h-20 w-full" />
		</div>
	{:else if isError}
		<div class="py-10 text-center">
			<p class="text-ink font-bold">{m.tema_error_title()}</p>
			<p class="text-ink-3 mt-1 text-sm">{m.tema_error_body()}</p>
			<button
				class="bg-ink text-paper rounded-radius mt-4 px-4 py-2 text-sm font-semibold"
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
			<!--
				All three stats are derived from the kajian list (events.list?subject_id=id):
				- Kajian = total occurrences returned (kajianList.length)
				- Ustadz = count of unique asatidz IDs across occurrences (via expanded asatidz.id)
				- Masjid = count of unique place IDs across occurrences (via expanded place.id)
				SubjectResponse has no aggregate fields — this is a flag: derived from kajian list.
			-->
			<div
				class="border-line rounded-radius flex items-center justify-around border bg-[var(--color-paper-2)] py-4"
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
			<!--
				Unique ustadz among the kajian, deduped by asatidz_id.
				Each chip links to /ustadz/{asatidz_id} via resolve().
				Initials via deriveInitials() (strips "Ustadz " / "Ust." prefix).
				Only shown when at least one ustadz is resolvable from the list.
			-->
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
							<!--
								Link to /ustadz/{asatidz_id} — uses resolve() so the path
								stays correct if the app base path changes.
							-->
							<a
								href={resolve('/(app)/ustadz/[id]', { id: ustadz.id })}
								class="border-line bg-paper hover:bg-paper-2 rounded-radius-sm flex items-center gap-2 border px-2.5 py-1.5 transition-colors"
								data-testid="ustadz-mini-chip"
							>
								<!-- Initials circle -->
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

			<!-- ── Jadwal mendatang section ──────────────────────────────────────── -->
			<div data-testid="kajian-section">
				<div
					class="text-ink-3 mb-2.5 text-[11px] font-bold tracking-widest uppercase"
					data-testid="kajian-section-title"
				>
					{m.tema_kajian_section_title()}
				</div>

				<div class="flex flex-col gap-2">
					{#each kajianList as occurrence (occurrence.id)}
						<!--
							EventCard links to /kajian/{occurrence.event_id} (series UUID).
							The component derives `eventId` from `occurrence.event_id` internally
							and uses resolve('/(app)/kajian/[id]', { id: eventId }) for the href.
						-->
						<EventCard {occurrence} />
					{:else}
						<div class="border-line rounded-radius border p-4 text-center">
							<p class="text-ink-3 text-sm">{m.kajian_no_upcoming()}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
