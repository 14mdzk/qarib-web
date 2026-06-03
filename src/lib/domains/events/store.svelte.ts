/**
 * Events domain — UI view state (context-DI factory).
 *
 * Owns UI-only state for the events/peta view:
 *   - `selectedDate`  — the ISO day string selected in the date strip (null = today).
 *   - `viewMode`      — 'list' | 'map' (C3b will use 'map').
 *   - `selectedPinId` — the map pin currently active (C3b).
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
	viewMode = $state<'list' | 'map'>('list');
	selectedPinId = $state<number | null>(null);

	/** Select a date strip day (ISO date string). Pass `null` to reset to "today". */
	selectDate(date: string | null): void {
		this.selectedDate = date;
		this.selectedPinId = null;
	}

	/** Switch the view mode between list and map. */
	setViewMode(mode: 'list' | 'map'): void {
		this.viewMode = mode;
	}

	/** Mark a map pin as selected (used in C3b when the map is wired). */
	selectPin(id: number | null): void {
		this.selectedPinId = id;
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
