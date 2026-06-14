<script lang="ts">
	import { m } from '$core/i18n';
	import { cn } from '$lib/shared/utils/cn';
	import {
		getMonthGrid,
		getMonthYearLabel,
		getWeekdayLabels,
		shiftCalendarMonth,
		type CalendarDay
	} from '$lib/shared/utils/date';
	import { Skeleton } from '$lib/shared/primitives';

	/**
	 * MonthCalendar — a reusable month-grid calendar composite.
	 *
	 * Prop-driven, no domain knowledge. Renders a 6x7 day grid with
	 * colored dots on dates that have events.
	 *
	 * Conformance:
	 *   - rule .claude/rules/styling.md      (composite in shared/composites/)
	 *   - rule .claude/rules/i18n.md         (all strings via $core/i18n)
	 *   - rule .claude/rules/architecture.md (no upward imports)
	 *   - rule .claude/rules/state-management.md ($state, no module singletons)
	 */

	let {
		domainName = '',
		eventDates = new Set<string>(),
		loading = false,
		error = null as string | null,
		activeDate = null as string | null,
		onRetry = undefined as (() => void) | undefined,
		onDateClick = undefined as ((isoDate: string) => void) | undefined
	}: {
		domainName?: string;
		eventDates?: Set<string>;
		loading?: boolean;
		error?: string | null;
		activeDate?: string | null;
		onRetry?: () => void;
		onDateClick?: (isoDate: string) => void;
	} = $props();

	// ---------------------------------------------------------------------------
	// Internal state
	// ---------------------------------------------------------------------------

	function computeInitialAnchor(): string {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		return `${y}-${m}-01`;
	}

	let currentAnchor = $state(computeInitialAnchor());

	// ---------------------------------------------------------------------------
	// Derived
	// ---------------------------------------------------------------------------

	const grid = $derived(getMonthGrid(currentAnchor));
	const monthYearLabel = $derived(getMonthYearLabel(currentAnchor));
	const weekdayLabels = $derived(getWeekdayLabels('id-ID'));

	/** Split the flat 42-cell grid into 6 rows of 7 cells. */
	const weeks = $derived(() => {
		const rows: CalendarDay[][] = [];
		for (let i = 0; i < 6; i++) {
			rows.push(grid.slice(i * 7, (i + 1) * 7));
		}
		return rows;
	});

	/** Index array for loading skeleton grid. */
	const skeletonIndices = Array.from({ length: 42 }, (_, i) => i);

	/** True when there are no event dates for current-month cells. */
	const hasNoEventsInMonth = $derived(
		!loading &&
			!error &&
			grid.filter((c) => c.isCurrentMonth).every((c) => !eventDates.has(c.isoDate))
	);

	// ---------------------------------------------------------------------------
	// Navigation
	// ---------------------------------------------------------------------------

	function prevMonth() {
		currentAnchor = shiftCalendarMonth(currentAnchor, -1);
	}

	function nextMonth() {
		currentAnchor = shiftCalendarMonth(currentAnchor, 1);
	}

	/**
	 * Handle a day cell click.
	 * If the clicked cell is not in the current month, navigate to that month
	 * first. Always calls onDateClick so the caller can react to the selection.
	 */
	function handleCellClick(cell: CalendarDay) {
		if (!cell.isCurrentMonth) {
			// Derive the first of the clicked cell's month.
			const [year, month] = cell.isoDate.split('-').map(Number);
			const monthAnchor = `${year}-${String(month).padStart(2, '0')}-01`;
			currentAnchor = monthAnchor;
		}
		onDateClick?.(cell.isoDate);
	}

	// ---------------------------------------------------------------------------
	// Keyboard navigation on the grid
	// ---------------------------------------------------------------------------

	/** Focus the next/prev day cell via arrow keys. */
	function handleGridKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (!target?.dataset?.dayIndex) return;

		const currentIdx = parseInt(target.dataset.dayIndex, 10);
		let nextIdx: number | null = null;

		switch (e.key) {
			case 'ArrowLeft':
				nextIdx = currentIdx > 0 ? currentIdx - 1 : null;
				break;
			case 'ArrowRight':
				nextIdx = currentIdx < 41 ? currentIdx + 1 : null;
				break;
			case 'ArrowUp':
				nextIdx = currentIdx >= 7 ? currentIdx - 7 : null;
				break;
			case 'ArrowDown':
				nextIdx = currentIdx <= 34 ? currentIdx + 7 : null;
				break;
			case 'Home':
				nextIdx = 0;
				break;
			case 'End':
				nextIdx = 41;
				break;
		}

		if (nextIdx !== null) {
			e.preventDefault();
			const nextCell = document.getElementById(`mc-day-${nextIdx}`);
			nextCell?.focus();
		}
	}
</script>

<!--
  MonthCalendar — month grid calendar composite.
-->

