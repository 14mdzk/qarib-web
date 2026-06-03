<script lang="ts">
	import { base } from '$app/paths';
	import { m, getLocale } from '$core/i18n';
	import { Badge } from '$lib/shared/primitives';
	import { formatTime, formatDistance } from '$lib/shared/utils/date.js';
	import { prayerIntToLabel } from '$lib/shared/utils/prayer.js';
	import { statusKey } from '$domains/events/schema.js';
	import type { EventRecurringResponse } from '$domains/events/schema.js';
	import type { components } from '$generated/upstream';

	type PlaceResponse = components['schemas']['PlaceResponse'];

	interface Props {
		occurrence: EventRecurringResponse & { place?: PlaceResponse | null };
	}

	let { occurrence }: Props = $props();

	const locale = $derived(getLocale());

	function localise(l10n: Record<string, string> | null | undefined): string {
		if (!l10n) return '';
		return l10n[locale] ?? l10n['id'] ?? Object.values(l10n)[0] ?? '';
	}

	const title = $derived(localise(occurrence.name));
	const placeName = $derived(localise(occurrence.place?.name));
	const timeLabel = $derived(occurrence.date_start ? formatTime(occurrence.date_start) : '');
	const prayerLabel = $derived(prayerIntToLabel(occurrence.date_prayer));
	const distanceLabel = $derived(
		occurrence.distance_km != null ? formatDistance(occurrence.distance_km) : null
	);
	const status = $derived(statusKey(occurrence.status));

	function statusVariant(key: string): 'default' | 'accent' | 'soft' | 'ghost' {
		if (key === 'ongoing') return 'accent';
		if (key === 'incoming') return 'default';
		return 'soft';
	}

	function statusLabel(key: string): string {
		switch (key) {
			case 'incoming':
				return m.event_status_incoming();
			case 'ongoing':
				return m.event_status_ongoing();
			case 'cancelled':
				return m.event_status_cancelled();
			case 'rescheduled':
				return m.event_status_rescheduled();
			case 'completed':
				return m.event_status_completed();
			default:
				return key;
		}
	}

	// /kajian/[id] doesn't exist until C4 — use base + path to satisfy the
	// svelte/no-navigation-without-resolve rule without calling resolve() which
	// would fail type-check on a non-existent route. TODO(c4): switch to resolve().
	const href = $derived(`${base}/kajian/${occurrence.id}`);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- /kajian/[id] lands in C4; base+path is correct. TODO(c4): switch to resolve(). -->
<a
	{href}
	class="bg-surface-2 border-border hover:bg-surface-3 focus-visible:ring-ring block rounded-lg border p-4 shadow transition-colors focus-visible:ring-2 focus-visible:outline-none"
	aria-label={title || m.event_card_aria_label()}
>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<!-- Time + prayer anchor -->
			{#if timeLabel}
				<p class="text-content-3 mb-1 text-xs">
					{timeLabel}{#if prayerLabel}&nbsp;&middot;&nbsp;{prayerLabel}{/if}
				</p>
			{/if}

			<!-- Title -->
			<p class="text-content line-clamp-2 leading-snug font-medium">
				{title || m.event_card_untitled()}
			</p>

			<!-- Masjid -->
			{#if placeName}
				<p class="text-content-3 mt-0.5 truncate text-sm">
					{placeName}
				</p>
			{/if}

			<!-- Distance -->
			{#if distanceLabel}
				<p class="text-content-3 mt-0.5 text-xs">
					{distanceLabel}
				</p>
			{/if}
		</div>

		<!-- Status badge -->
		<Badge variant={statusVariant(status)} class="shrink-0 text-xs">
			{statusLabel(status)}
		</Badge>
	</div>
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
