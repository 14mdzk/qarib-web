/**
 * Events domain — UI view state (context-DI factory).
 *
 * Owns UI-only state for the events/peta view:
 *   - `selectedDate`    — the ISO day string selected in the date strip (null = today).
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

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

export class EventsViewService {
	selectedDate = $state<string | null>(null);
	selectedPlaceId = $state<string | null>(null);
	sheetMode = $state<'peek' | 'full'>('peek');

	/** Select a date strip day (ISO date string). Pass `null` to reset to "today". */
	selectDate(date: string | null): void {
		this.selectedDate = date;
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
