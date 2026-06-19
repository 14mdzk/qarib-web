/**
 * Events domain — UI view state (context-DI factory).
 *
 * Owns UI-only state for the events/peta view:
 *   - `selectedDateMode`   — global map date mode: today, tomorrow, week, or custom.
 *   - `selectedCustomDate` — ISO date used only when selectedDateMode is custom.
 *   - `selectedPlaceId` — the map place (mosque) currently selected; null = no sheet.
 *   - `sheetMode`       — 'peek' | 'full' (controls pin sheet expansion).
 *
 * Server data (the nearby feed) lives in svelte-query, not here.
 *
 * Conformance:
 *   - rule .claude/rules/state-management.md  (factory + getter, Symbol key, no singleton)
 *   - ADR docs/decisions/0001-svelte5-context-di.md
 */
import { getContext, setContext } from 'svelte';

// ---------------------------------------------------------------------------
// Context key (module-local)
// ---------------------------------------------------------------------------

const KEY = Symbol('eventsView');

export const DEFAULT_RADIUS_KM = 10;
export const MAX_RADIUS_KM = 60;
export const RADIUS_STEPS_KM = [10, 15, 25, 40, 60] as const;
export type PetaDateMode = 'today' | 'tomorrow' | 'week' | 'custom';

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

export class EventsViewService {
	selectedDateMode = $state<PetaDateMode>('today');
	selectedCustomDate = $state<string | null>(null);
	selectedRadiusKm = $state<number>(DEFAULT_RADIUS_KM);
	selectedSubjectId = $state<string | null>(null);
	selectedPlaceId = $state<string | null>(null);
	sheetMode = $state<'peek' | 'full'>('peek');

	/** Select the global map date mode. Custom dates are stored only for custom mode. */
	selectDateMode(mode: PetaDateMode, customDate: string | null = null): void {
		this.selectedDateMode = mode;
		this.selectedCustomDate = mode === 'custom' ? customDate : null;
	}

	/** Select a search radius in kilometres. */
	selectRadius(radiusKm: number): void {
		const clamped = Math.min(Math.max(radiusKm, DEFAULT_RADIUS_KM), MAX_RADIUS_KM);
		this.selectedRadiusKm = clamped;
	}

	/** Move radius to the next configured step, capped at MAX_RADIUS_KM. */
	expandRadius(): void {
		const next = RADIUS_STEPS_KM.find((step) => step > this.selectedRadiusKm) ?? MAX_RADIUS_KM;
		this.selectedRadiusKm = next;
	}

	/** Select a subject filter. Pass null to show all subjects. */
	selectSubject(id: string | null): void {
		this.selectedSubjectId = id;
	}

	/**
	 * Select a place by its ID — opens the pin sheet in peek mode.
	 * Pass `null` to deselect and close the sheet.
	 */
	selectPlace(id: string | null): void {
		this.selectedPlaceId = id;
		this.sheetMode = 'peek';
	}

	/** Expand the pin sheet to full mode. */
	expandSheet(): void {
		this.sheetMode = 'full';
	}

	/** Collapse the pin sheet from full back to peek mode (without closing). */
	collapseSheet(): void {
		this.sheetMode = 'peek';
	}

	/** Close the pin sheet and deselect the place. Resets mode to peek. */
	closeSheet(): void {
		this.selectedPlaceId = null;
		this.sheetMode = 'peek';
	}
}

// ---------------------------------------------------------------------------
// Context-DI exports
// ---------------------------------------------------------------------------

/**
 * Instantiate the events view service and register it in Svelte context.
 * Call once from the page or layout that owns its lifetime.
 */
export function createEventsView(): EventsViewService {
	const svc = new EventsViewService();
	setContext(KEY, svc);
	return svc;
}

/**
 * Retrieve the events view service from Svelte context.
 * Must be called inside a component that has `createEventsView()` in an ancestor.
 *
 * @throws {Error} when called outside an initialized context.
 */
export function getEventsView(): EventsViewService {
	const svc = getContext<EventsViewService | undefined>(KEY);
	if (!svc) {
		throw new Error(
			'EventsViewService not initialized. Call createEventsView() in a parent layout or page.'
		);
	}
	return svc;
}
