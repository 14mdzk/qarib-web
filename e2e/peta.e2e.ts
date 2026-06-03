/**
 * E2E tests for the /peta nearby-kajian page — list view + map view.
 *
 * The upstream stub (e2e/upstream-stub.ts) handles `GET /events/nearby?…`
 * with a prefix match and returns two occurrences with place lat/lng. These
 * tests assert:
 *
 * List view:
 *   - /peta loads and renders at least one EventCard (kajian title + masjid name).
 *   - Each card links to /kajian/{id}.
 *   - The date strip is rendered.
 *
 * Map view (C3b):
 *   - Toggling to "Peta" renders the Leaflet container (.leaflet-container).
 *   - Leaflet markers appear (.leaflet-marker-icon).
 *   - A pin click (via the marker or via a direct selectedPinId trigger) shows a
 *     callout with a "Buka kajian" link to /kajian/{id}.
 *   - The callout close button dismisses it.
 *   - Toggling back to "Daftar" renders the list again.
 *
 * Conformance: rule .claude/rules/testing.md (Playwright e2e, *.e2e.ts suffix).
 */
import { test, expect } from '@playwright/test';

test.describe('/peta list view', () => {
	test('renders nearby kajian cards with title and masjid', async ({ page }) => {
		await page.goto('/peta');

		// Wait for at least one event card to appear (data from SSR load).
		const card = page.getByRole('link', { name: /Kajian Tafsir Al-Quran/i }).first();
		await expect(card).toBeVisible({ timeout: 10_000 });

		// The masjid name should also be visible within that card region.
		await expect(page.getByText('Masjid Al-Falah').first()).toBeVisible();
	});

	test('each card links to /kajian/{id}', async ({ page }) => {
		await page.goto('/peta');

		const card = page.getByRole('link', { name: /Kajian Tafsir Al-Quran/i }).first();
		await expect(card).toBeVisible({ timeout: 10_000 });

		const href = await card.getAttribute('href');
		expect(href).toMatch(/\/kajian\/1001/);
	});

	test('renders a second kajian card', async ({ page }) => {
		await page.goto('/peta');

		const secondCard = page.getByRole('link', { name: /Pengajian Ibu-Ibu/i }).first();
		await expect(secondCard).toBeVisible({ timeout: 10_000 });
	});

	test('renders the date strip', async ({ page }) => {
		await page.goto('/peta');

		// The "Hari ini" button should be visible in the date strip.
		await expect(page.getByRole('button', { name: 'Hari ini' })).toBeVisible();
	});

	test('renders the location request affordance', async ({ page }) => {
		await page.goto('/peta');

		await expect(page.getByRole('button', { name: /lokasi/i }).first()).toBeVisible();
	});
});

test.describe('/peta map view (C3b)', () => {
	test('toggle to Peta renders the Leaflet container', async ({ page }) => {
		await page.goto('/peta');

		// Wait for the list to load so the toggle is rendered.
		await expect(page.getByRole('link', { name: /Kajian Tafsir Al-Quran/i }).first()).toBeVisible({
			timeout: 10_000
		});

		// Click the "Peta" toggle button.
		await page.getByRole('button', { name: 'Peta', exact: true }).click();

		// The Leaflet container should be present in the DOM.
		// Tiles may return 502 with the test key — that is fine; the container and
		// markers still render because Leaflet initialises synchronously on mount.
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });
	});

	test('map view renders Leaflet markers for pinned events', async ({ page }) => {
		await page.goto('/peta');

		// Wait for data.
		await expect(page.getByRole('link', { name: /Kajian Tafsir Al-Quran/i }).first()).toBeVisible({
			timeout: 10_000
		});

		// Switch to map view.
		await page.getByRole('button', { name: 'Peta', exact: true }).click();

		// Leaflet container present.
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// The two stub events both have valid lat/lng — their markers should render.
		// Leaflet renders marker divs with .leaflet-marker-icon once the map initialises.
		await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible({ timeout: 10_000 });
	});

	test('pin click shows callout with Buka kajian link', async ({ page }) => {
		await page.goto('/peta');

		// Wait for data and switch to map.
		await expect(page.getByRole('link', { name: /Kajian Tafsir Al-Quran/i }).first()).toBeVisible({
			timeout: 10_000
		});
		await page.getByRole('button', { name: 'Peta', exact: true }).click();
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// Wait for markers to appear, then click the first one.
		const firstMarker = page.locator('.leaflet-marker-icon').first();
		await expect(firstMarker).toBeVisible({ timeout: 10_000 });
		await firstMarker.click();

		// The callout dialog should appear with a "Buka kajian" link.
		const callout = page.getByRole('dialog').first();
		await expect(callout).toBeVisible({ timeout: 5_000 });

		const bukaLink = callout.getByRole('link', { name: /Buka kajian/i });
		await expect(bukaLink).toBeVisible();

		const href = await bukaLink.getAttribute('href');
		// The href should point to /kajian/<id> — stub returns ids 1001 and 1002.
		// Anchored with $ to prevent matching e.g. /kajian/10012.
		expect(href).toMatch(/\/kajian\/100[12]$/);
	});

	test('callout close button dismisses the callout', async ({ page }) => {
		await page.goto('/peta');

		// Wait for data and switch to map.
		await expect(page.getByRole('link', { name: /Kajian Tafsir Al-Quran/i }).first()).toBeVisible({
			timeout: 10_000
		});
		await page.getByRole('button', { name: 'Peta', exact: true }).click();
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// Click the first marker to open the callout.
		const firstMarker = page.locator('.leaflet-marker-icon').first();
		await expect(firstMarker).toBeVisible({ timeout: 10_000 });
		await firstMarker.click();

		const callout = page.getByRole('dialog').first();
		await expect(callout).toBeVisible({ timeout: 5_000 });

		// Click "Tutup" to dismiss.
		await callout.getByRole('button', { name: /Tutup/i }).click();
		await expect(callout).not.toBeVisible({ timeout: 3_000 });
	});

	test('toggling back to Daftar shows the list view again', async ({ page }) => {
		await page.goto('/peta');

		// Wait for data and switch to map.
		await expect(page.getByRole('link', { name: /Kajian Tafsir Al-Quran/i }).first()).toBeVisible({
			timeout: 10_000
		});
		await page.getByRole('button', { name: 'Peta', exact: true }).click();
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// Switch back to list.
		await page.getByRole('button', { name: 'Daftar', exact: true }).click();

		// The list should reappear.
		await expect(page.getByRole('link', { name: /Kajian Tafsir Al-Quran/i }).first()).toBeVisible({
			timeout: 5_000
		});

		// The Leaflet container should no longer be in the DOM.
		await expect(page.locator('.leaflet-container')).toHaveCount(0);
	});
});
