/**
 * E2E tests for location onboarding, completion gate, and global settings.
 *
 * Conformance:
 *   - docs/plans/location-onboarding-settings.md § "Task 7: End-to-end flows"
 *   - rule .claude/rules/testing.md (Playwright e2e, *.e2e.ts suffix)
 */
import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
	page.on('console', (msg) => {
		console.log(`BROWSER LOG [${msg.type()}]: ${msg.text()}`);
	});
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function clearLocationState(page: Page): Promise<void> {
	try {
		await page.evaluate(() => {
			window.localStorage.removeItem('qarib:location-preference');
			window.localStorage.removeItem('qarib:location:center');
		});
	} catch {
		// Ignore SecurityError on about:blank
	}
	// Clear the completion cookie.
	await page.context().clearCookies();
}

async function grantGeolocation(page: Page, lat = -6.9147, lng = 107.6098): Promise<void> {
	await page.context().grantPermissions(['geolocation']);
	await page.evaluate(
		({ lat, lng }) => {
			const mockGeolocation = {
				getCurrentPosition: (success: PositionCallback) =>
					success({
						coords: { latitude: lat, longitude: lng, accuracy: 10 }
					} as GeolocationPosition)
			};
			Object.defineProperty(navigator, 'geolocation', {
				value: mockGeolocation,
				configurable: true
			});
		},
		{ lat, lng }
	);
}

async function setCompletionCookie(page: Page): Promise<void> {
	await page.evaluate(() => {
		document.cookie = 'qarib_location_complete=v1; path=/; SameSite=Lax';
	});
}

// ---------------------------------------------------------------------------
// Landing page — ungated
// ---------------------------------------------------------------------------

test('landing page loads without location marker', async ({ page }) => {
	await page.goto('/');
	await clearLocationState(page);
	await page.reload();
	await expect(page.locator('text=Qarib').first()).toBeVisible();
	await expect(page).not.toHaveURL(/\/lokasi/);
});

// ---------------------------------------------------------------------------
// App routes — gated
// ---------------------------------------------------------------------------

test('direct /peta redirects to /lokasi when no completion marker', async ({ page }) => {
	await clearLocationState(page);
	await page.goto('/peta?x=1');
	await expect(page).toHaveURL(/\/lokasi\?returnTo=/);
});

test('/peta loads after onboarding completion (first-run GPS)', async ({ page }) => {
	await clearLocationState(page);
	await page.goto('/peta');

	// Should redirect to /lokasi
	await expect(page).toHaveURL(/\/lokasi/);

	// Grant GPS and click the GPS button
	await grantGeolocation(page);
	await page.click('text=Gunakan lokasi GPS');

	// Save button should become enabled after GPS success
	await expect(page.locator('button[type="submit"]')).toBeEnabled();

	// Submit the form
	await page.click('button[type="submit"]');

	// Should land on /peta after completion
	await expect(page).toHaveURL(/\/peta/);
});

test('detail routes are gated', async ({ page }) => {
	await clearLocationState(page);
	await page.goto('/kajian/some-uuid');
	await expect(page).toHaveURL(/\/lokasi/);
	await page.goto('/tempat/some-uuid');
	await expect(page).toHaveURL(/\/lokasi/);
});

// ---------------------------------------------------------------------------
// First-run — manual selection
// ---------------------------------------------------------------------------

test('denied GPS requires manual city selection before save', async ({ page }) => {
	await clearLocationState(page);
	await page.goto('/lokasi');

	// Save should be disabled initially
	await expect(page.locator('button[type="submit"]')).toBeDisabled();

	// Select province → city
	await page.selectOption('#lokasi-province', { index: 1 }); // first province
	await expect(page.locator('#lokasi-city')).toBeEnabled();
	await page.selectOption('#lokasi-city', { index: 1 }); // first city

	// Save should now be enabled
	await expect(page.locator('button[type="submit"]')).toBeEnabled();
});

// ---------------------------------------------------------------------------
// Marker recovery (cleared cookies, valid localStorage)
// ---------------------------------------------------------------------------

test('marker-recovery restores cookie without rewriting preference', async ({ page }) => {
	await page.goto('/');
	await clearLocationState(page);

	// Pre-populate valid manual preference in localStorage
	await page.evaluate(() => {
		window.localStorage.setItem(
			'qarib:location-preference',
			JSON.stringify({
				version: 1,
				mode: 'manual',
				savedAt: '2026-06-10T08:00:00+07:00',
				province: { id: '32', name: 'Jawa Barat' },
				city: { id: '3273', name: 'Kota Bandung' }
			})
		);
	});

	// Visit /peta without marker → redirect
	await page.goto('/peta');
	await expect(page).toHaveURL(/\/lokasi/);
	// Marker-recovery mode: should show saved summary
	await expect(page.locator('text=Lokasi tersimpan').first()).toBeVisible();
	await expect(page.locator('text=Kota Bandung, Jawa Barat')).toBeVisible();
	// Click recovery action
	await page.click('text=Lanjutkan dengan lokasi tersimpan');

	// Should return to /peta
	await expect(page).toHaveURL(/\/peta/);

	// Preference should remain unchanged
	const pref = await page.evaluate(() => window.localStorage.getItem('qarib:location-preference'));
	expect(JSON.parse(pref!).city.name).toBe('Kota Bandung');
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

test('settings opens from app header and shows location summary', async ({ page }) => {
	await page.goto('/');
	await clearLocationState(page);
	await setCompletionCookie(page);
	await page.evaluate(() => {
		window.localStorage.setItem(
			'qarib:location-preference',
			JSON.stringify({
				version: 1,
				mode: 'manual',
				savedAt: '2026-06-10T08:00:00+07:00',
				province: { id: '32', name: 'Jawa Barat' },
				city: { id: '3273', name: 'Kota Bandung' }
			})
		);
	});

	await page.goto('/peta');

	// Click settings gear
	await page.click('[aria-label="Lokasi"]');

	// Settings sheet should appear
	await expect(page.locator('[role="dialog"]')).toBeVisible();
	await expect(page.locator('text=Kota Bandung, Jawa Barat')).toBeVisible();
	await expect(page.locator('text=Ganti lokasi')).toBeVisible();

	// No Hapus button
	await expect(page.locator('text=Hapus')).not.toBeVisible();

	// No language controls
	await expect(page.locator('text=Bahasa')).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// Navigation — Back after onboarding
// ---------------------------------------------------------------------------

test('Back after successful onboarding does not reopen onboarding', async ({ page }) => {
	await clearLocationState(page);

	// Complete first-run onboarding
	await page.goto('/peta');
	await expect(page).toHaveURL(/\/lokasi/);
	await grantGeolocation(page);
	await page.click('text=Gunakan lokasi GPS');
	await page.click('button[type="submit"]');
	await expect(page).toHaveURL(/\/peta/);

	// Navigate back
	await page.goBack();
	// Should NOT be on /lokasi — replacement navigation prevents this
	await expect(page).not.toHaveURL(/\/lokasi/);
});
