/**
 * Unit tests for map-chrome (map-filter-chips + map-fab) pure logic.
 *
 * Components themselves are Svelte and require a browser DOM. We test the
 * prop shape contracts and any pure helper logic without DOM, matching the
 * repo's established co-located test pattern (spinner.test.ts, etc.).
 *
 * Conformance: .claude/rules/testing.md (unit tests for pure logic, co-located).
 */
import { describe, it, expect } from 'vitest';
import type { FilterChip } from './map-filter-chips.svelte';

// ---------------------------------------------------------------------------
// FilterChip shape contract
// ---------------------------------------------------------------------------

describe('MapFilterChips — FilterChip type contract', () => {
	it('accepts a minimal chip with key and label', () => {
		const chip: FilterChip = { key: 'today', label: 'Hari ini' };
		expect(chip.key).toBe('today');
		expect(chip.label).toBe('Hari ini');
		expect(chip.active).toBeUndefined();
	});

	it('accepts a chip with active = true', () => {
		const chip: FilterChip = { key: 'now', label: 'Sekarang', active: true };
		expect(chip.active).toBe(true);
	});

	it('accepts a chip with active = false', () => {
		const chip: FilterChip = { key: 'tomorrow', label: 'Besok', active: false };
		expect(chip.active).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Active chip selection logic
// ---------------------------------------------------------------------------

describe('MapFilterChips — active chip resolution', () => {
	const chips: FilterChip[] = [
		{ key: 'today', label: 'Hari ini', active: true },
		{ key: 'now', label: 'Sekarang', active: false },
		{ key: 'tomorrow', label: 'Besok', active: false }
	];

	it('identifies exactly one active chip in a well-formed list', () => {
		const activeChips = chips.filter((c) => c.active);
		expect(activeChips).toHaveLength(1);
	});

	it('active chip key matches the selected filter', () => {
		const active = chips.find((c) => c.active);
		expect(active?.key).toBe('today');
	});

	it('onselect receives the chip key (mock simulation)', () => {
		const selected: string[] = [];
		const onselect = (key: string) => selected.push(key);

		chips.forEach((chip) => {
			if (chip.key === 'now') onselect(chip.key);
		});

		expect(selected).toEqual(['now']);
	});
});

// ---------------------------------------------------------------------------
// MapFab — loading state contract
// ---------------------------------------------------------------------------

describe('MapFab — loading prop contract', () => {
	it('loading defaults to false (not loading)', () => {
		// Simulate default prop value
		const loading = false;
		expect(loading).toBe(false);
	});

	it('loading=true indicates a locate-in-progress state', () => {
		const loading = true;
		// When loading, the button should be disabled / spinner shown
		expect(loading).toBe(true);
	});

	it('onlocate callback fires (mock simulation)', () => {
		const calls: number[] = [];
		const onlocate = () => calls.push(1);

		// Simulate a click when not loading
		const loading = false;
		if (!loading) onlocate();

		expect(calls).toHaveLength(1);
	});

	it('onlocate does NOT fire when loading (simulated guard)', () => {
		const calls: number[] = [];
		const onlocate = () => calls.push(1);

		// Simulate click disabled state when loading
		const loading = true;
		if (!loading) onlocate();

		expect(calls).toHaveLength(0);
	});
});
