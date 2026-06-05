<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { m, getLocale } from '$core/i18n';
	import { formatTime, formatDistance } from '$lib/shared/utils/date.js';
	import { prayerIntToLabel } from '$lib/shared/utils/prayer.js';
	import type { EventRecurringResponse, EventSeriesResponse } from '$domains/events/schema.js';
	import type { components } from '$generated/upstream';

	type PlaceResponse = components['schemas']['PlaceResponse'];

	interface Props {
		occurrence?: (EventRecurringResponse & { place?: PlaceResponse | null }) | null;
		series?: EventSeriesResponse | null;
		subjectName?: string | null;
		hidePlaceLink?: boolean;
		hideSubjectLink?: boolean;
		hideScholarLink?: boolean;
	}

	let {
		occurrence,
		series,
		subjectName = null,
		hidePlaceLink = false,
		hideSubjectLink = false,
		hideScholarLink = false
	}: Props = $props();

	const locale = $derived(getLocale());

	function localise(l10n: Record<string, string> | null | undefined): string {
		if (!l10n) return '';
		return l10n[locale] ?? l10n['id'] ?? Object.values(l10n)[0] ?? '';
	}

	const effectiveOccurrence = $derived(occurrence ?? series?.upcoming_occurrence ?? null);

	const title = $derived(
		localise(effectiveOccurrence?.name) || (series ? localise(series.name) : '')
	);

	const placeName = $derived(
		localise(effectiveOccurrence?.place?.name) || (series?.place ? localise(series.place.name) : '')
	);

	const timeText = $derived(
		effectiveOccurrence?.date_start
			? formatTime(effectiveOccurrence.date_start)
			: series?.date_start
				? formatTime(series.date_start)
				: ''
	);

	const prayerLabel = $derived(
		prayerIntToLabel(effectiveOccurrence?.date_prayer ?? series?.date_prayer)
	);

	const distanceLabel = $derived(
		effectiveOccurrence?.distance_km != null
			? formatDistance(effectiveOccurrence.distance_km)
			: null
	);

	const eventId = $derived(series?.id ?? effectiveOccurrence?.event_id ?? null);

	const asatidzName = $derived(
		localise(effectiveOccurrence?.asatidz?.alias_name ?? effectiveOccurrence?.asatidz?.name) ||
			localise(effectiveOccurrence?.asatidz?.name) ||
			localise(series?.asatidz?.alias_name ?? series?.asatidz?.name) ||
			localise(series?.asatidz?.name) ||
			''
	);

	const asatidzId = $derived(effectiveOccurrence?.asatidz_id ?? series?.asatidz_id ?? null);

	const placeId = $derived(effectiveOccurrence?.place_id ?? series?.place_id ?? null);

	const subjectId = $derived(series?.subject_id ?? null);

	const dateBadgeLabel = $derived(() => {
		const dateStr = effectiveOccurrence?.date_start ?? series?.date_start;
		if (!dateStr) return '';

		const date = new Date(dateStr);
		const now = new Date();
		const tomorrow = new Date(now.getTime() + 86400000);

		if (date.toDateString() === now.toDateString()) {
			return 'Hari Ini';
		}
		if (date.toDateString() === tomorrow.toDateString()) {
			return 'Besok';
		}

		return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
	});

	function handleScholarClick(e: MouseEvent) {
		if (asatidzId) {
			e.preventDefault();
			e.stopPropagation();
			goto(resolve('/(app)/ustadz/[id]', { id: asatidzId }));
		}
	}

	function handlePlaceClick(e: MouseEvent) {
		if (placeId) {
			e.preventDefault();
			e.stopPropagation();
			goto(resolve('/(app)/tempat/[id]', { id: placeId }));
		}
	}

	function handleSubjectClick(e: MouseEvent) {
		if (subjectId) {
			e.preventDefault();
			e.stopPropagation();
			goto(resolve('/(app)/tema/[id]', { id: subjectId }));
		}
	}
</script>

