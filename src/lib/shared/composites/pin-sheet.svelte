<script lang="ts">
	/**
	 * PinSheet — v2 bottom sheet for a map pin selection.
	 *
	 * Two display modes via the `mode` prop:
	 *   - "peek"  place strip + most-urgent event row only; map stays dominant.
	 *   - "full"  place strip + day-filter chips + all event rows + open-place CTA.
	 *
	 * Purely presentational: no data fetching, no routing, no geolocation.
	 * All interaction emits through callbacks.
	 *
	 * Conformance:
	 *   - .claude/rules/styling.md  (tokens only; no arbitrary hex)
	 *   - .claude/rules/i18n.md     (all user-facing strings via Paraglide)
	 *   - .claude/rules/architecture.md (shared/composites)
	 */
	import type { PinTier } from '$domains/events/pin-tier.js';
	import { m } from '$core/i18n';

	// ---------------------------------------------------------------------------
	// Types
	// ---------------------------------------------------------------------------

	export interface SheetPlace {
		name: string;
		distanceLabel: string;
		address?: string;
	}

	export interface SheetEvent {
		id: string | number;
		title: string;
		timeLabel: string;
		anchorLabel?: string;
		ustadzName: string;
		subjectLabel?: string;
		tier: PinTier;
		/** ISO string or Date of the occurrence start. When present, day-chip
		 * counts are derived from real local calendar dates instead of the
		 * tier-proxy fallback. */
		dateStart?: string | Date;
	}

	export type SheetMode = 'peek' | 'full';

	interface Props {
		place: SheetPlace;
		events: SheetEvent[];
		mode: SheetMode;
		/** Currently selected day-filter chip key. Defaults to 'today'. */
		activeDay?: 'today' | 'tomorrow' | 'week';
		onexpand?: () => void;
		/** Fired when the chevron is tapped while in full mode to go back to peek. */
		oncollapse?: () => void;
		/** Fired when a day-filter chip is tapped. */
		ondayselect?: (key: 'today' | 'tomorrow' | 'week') => void;
		onselectevent?: (id: string | number) => void;
		onopenplace?: () => void;
	}

	let {
		place,
		events,
		mode,
		activeDay = 'today',
		onexpand,
		oncollapse,
		ondayselect,
		onselectevent,
		onopenplace
	}: Props = $props();

	// ---------------------------------------------------------------------------
	// Derived
	// ---------------------------------------------------------------------------

	/** Most urgent event shown in peek mode. */
	const peekEvent = $derived(events[0]);

	// ---------------------------------------------------------------------------
	// SVG icons (inline; no external dep, matches v2 spec i.* helpers)
	// ---------------------------------------------------------------------------

	const MOSQUE_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2c-1.5 2-3 3-3 5v1M12 2c1.5 2 3 3 3 5v1M4 20V11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9M9 20v-4a3 3 0 0 1 6 0v4M2 20h20"/></svg>`;

	const DISTANCE_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4"/></svg>`;

	const CHEVRON_UP_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 15 12 9 18 15"/></svg>`;

	const CHEVRON_R_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>`;

	// ---------------------------------------------------------------------------
	// Urgency badge style per tier
	// ---------------------------------------------------------------------------

	function urgencyLabel(tier: PinTier): string | null {
		if (tier === 'now') return m.pin_sheet_urgency_now();
		if (tier === 'soon') return m.pin_sheet_urgency_soon();
		return null;
	}

	function urgencyClass(tier: PinTier): string {
		if (tier === 'now') return 'urgency-now';
		if (tier === 'soon') return 'urgency-soon';
		return '';
	}

	// ---------------------------------------------------------------------------
	// Day filter chips (full mode) — derive counts from real local calendar dates
	// ---------------------------------------------------------------------------

	/**
	 * Classify a SheetEvent into a local-calendar day bucket.
	 *
	 * Bucket definitions (all in local time):
	 *   today    — same local calendar day as today.
	 *   tomorrow — same local calendar day as tomorrow.
	 *   week     — within the next 7 local days, excluding today and tomorrow
	 *              (i.e. day+2 through day+7 inclusive).
	 *
	 * When dateStart is absent, the event falls back to the tier proxy:
	 *   tier now/soon/today → 'today' bucket; tier later → 'week' bucket.
	 */
	function classifyEventDay(event: SheetEvent): 'today' | 'tomorrow' | 'week' | 'other' {
		if (!event.dateStart) {
			// Fallback: use tier as proxy when dateStart is absent.
			return event.tier === 'now' || event.tier === 'soon' || event.tier === 'today'
				? 'today'
				: 'week';
		}

		const eventDate = new Date(event.dateStart);
		const now = new Date();

		// Normalise both to local midnight for calendar-day comparison.
		const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const eventMidnight = new Date(
			eventDate.getFullYear(),
			eventDate.getMonth(),
			eventDate.getDate()
		);

		const diffDays = Math.round(
			(eventMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
		);

		if (diffDays === 0) return 'today';
		if (diffDays === 1) return 'tomorrow';
		if (diffDays >= 2 && diffDays <= 7) return 'week';
		return 'other';
	}

	const dayChips = $derived([
		{
			key: 'today' as const,
			label: m.pin_sheet_day_today(),
			count: events.filter((e) => classifyEventDay(e) === 'today').length,
			active: activeDay === 'today'
		},
		{
			key: 'tomorrow' as const,
			label: m.pin_sheet_day_tomorrow(),
			count: events.filter((e) => classifyEventDay(e) === 'tomorrow').length,
			active: activeDay === 'tomorrow'
		},
		{
			key: 'week' as const,
			label: m.pin_sheet_day_this_week(),
			count: events.filter((e) => classifyEventDay(e) === 'week').length,
			active: activeDay === 'week'
		}
	]);

	// Events shown in full mode — filtered by the active day chip selection.
	const fullEvents = $derived(events.filter((e) => classifyEventDay(e) === activeDay));
</script>

<!--
  .pin-sheet — bottom-anchored absolute overlay.
  The consumer (map or container) provides the positioned ancestor.
  border-top radius 20px per spec; paper bg; shadow.
  Slide transition honours prefers-reduced-motion via the app.css global rule
  (animation-duration 0.01ms when reduced motion is on).
-->
<div
	class="pin-sheet"
	class:pin-sheet--full={mode === 'full'}
	role="complementary"
	aria-label={place.name}
>
	<!-- Grab handle -->
	<div class="handle" role="presentation"></div>

	<div class="sheet-body">
		<!-- Place strip -->
		<div class="place-strip">
			<div class="place-thumb" aria-hidden="true">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted inline SVG icon, no user content -->
				{@html MOSQUE_SVG}
			</div>

			<div class="place-meta">
				<div class="place-name">{place.name}</div>
				<div class="place-sub">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted inline SVG icon, no user content -->
					{@html DISTANCE_SVG}
					<span>{place.distanceLabel}{place.address ? ` · ${place.address}` : ''}</span>
				</div>
			</div>

			<button
				class="icon-btn"
				onclick={mode === 'full' ? oncollapse : onexpand}
				aria-label={mode === 'full' ? m.pin_sheet_collapse() : m.pin_sheet_expand()}
				aria-expanded={mode === 'full'}
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted inline SVG icon, no user content -->
				{@html CHEVRON_UP_SVG}
			</button>
		</div>

		{#if events.length === 0}
			<div class="empty-events">
				<div class="empty-events__title">{m.pin_sheet_no_events_title()}</div>
				<div class="empty-events__body">{m.pin_sheet_no_events_body()}</div>
			</div>

			<button class="open-place-btn" onclick={onopenplace}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted inline SVG icon, no user content -->
				{@html MOSQUE_SVG}
				{m.pin_sheet_open_place()}
			</button>
		{:else if mode === 'peek' && peekEvent}
			<!-- Peek: one urgency event row -->
			<div class="peek-event">
				{#if urgencyLabel(peekEvent.tier)}
					<span class={`urgency ${urgencyClass(peekEvent.tier)}`}>
						{urgencyLabel(peekEvent.tier)}
					</span>
				{/if}
				<span class="peek-title">{peekEvent.title} · {peekEvent.timeLabel}</span>
			</div>
			<div class="peek-sub">
				{peekEvent.ustadzName} · {m.pin_sheet_kajian_count({ n: events.length })}
			</div>
		{:else if mode === 'full'}
			<!-- Full: day-filter chips -->
			<div class="day-chips">
				{#each dayChips as chip (chip.key)}
					<button
						class="day-chip"
						class:day-chip--active={chip.active}
						aria-pressed={chip.active}
						onclick={() => ondayselect?.(chip.key)}
					>
						{chip.label}{chip.count > 0 ? ` (${chip.count})` : ''}
					</button>
				{/each}
			</div>

			<!-- Event list -->
			<div class="event-list">
				{#each fullEvents as event (event.id)}
					<button
						class="event-row"
						class:event-row--urgent={event.tier === 'now' || event.tier === 'soon'}
						onclick={() => onselectevent?.(event.id)}
					>
						<!-- Time pill -->
						<div
							class="time-pill"
							class:time-pill--urgent={event.tier === 'now' || event.tier === 'soon'}
						>
							<span class="time-main">{event.timeLabel}</span>
							{#if event.anchorLabel}
								<span class="time-anchor">{event.anchorLabel}</span>
							{/if}
						</div>

						<!-- Event body -->
						<div class="event-body">
							<div class="event-title">{event.title}</div>
							<div class="event-meta">
								{event.ustadzName}{event.subjectLabel ? ` · ${event.subjectLabel}` : ''}
							</div>
						</div>

						<!-- Chevron -->
						<span class="event-chevron" aria-hidden="true">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted inline SVG icon, no user content -->
							{@html CHEVRON_R_SVG}
						</span>
					</button>
				{/each}
			</div>

			<!-- Open place CTA -->
			<button class="open-place-btn" onclick={onopenplace}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted inline SVG icon, no user content -->
				{@html MOSQUE_SVG}
				{m.pin_sheet_open_place()}
			</button>
		{/if}
	</div>
</div>

<style>
	/* ── Sheet container ───────────────────────────────────────────────── */
	.pin-sheet {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--color-paper);
		border-top-left-radius: 20px;
		border-top-right-radius: 20px;
		box-shadow: var(--shadow-lg);
		z-index: 999;
		display: flex;
		flex-direction: column;
		transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	/* Full mode: taller sheet */
	.pin-sheet--full {
		max-height: 72%;
	}

	/* ── Grab handle ───────────────────────────────────────────────────── */
	.handle {
		width: 40px;
		height: 4px;
		background: var(--color-line-2);
		border-radius: 2px;
		margin: 8px auto 6px;
		flex-shrink: 0;
	}

	/* ── Sheet body ────────────────────────────────────────────────────── */
	.sheet-body {
		padding: 6px 16px 18px;
		overflow-y: auto;
	}

	/* ── Place strip ───────────────────────────────────────────────────── */
	.place-strip {
		display: flex;
		gap: 10px;
		align-items: center;
		padding: 4px 0 10px;
		border-bottom: 1px solid var(--color-line);
	}

	.place-thumb {
		width: 42px;
		height: 42px;
		border-radius: 10px;
		background: linear-gradient(135deg, var(--color-line-2), var(--color-paper-3));
		flex-shrink: 0;
		display: grid;
		place-items: center;
		color: var(--color-ink-3);
	}

	.place-meta {
		flex: 1;
		min-width: 0;
	}

	.place-name {
		font-size: 13.5px;
		font-weight: 700;
		color: var(--color-ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.place-sub {
		font-size: 11px;
		color: var(--color-ink-3);
		display: flex;
		gap: 4px;
		align-items: center;
		margin-top: 2px;
	}

	.icon-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		display: grid;
		place-items: center;
		color: var(--color-ink);
		flex-shrink: 0;
		cursor: pointer;
	}

	.icon-btn:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}

	/* ── Peek event row ────────────────────────────────────────────────── */
	.peek-event {
		display: flex;
		gap: 10px;
		align-items: center;
		padding: 10px 0 2px;
	}

	.urgency {
		padding: 3px 8px;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.04em;
		flex-shrink: 0;
	}

	.urgency-now {
		background: var(--color-pin-now);
		color: white;
	}

	.urgency-soon {
		background: var(--color-orange-50);
		color: var(--color-orange-700);
		border: 1px solid var(--color-orange-100);
	}

	.peek-title {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--color-ink);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.peek-sub {
		font-size: 11px;
		color: var(--color-ink-3);
		padding: 4px 0 2px;
	}

	.empty-events {
		padding: 12px 0 10px;
	}

	.empty-events__title {
		font-size: 13px;
		font-weight: 700;
		color: var(--color-ink);
	}

	.empty-events__body {
		margin-top: 3px;
		font-size: 11.5px;
		line-height: 1.45;
		color: var(--color-ink-3);
	}

	/* ── Day-filter chips (full mode) ──────────────────────────────────── */
	.day-chips {
		display: flex;
		gap: 6px;
		margin: 12px 0 8px;
	}

	.day-chip {
		height: 28px;
		padding: 0 10px;
		font-size: 11.5px;
		border-radius: 16px;
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		color: var(--color-ink-2);
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		font-family: inherit;
	}

	.day-chip--active {
		background: var(--color-ink);
		color: white;
		border-color: var(--color-ink);
		font-weight: 600;
	}

	.day-chip:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}

	/* ── Event list (full mode) ────────────────────────────────────────── */
	.event-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.event-row {
		display: flex;
		gap: 10px;
		padding: 10px;
		border-radius: 10px;
		background: var(--color-paper-2);
		border: none;
		text-align: left;
		cursor: pointer;
		width: 100%;
		align-items: center;
		font-family: inherit;
	}

	.event-row--urgent {
		background: var(--color-orange-50);
		border: 1px solid var(--color-orange-100);
	}

	.event-row:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}

	/* Time pill ~48px wide, left column */
	.time-pill {
		flex-shrink: 0;
		width: 48px;
		text-align: center;
	}

	.time-main {
		display: block;
		font-size: 15px;
		font-weight: 700;
		color: var(--color-ink);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.time-pill--urgent .time-main {
		color: var(--color-orange-700);
		font-weight: 800;
	}

	.time-anchor {
		display: block;
		font-size: 9.5px;
		color: var(--color-ink-3);
		font-weight: 600;
		margin-top: 3px;
	}

	.time-pill--urgent .time-anchor {
		color: var(--color-orange-700);
	}

	.event-body {
		flex: 1;
		min-width: 0;
	}

	.event-title {
		font-size: 12.5px;
		font-weight: 700;
		color: var(--color-ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.event-meta {
		font-size: 11px;
		color: var(--color-ink-2);
		margin-top: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.event-chevron {
		color: var(--color-ink-4);
		flex-shrink: 0;
		display: grid;
		place-items: center;
	}

	/* ── Open-place CTA (full mode) ────────────────────────────────────── */
	.open-place-btn {
		width: 100%;
		margin-top: 12px;
		padding: 12px;
		background: var(--color-ink);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 13px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		cursor: pointer;
		font-family: inherit;
	}

	.open-place-btn:hover {
		background: var(--color-ink-2);
	}

	.open-place-btn:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}
</style>
