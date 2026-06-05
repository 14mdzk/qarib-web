<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$core/i18n';
	import { Skeleton } from '$lib/shared/primitives';
	import EventCard from './EventCard.svelte';
	import { defineAsatidzByIdQuery } from '$domains/asatidz/queries.js';
	import { defineSeriesListQuery } from '$domains/events/queries.js';
	import { deriveInitials } from '$lib/shared/utils/names.js';
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
			<!--
				.avatar-big from v2 spec:
				96 × 96 circle, orange gradient bg, large initials.
			-->
			<div
				class="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-white text-4xl font-extrabold tracking-tight"
				style="background: linear-gradient(135deg, var(--color-orange-100) 0%, var(--color-orange-50) 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.1); color: var(--color-orange-700); letter-spacing: -0.03em;"
				aria-hidden="true"
				data-testid="ustadz-avatar"
			>
				{initials}
			</div>

			<!-- Eyebrow "Ustadz" label -->
			<div
				class="text-ink-3 mt-3.5 text-[10.5px] font-bold tracking-widest uppercase"
				data-testid="ustadz-eyebrow"
			>
				{m.ustadz_eyebrow()}
			</div>

			<!-- Name -->
			<h1
				class="text-ink mt-0.5 text-2xl leading-tight font-extrabold tracking-tight"
				data-testid="ustadz-name"
			>
				{displayName}
			</h1>

			<!-- Sub line: kajian count -->
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

			<!--
				"Spesialisasi" spec-pills section is OMITTED.
				AsatidzResponse has no specializations/subjects field.
				Rendering only what exists — schema gap noted in schema.ts.
			-->

			<!-- Kajian aktif section -->
			<div data-testid="kajian-section">
				<div
					class="text-ink-3 mb-2.5 flex items-baseline justify-between text-[11px] font-bold tracking-widest uppercase"
				>
					<span>{m.ustadz_kajian_section_title()}</span>
					{#if kajianList.length > 0}
						<span class="text-ink-4 text-[11px] font-normal tracking-normal normal-case">
							{m.ustadz_kajian_count({ n: kajianList.length })}
						</span>
					{/if}
				</div>

				<div class="flex flex-col gap-3">
					{#each kajianList as series (series.id)}
						<EventCard {series} />
					{:else}
						<div class="border-line rounded border p-4 text-center">
							<p class="text-ink-3 text-sm">{m.kajian_no_upcoming()}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