{#if eventId}
	<a
		href={resolve('/(app)/kajian/[id]', { id: eventId })}
		class="bg-surface-2 border-border hover:border-accent/45 hover:bg-surface-3/80 focus-visible:ring-primary flex gap-4 rounded-2xl border p-4 shadow-xs transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none"
		aria-label={title || m.event_card_aria_label()}
	>
		<!-- Left: Timebox -->
		<div
			class="border-border/60 bg-surface/50 flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border p-2"
		>
			{#if timeText}
				<span class="text-content text-xl leading-none font-extrabold tracking-tight"
					>{timeText}</span
				>
			{/if}
			{#if prayerLabel}
				<span class="text-primary mt-1 text-center text-[10px] leading-tight font-bold uppercase"
					>{prayerLabel}</span
				>
			{/if}
		</div>

		<!-- Right: Main Details -->
		<div class="flex min-w-0 flex-1 flex-col justify-center">
			<!-- Top Row: Date Badge + Subject Link -->
			<div class="flex flex-wrap items-center gap-2">
				{#if dateBadgeLabel()}
					<span
						class="inline-block rounded bg-orange-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-orange-700 uppercase"
					>
						{dateBadgeLabel()}
					</span>
				{/if}
				{#if subjectId && !hideSubjectLink && subjectName}
					<button
						type="button"
						class="text-blue inline-flex cursor-pointer items-center gap-1 text-left text-[11px] font-semibold transition-colors hover:underline"
						onclick={handleSubjectClick}
					>
						{subjectName}
					</button>
				{/if}
			</div>

			<!-- Title -->
			<h3
				class="text-content mt-1 line-clamp-2 text-base leading-snug font-bold tracking-tight sm:text-[17px]"
			>
				{title || m.event_card_untitled()}
			</h3>

			<!-- Bottom Row: Scholar & Place Metadata -->
			{#if asatidzName || placeName}
				<div class="text-content-3 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="text-content-4 shrink-0"
						><path
							d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
						/></svg
					>

					{#if asatidzName && !hideScholarLink}
						<button
							type="button"
							class="hover:text-orange cursor-pointer text-left font-medium hover:underline"
							onclick={handleScholarClick}
						>
							{asatidzName}
						</button>
					{:else}
						<span class="font-medium">{asatidzName}</span>
					{/if}

					{#if asatidzName && placeName}
						<span class="text-content-4">&bull;</span>
					{/if}

					{#if placeName && !hidePlaceLink}
						<button
							type="button"
							class="hover:text-orange cursor-pointer text-left font-medium hover:underline"
							onclick={handlePlaceClick}
						>
							{placeName}
						</button>
					{:else}
						<span class="font-medium">{placeName}</span>
					{/if}

					{#if distanceLabel}
						<span class="text-content-4 font-normal">({distanceLabel})</span>
					{/if}
				</div>
			{/if}
		</div>
	</a>
{:else}
	<div
		class="bg-surface-2 border-border flex gap-4 rounded-2xl border p-4 shadow-xs transition-all duration-200"
		aria-label={title || m.event_card_aria_label()}
	>
		<!-- Left: Timebox -->
		<div
			class="border-border/60 bg-surface/50 flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border p-2"
		>
			{#if timeText}
				<span class="text-content text-xl leading-none font-extrabold tracking-tight"
					>{timeText}</span
				>
			{/if}
			{#if prayerLabel}
				<span class="text-primary mt-1 text-center text-[10px] leading-tight font-bold uppercase"
					>{prayerLabel}</span
				>
			{/if}
		</div>

		<!-- Right: Main Details -->
		<div class="flex min-w-0 flex-1 flex-col justify-center">
			<!-- Top Row: Date Badge + Subject Link -->
			<div class="flex flex-wrap items-center gap-2">
				{#if dateBadgeLabel()}
					<span
						class="inline-block rounded bg-orange-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-orange-700 uppercase"
					>
						{dateBadgeLabel()}
					</span>
				{/if}
				{#if subjectId && !hideSubjectLink && subjectName}
					<button
						type="button"
						class="text-blue inline-flex cursor-pointer items-center gap-1 text-left text-[11px] font-semibold transition-colors hover:underline"
						onclick={handleSubjectClick}
					>
						{subjectName}
					</button>
				{/if}
			</div>

			<!-- Title -->
			<h3
				class="text-content mt-1 line-clamp-2 text-base leading-snug font-bold tracking-tight sm:text-[17px]"
			>
				{title || m.event_card_untitled()}
			</h3>

			<!-- Bottom Row: Scholar & Place Metadata -->
			{#if asatidzName || placeName}
				<div class="text-content-3 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="text-content-4 shrink-0"
						><path
							d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
						/></svg
					>

					{#if asatidzName && !hideScholarLink}
						<button
							type="button"
							class="hover:text-orange cursor-pointer text-left font-medium hover:underline"
							onclick={handleScholarClick}
						>
							{asatidzName}
						</button>
					{:else}
						<span class="font-medium">{asatidzName}</span>
					{/if}

					{#if asatidzName && placeName}
						<span class="text-content-4">&bull;</span>
					{/if}

					{#if placeName && !hidePlaceLink}
						<button
							type="button"
							class="hover:text-orange cursor-pointer text-left font-medium hover:underline"
							onclick={handlePlaceClick}
						>
							{placeName}
						</button>
					{:else}
						<span class="font-medium">{placeName}</span>
					{/if}

					{#if distanceLabel}
						<span class="text-content-4 font-normal">({distanceLabel})</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
