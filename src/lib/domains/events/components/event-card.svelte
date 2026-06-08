<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { m, getLocale } from '$core/i18n';
	import { formatTime, formatDistance } from '$lib/shared/utils/date.js';
	import { prayerIntToLabel } from '$lib/shared/utils/prayer.js';
	import type { EventRecurringResponse, EventSeriesResponse } from '$domains/events/schema.js';
	import type { components } from '$generated/upstream';
	import { MapPin } from '@lucide/svelte';

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

	const href = $derived(eventId ? resolve('/(app)/kajian/[id]', { id: eventId }) : null);

	const dateBadgeLabel = $derived(
		(() => {
			const dateStr = effectiveOccurrence?.date_start ?? series?.date_start;
			if (!dateStr) return '';

			const date = new Date(dateStr);
			const now = new Date();
			const tomorrow = new Date(now.getTime() + 86400000);

			if (date.toDateString() === now.toDateString()) {
				return m.event_card_date_today();
			}
			if (date.toDateString() === tomorrow.toDateString()) {
				return m.event_card_date_tomorrow();
			}

			return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
		})()
	);

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

<article class="event-card" aria-label={!href ? title || m.event_card_aria_label() : undefined}>
	{#if href}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is derived with resolve('/(app)/kajian/[id]', { id }). -->
		<a {href} class="event-card__main-link" aria-label={title || m.event_card_aria_label()}></a>
	{/if}

	<div class="time-block">
		{#if timeText}
			<span class="time-block__time">{timeText}</span>
		{/if}
		{#if prayerLabel}
			<span class="time-block__anchor">{prayerLabel}</span>
		{/if}
	</div>

	<div class="event-card__body">
		<div class="event-card__tags">
			{#if dateBadgeLabel}
				<span class="date-tag">{dateBadgeLabel}</span>
			{/if}
			{#if subjectId && !hideSubjectLink && subjectName}
				<button type="button" class="subject-pill" onclick={handleSubjectClick}>
					{subjectName}
				</button>
			{:else if subjectName}
				<span class="subject-pill subject-pill--static">{subjectName}</span>
			{/if}
		</div>

		<h3 class="event-card__title">
			{title || m.event_card_untitled()}
		</h3>

		{#if asatidzName || placeName}
			<div class="event-card__meta">
				<MapPin class="event-card__meta-icon" aria-hidden="true" />

				{#if asatidzName && !hideScholarLink}
					<button type="button" class="meta-action" onclick={handleScholarClick}>
						{asatidzName}
					</button>
				{:else}
					<span class="meta-text">{asatidzName}</span>
				{/if}

				{#if asatidzName && placeName}
					<span class="meta-dot" aria-hidden="true"></span>
				{/if}

				{#if placeName && !hidePlaceLink}
					<button type="button" class="meta-action" onclick={handlePlaceClick}>
						{placeName}
					</button>
				{:else}
					<span class="meta-text">{placeName}</span>
				{/if}

				{#if distanceLabel}
					<span class="distance-pill">{distanceLabel}</span>
				{/if}
			</div>
		{/if}
	</div>
</article>

<style>
	.event-card {
		position: relative;
		display: flex;
		gap: 12px;
		padding: 12px;
		background: var(--color-paper);
		border: 1px solid var(--color-line);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm);
		transition:
			box-shadow var(--duration-base),
			transform var(--duration-base),
			border-color var(--duration-base);
	}

	.event-card:has(.event-card__main-link:hover) {
		border-color: var(--color-orange-100);
		box-shadow: var(--shadow);
		transform: translateY(-1px);
	}

	.event-card__main-link {
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: var(--radius);
	}

	.event-card__main-link:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}

	.time-block {
		position: relative;
		z-index: 2;
		flex-shrink: 0;
		width: 60px;
		border-radius: var(--radius-sm);
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 6px 4px;
		pointer-events: none;
	}

	.time-block__time {
		color: var(--color-ink);
		font-size: 16px;
		font-weight: 800;
		letter-spacing: 0;
		line-height: 1;
	}

	.time-block__anchor {
		color: var(--color-orange-700);
		font-size: 9.5px;
		font-weight: 800;
		letter-spacing: 0.04em;
		line-height: 1.1;
		margin-top: 4px;
		text-align: center;
		text-transform: uppercase;
	}

	.event-card__body {
		position: relative;
		z-index: 2;
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		pointer-events: none;
	}

	.event-card__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
	}

	.date-tag,
	.subject-pill {
		border-radius: 4px;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.03em;
		line-height: 1.2;
		text-transform: uppercase;
	}

	.date-tag {
		background: var(--color-orange-50);
		color: var(--color-orange-700);
		padding: 2px 7px;
	}

	.subject-pill {
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		color: var(--color-ink-2);
		padding: 2px 7px;
		font-family: inherit;
		pointer-events: auto;
		cursor: pointer;
	}

	.subject-pill--static {
		pointer-events: none;
		cursor: default;
	}

	.event-card__title {
		margin: 0;
		color: var(--color-ink);
		font-size: 14px;
		font-weight: 800;
		letter-spacing: 0;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.event-card__meta {
		color: var(--color-ink-3);
		display: flex;
		align-items: center;
		gap: 5px;
		min-width: 0;
		font-size: 12px;
		line-height: 1.35;
		pointer-events: none;
	}

	.event-card__meta :global(.event-card__meta-icon) {
		width: 12px;
		height: 12px;
		color: var(--color-ink-4);
		flex-shrink: 0;
	}

	.meta-action {
		max-width: 42%;
		border: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		font-weight: 600;
		padding: 0;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		pointer-events: auto;
	}

	.meta-action:hover {
		color: var(--color-orange-700);
		text-decoration: underline;
	}

	.meta-action:focus-visible,
	.subject-pill:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}

	.meta-text {
		font-weight: 600;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta-dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--color-ink-4);
		flex-shrink: 0;
	}

	.distance-pill {
		color: var(--color-ink-4);
		flex-shrink: 0;
	}
</style>
