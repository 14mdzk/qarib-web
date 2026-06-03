/**
 * E2E tests for the /peta nearby-kajian list view.
 *
 * The upstream stub (e2e/upstream-stub.ts) handles `GET /events/nearby?…`
 * with a prefix match and returns two occurrences. These tests assert that:
 *   - /peta loads and renders at least one EventCard (kajian title + masjid name).
 *   - Each card links to /kajian/{id}.
 *   - The date strip is rendered.
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
