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

	it('starts with selectedDate=null, viewMode=list, selectedPinId=null', () => {
		expect(svc.selectedDate).toBeNull();
		expect(svc.viewMode).toBe('list');
		expect(svc.selectedPinId).toBeNull();
	});

	it('selectDate sets the date and clears the selected pin', () => {
		svc.selectedPinId = 42;
		svc.selectDate('2026-06-10');
		expect(svc.selectedDate).toBe('2026-06-10');
		expect(svc.selectedPinId).toBeNull();
	});

	it('selectDate(null) resets the date', () => {
		svc.selectDate('2026-06-10');
		svc.selectDate(null);
		expect(svc.selectedDate).toBeNull();
	});

	it('setViewMode switches between list and map', () => {
		svc.setViewMode('map');
		expect(svc.viewMode).toBe('map');
		svc.setViewMode('list');
		expect(svc.viewMode).toBe('list');
	});

	it('selectPin sets and clears the selected pin id', () => {
		svc.selectPin(7);
		expect(svc.selectedPinId).toBe(7);
		svc.selectPin(null);
		expect(svc.selectedPinId).toBeNull();
	});
});