<div class="flex flex-col gap-3">
	<!-- ── Header: title + prev/next ──────────────────────────────── -->
	<div class="flex items-center justify-between">
		<h2 class="text-ink text-sm font-bold" data-testid="calendar-title">
			{m.calendar_title({ domain: domainName })}
		</h2>

		<div class="flex items-center gap-1">
			<button
				class="border-line text-ink hover:bg-paper-2 flex h-8 w-8 items-center justify-center rounded-sm border text-sm transition-colors"
				aria-label={m.calendar_prev_month()}
				data-testid="calendar-prev-btn"
				onclick={prevMonth}
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg
				>
			</button>

			<span
				class="text-ink min-w-[120px] text-center text-[13px] font-bold"
				data-testid="calendar-month-year"
			>
				{monthYearLabel}
			</span>

			<button
				class="border-line text-ink hover:bg-paper-2 flex h-8 w-8 items-center justify-center rounded-sm border text-sm transition-colors"
				aria-label={m.calendar_next_month()}
				data-testid="calendar-next-btn"
				onclick={nextMonth}
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
				>
			</button>
		</div>
	</div>

	<!-- ── Loading: 42 skeleton squares ────────────────────────────── -->
	{#if loading}
		<div class="grid grid-cols-7 gap-[1px]" role="presentation" data-testid="calendar-loading">
			{#each skeletonIndices as i (i)}
				<Skeleton class="aspect-square w-full rounded-sm" />
			{/each}
		</div>
		<p class="text-ink-4 text-center text-xs">{m.calendar_loading()}</p>

		<!-- ── Error: inline error + retry ─────────────────────────────── -->
	{:else if error}
		<div
			class="border-line rounded border bg-[var(--color-paper-2)] p-4 text-center"
			data-testid="calendar-error"
		>
			<p class="text-ink text-sm font-bold">{m.calendar_error_title()}</p>
			<p class="text-ink-3 mt-1 text-xs">{m.calendar_error_body()}</p>
			{#if onRetry}
				<button
					class="bg-ink text-paper mt-3 rounded-sm px-4 py-1.5 text-xs font-semibold"
					onclick={onRetry}
					data-testid="calendar-retry-btn"
				>
					{m.kajian_error_retry()}
				</button>
			{/if}
		</div>

		<!-- ── Grid ────────────────────────────────────────────────────── -->
	{:else}
		<!-- Weekday header row -->
		<div class="grid grid-cols-7 gap-[1px]" role="row" aria-hidden="true">
			{#each weekdayLabels as label (label)}
				<div
					class="text-ink-4 flex items-center justify-center py-1 text-[11px] leading-none font-bold"
				>
					{label}
				</div>
			{/each}
		</div>

		<!-- Day grid — 6 rows x 7 cols -->
		<div
			class="grid grid-cols-7 gap-[1px]"
			role="grid"
			tabindex="-1"
			aria-label={m.calendar_title({ domain: domainName })}
			data-testid="calendar-grid"
			onkeydown={handleGridKeydown}
		>
			{#each weeks() as week, weekIdx (weekIdx)}
				{#each week as cell (cell.isoDate)}
					<button
						id="mc-day-{grid.indexOf(cell)}"
						class={cn(
							'relative flex aspect-square w-full flex-col items-center justify-center rounded-sm text-xs font-medium transition-colors',
							'focus-visible:outline-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]',
							cell.isCurrentMonth ? 'text-ink hover:bg-[var(--color-orange-50)]' : 'text-ink-4',
							cell.isToday && !activeDate && 'ring-ink ring-1',
							cell.isoDate === activeDate && 'ring-orange bg-[var(--color-orange-50)] ring-1',
							activeDate && cell.isToday && cell.isoDate === activeDate && 'ring-orange'
						)}
						role="gridcell"
						tabindex={grid.indexOf(cell) === 0 ? 0 : -1}
						data-day-index={grid.indexOf(cell)}
						aria-label={cell.isToday
							? m.calendar_today_label({ date: cell.isoDate })
							: m.calendar_date_label({ date: cell.isoDate })}
						aria-current={cell.isToday ? 'date' : undefined}
						data-testid="calendar-day"
						onclick={() => handleCellClick(cell)}
					>
						<span class={cn('leading-none', !cell.isCurrentMonth && 'opacity-40')}>
							{cell.day}
						</span>

						<!-- Event dot -->
						{#if eventDates.has(cell.isoDate)}
							<span
								class="mt-[2px] h-[5px] w-[5px] rounded-full"
								style="background: var(--color-orange)"
								aria-hidden="true"
								data-testid="calendar-event-dot"
							></span>
						{/if}
					</button>
				{/each}
			{/each}
		</div>

		<!-- Empty state caption -->
		{#if hasNoEventsInMonth}
			<p class="text-ink-4 text-center text-xs" data-testid="calendar-empty">
				{m.calendar_empty()}
			</p>
		{/if}
	{/if}
</div>
