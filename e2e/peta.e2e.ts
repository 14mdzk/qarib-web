/**
 * E2E tests for the /peta nearby-kajian page — Hi-Fi v2 map-only home.
 *
 * The upstream stub (e2e/upstream-stub.ts) handles `GET /events/nearby?…`
 * with a prefix match and returns two occurrences with place lat/lng.
 *
 * These tests assert the MapHomeV2 shell and ABSENCE of the old list/map toggle:
 *   - /peta loads and renders the Leaflet map container (full-bleed, no toggle).
 *   - No list/map toggle buttons are present (confirmed removed).
 *   - Leaflet markers appear for each stub place (.leaflet-marker-icon).
 *   - The filter chip strip is rendered at the top of the map.
 *   - The GPS FAB is rendered.
 *   - A pin click opens a PinSheet (peek mode) with place name visible.
 *   - PinSheet can be expanded via the chevron button.
 *   - PinSheet can be closed via the scrim/collapse button.
 *
 * Note: Leaflet requires a real browser context; tile endpoints may return
 * errors (test key / network) but the map container and markers still render
 * because Leaflet initialises synchronously on mount.
 *
 * Conformance: rule .claude/rules/testing.md (Playwright e2e, *.e2e.ts suffix).
 */
import { test, expect } from '@playwright/test';

test.describe('/peta — Hi-Fi v2 map home', () => {
	test('renders the map container full-bleed (no list/map toggle present)', async ({ page }) => {
		await page.goto('/peta');

		// Map container must be present — Leaflet renders this when the island mounts.
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// Confirm the old toggle buttons are gone.
		await expect(page.getByRole('button', { name: 'Peta', exact: true })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Daftar', exact: true })).toHaveCount(0);
	});

	test('renders the date filter chip strip over the map', async ({ page }) => {
		await page.goto('/peta');

		// Wait for map to mount.
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// "Hari ini" chip is the first chip in the filter strip.
		await expect(page.getByRole('button', { name: 'Hari ini' }).first()).toBeVisible();
	});

	test('renders Leaflet markers for the stub places', async ({ page }) => {
		await page.goto('/peta');

		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// The two stub events belong to two different places → exactly two place pins.
		const markers = page.locator('.leaflet-marker-icon');
		await expect(markers.first()).toBeVisible({ timeout: 10_000 });
		await expect(markers).toHaveCount(2);
	});

	test('GPS FAB is rendered', async ({ page }) => {
		await page.goto('/peta');

		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// MapFab renders a button with the GPS aria-label.
		await expect(page.getByRole('button', { name: /Lokasiku/i }).first()).toBeVisible();
	});

	test('pin click shows pin sheet peek mode', async ({ page }) => {
		await page.goto('/peta');

		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// Wait for markers to appear.
		const firstMarker = page.locator('.leaflet-marker-icon').first();
		await expect(firstMarker).toBeVisible({ timeout: 10_000 });

		await firstMarker.click();

		// PinSheet renders with role="complementary" when a place is selected.
		const sheet = page.getByRole('complementary').first();
		await expect(sheet).toBeVisible({ timeout: 5_000 });
	});

	test('pin sheet expand button switches to full mode', async ({ page }) => {
		await page.goto('/peta');

		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		const firstMarker = page.locator('.leaflet-marker-icon').first();
		await expect(firstMarker).toBeVisible({ timeout: 10_000 });
		await firstMarker.click();

		const sheet = page.getByRole('complementary').first();
		await expect(sheet).toBeVisible({ timeout: 5_000 });

		// The expand button is the icon-btn in the place strip (aria-expanded=false in peek).
		const expandBtn = sheet.getByRole('button', { name: /Lihat semua kajian/i }).first();
		await expect(expandBtn).toBeVisible();
		await expandBtn.click();

		// After expand, the button becomes collapse (aria-expanded=true).
		await expect(sheet.getByRole('button', { name: /Tutup/i }).first()).toBeVisible({
			timeout: 3_000
		});
	});

	test('scrim closes pin sheet', async ({ page }) => {
		await page.goto('/peta');

		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		const firstMarker = page.locator('.leaflet-marker-icon').first();
		await expect(firstMarker).toBeVisible({ timeout: 10_000 });
		await firstMarker.click();

		const sheet = page.getByRole('complementary').first();
		await expect(sheet).toBeVisible({ timeout: 5_000 });

		// Click the scrim button by its specific aria-label (not the chevron inside the sheet).
		// The scrim is a button outside the sheet with aria-label matching pin_sheet_collapse.
		await page.getByRole('button', { name: 'Tutup', exact: true }).last().click();

		// Sheet should be gone.
		await expect(sheet).not.toBeVisible({ timeout: 3_000 });
	});
});
