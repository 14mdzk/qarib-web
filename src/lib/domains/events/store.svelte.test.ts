/**
 * Unit tests for EventsViewService.
 *
 * The service is tested by calling the constructor directly (no Svelte context
 * needed). The context wrapper (createEventsView / getEventsView) is a thin
 * setContext/getContext shell and is not tested here.
 *
 * Conformance: rule .claude/rules/testing.md (factory tested directly).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { EventsViewService } from './store.svelte.js';

describe('EventsViewService', () => {
	let svc: EventsViewService;

	beforeEach(() => {
		svc = new EventsViewService();
	});

	it('starts with selectedDate=null, selectedPlaceId=null, sheetMode=peek', () => {
		expect(svc.selectedDate).toBeNull();
		expect(svc.selectedPlaceId).toBeNull();
		expect(svc.sheetMode).toBe('peek');
	});

	it('selectDate sets the date', () => {
		svc.selectDate('2026-06-10');
		expect(svc.selectedDate).toBe('2026-06-10');
	});

	it('selectDate(null) resets the date', () => {
		svc.selectDate('2026-06-10');
		svc.selectDate(null);
		expect(svc.selectedDate).toBeNull();
	});

	it('selectPlace sets selectedPlaceId and resets sheetMode to peek', () => {
		svc.expandSheet();
		expect(svc.sheetMode).toBe('full');

		svc.selectPlace('place-uuid-1');
		expect(svc.selectedPlaceId).toBe('place-uuid-1');
		expect(svc.sheetMode).toBe('peek');
	});

	it('selectPlace(null) clears the selected place', () => {
		svc.selectPlace('place-uuid-1');
		svc.selectPlace(null);
		expect(svc.selectedPlaceId).toBeNull();
	});

	it('expandSheet sets sheetMode to full', () => {
		svc.selectPlace('place-uuid-1');
		svc.expandSheet();
		expect(svc.sheetMode).toBe('full');
	});

	it('closeSheet clears selectedPlaceId', () => {
		svc.selectPlace('place-uuid-1');
		svc.closeSheet();
		expect(svc.selectedPlaceId).toBeNull();
	});

	it('closeSheet reverts sheetMode to peek when called while full', () => {
		svc.selectPlace('place-uuid-1');
		svc.expandSheet();
		expect(svc.sheetMode).toBe('full');

		svc.closeSheet();
		expect(svc.sheetMode).toBe('peek');
	});

	it('collapseSheet sets sheetMode to peek', () => {
		svc.selectPlace('place-uuid-1');
		svc.expandSheet();
		expect(svc.sheetMode).toBe('full');

		svc.collapseSheet();
		expect(svc.sheetMode).toBe('peek');
		// Place remains selected after collapse (sheet stays open in peek).
		expect(svc.selectedPlaceId).toBe('place-uuid-1');
	});
});
