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
import { test, expect, type Page } from '@playwright/test';

function addDaysIso(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}

async function useCirebonGeolocation(page: Page): Promise<void> {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'geolocation', {
			configurable: true,
			value: {
				getCurrentPosition(success: PositionCallback): void {
					success({
						coords: {
							latitude: -6.732,
							longitude: 108.5523,
							accuracy: 10,
							altitude: null,
							altitudeAccuracy: null,
							heading: null,
							speed: null
						},
						timestamp: Date.now()
					} as GeolocationPosition);
				}
			}
		});
	});
}

async function denyGeolocation(page: Page, message = 'User denied Geolocation'): Promise<void> {
	await page.addInitScript((errorMessage) => {
		const win = window as Window & { __qaribGeoCalls?: number };
		Object.defineProperty(navigator, 'geolocation', {
			configurable: true,
			value: {
				getCurrentPosition(_success: PositionCallback, error?: PositionErrorCallback): void {
					win.__qaribGeoCalls = (win.__qaribGeoCalls ?? 0) + 1;
					error?.({
						code: 1,
						message: errorMessage,
						PERMISSION_DENIED: 1,
						POSITION_UNAVAILABLE: 2,
						TIMEOUT: 3
					} as GeolocationPositionError);
				}
			}
		});
	}, message);
}

function waitForNearbyRequest(
	page: Page,
	predicate: (params: URLSearchParams) => boolean
): Promise<URLSearchParams> {
	return page
		.waitForRequest((request) => {
			if (!request.url().includes('/api/upstream/events/nearby')) return false;
			return predicate(new URL(request.url()).searchParams);
		})
		.then((request) => new URL(request.url()).searchParams);
}

function waitForNearbyResponse(
	page: Page,
	predicate: (params: URLSearchParams) => boolean
): Promise<void> {
	return page
		.waitForResponse((response) => {
			if (!response.url().includes('/api/upstream/events/nearby')) return false;
			if (!response.ok()) return false;
			return predicate(new URL(response.url()).searchParams);
		})
		.then(() => undefined);
}

function filterToolbar(page: Page) {
	return page.getByRole('toolbar', { name: 'Filter kajian di peta' });
}

function eventPinMarkers(page: Page) {
	return page.locator('.leaflet-marker-icon').filter({ hasText: /\d{2}:\d{2}|NOW|Besok|Nanti/ });
}

function placePinMarkers(page: Page) {
	return page.locator('.leaflet-marker-icon').filter({ hasText: /Nanti/ });
}

async function openDateSheet(page: Page): Promise<void> {
	await filterToolbar(page).getByRole('button').first().click();
	await expect(page.getByRole('dialog', { name: 'Pilih tanggal' })).toBeVisible();
}

async function openSubjectSheet(page: Page): Promise<void> {
	await filterToolbar(page).getByRole('button').nth(1).click();
	await expect(page.getByRole('dialog', { name: 'Pilih tema' })).toBeVisible();
}

async function selectSubject(
	page: Page,
	name: string,
	subjectId: string
): Promise<URLSearchParams> {
	await openSubjectSheet(page);
	const request = waitForNearbyRequest(
		page,
		(params) => params.get('subject_id') === subjectId && params.get('limit') === '10'
	);
	await page.getByRole('button', { name, exact: true }).click();
	return request;
}

test.describe('/peta — Hi-Fi v2 map home', () => {
	test.describe.configure({ mode: 'serial' });

	test.beforeEach(async ({ page }) => {
		await useCirebonGeolocation(page);
	});

	test('renders the map container full-bleed (no list/map toggle present)', async ({ page }) => {
		const fallbackRequests: URLSearchParams[] = [];
		page.on('request', (request) => {
			if (!request.url().includes('/api/upstream/events/nearby')) return;
			const params = new URL(request.url()).searchParams;
			if (params.get('limit') === '30' && params.get('radius_km') === '100') {
				fallbackRequests.push(params);
			}
		});

		await page.goto('/peta');

		// Map container must be present — Leaflet renders this when the island mounts.
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// Confirm the old toggle buttons are gone.
		await expect(page.getByRole('button', { name: 'Peta', exact: true })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Daftar', exact: true })).toHaveCount(0);
		expect(fallbackRequests).toHaveLength(0);
	});

	test('shows location-denied sheet over the visible default-area map with retry action', async ({
		page
	}) => {
		await denyGeolocation(page);
		await page.goto('/peta');

		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		const notice = page.getByRole('status').filter({ hasText: 'Izin lokasi ditolak' });
		await expect(notice).toBeVisible();
		await expect(notice).toContainText('Cirebon');
		await expect(notice.getByRole('button', { name: 'Pakai Cirebon' })).toBeVisible();

		const noticeBox = await notice.boundingBox();
		const mapBox = await page
			.getByRole('application', { name: 'Peta kajian interaktif' })
			.boundingBox();
		expect(noticeBox).not.toBeNull();
		expect(mapBox).not.toBeNull();
		if (noticeBox && mapBox) {
			const noticeCenterX = noticeBox.x + noticeBox.width / 2;
			const noticeCenterY = noticeBox.y + noticeBox.height / 2;
			expect(Math.abs(noticeCenterX - (mapBox.x + mapBox.width / 2))).toBeLessThan(32);
			expect(Math.abs(noticeCenterY - (mapBox.y + mapBox.height / 2))).toBeLessThan(64);
		}

		await expect(async () => {
			expect(
				await page.evaluate(() => (window as Window & { __qaribGeoCalls?: number }).__qaribGeoCalls)
			).toBe(1);
		}).toPass();

		await notice.getByRole('button', { name: 'Coba GPS lagi' }).click();

		await expect(async () => {
			expect(
				await page.evaluate(() => (window as Window & { __qaribGeoCalls?: number }).__qaribGeoCalls)
			).toBe(2);
		}).toPass();
	});

	test('renders the date filter chip strip over the map', async ({ page }) => {
		await page.goto('/peta');

		// Wait for map to mount.
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// "Hari ini" chip is the first chip in the filter strip.
		await expect(filterToolbar(page).getByRole('button', { name: 'Hari ini' })).toBeVisible();
	});

	test('tomorrow and custom date filters refetch nearby events with date query args', async ({
		page
	}) => {
		await page.goto('/peta');
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		await openDateSheet(page);

		const tomorrowIso = addDaysIso(1);
		const tomorrowRequest = waitForNearbyRequest(page, (params) =>
			params.get('date_from')?.startsWith(`${tomorrowIso}T00:00:00`)
		);
		await page
			.getByRole('dialog', { name: 'Pilih tanggal' })
			.getByRole('button', { name: 'Besok', exact: true })
			.click();
		expect((await tomorrowRequest).get('date_to')).toContain(`${tomorrowIso}T23:59:59`);

		await openDateSheet(page);

		const customIso = addDaysIso(5);
		const customLabel = new Intl.DateTimeFormat('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(`${customIso}T00:00:00`));
		const customRequest = waitForNearbyRequest(page, (params) =>
			params.get('date_from')?.startsWith(`${customIso}T00:00:00`)
		);
		await page.getByRole('button', { name: 'Tanggal lain' }).click();
		await expect(page.getByRole('grid', { name: 'Pilih tanggal lain' })).toBeVisible();
		await page.getByRole('button', { name: `Pilih ${customLabel}` }).click();
		expect((await customRequest).get('date_to')).toContain(`${customIso}T23:59:59`);
	});

	test('subject selector loads subjects and filters nearby query by subject_id', async ({
		page
	}) => {
		await page.goto('/peta');
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		await openSubjectSheet(page);
		await expect(page.getByRole('button', { name: 'Tafsir', exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Fiqih', exact: true })).toBeVisible();

		const request = waitForNearbyRequest(
			page,
			(params) => params.get('subject_id') === 'subject-tafsir' && params.get('limit') === '10'
		);
		const response = waitForNearbyResponse(
			page,
			(params) => params.get('subject_id') === 'subject-tafsir' && params.get('limit') === '10'
		);
		await page.getByRole('button', { name: 'Tafsir', exact: true }).click();
		expect((await request).get('subject_id')).toBe('subject-tafsir');
		await response;

		await expect(filterToolbar(page).getByRole('button', { name: 'Tafsir' })).toBeVisible();
		await expect(eventPinMarkers(page)).toHaveCount(1);
	});

	test('empty filtered results keep the map visible, expand radius, and group future place suggestions', async ({
		page
	}) => {
		await page.goto('/peta');
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		const fallbackRequest = waitForNearbyRequest(
			page,
			(params) => params.get('subject_id') === 'subject-empty' && params.get('limit') === '30'
		);
		const currentRequest = await selectSubject(page, 'Fiqih', 'subject-empty');
		await fallbackRequest;

		expect(currentRequest.get('radius_km')).toBe('10');
		await expect(page.locator('.leaflet-container').first()).toBeVisible();

		const emptySheet = page.getByRole('status').filter({ hasText: 'Belum ada di area ini' });
		await expect(emptySheet).toBeVisible();
		await expect(emptySheet).toContainText('radius 10 km');
		await expect(emptySheet.getByRole('button', { name: 'Perluas ke 15 km' })).toBeVisible();
		await expect(emptySheet.getByRole('button', { name: 'Cek besok' })).toBeVisible();

		await expect(emptySheet).toContainText('Masjid dengan kajian mendatang');
		await expect(emptySheet).toContainText('Masjid Masa Depan');
		await expect(emptySheet).toContainText('1 kajian');

		for (const radius of [15, 25, 40, 60]) {
			const request = waitForNearbyRequest(
				page,
				(params) =>
					params.get('subject_id') === 'subject-empty' &&
					params.get('radius_km') === String(radius) &&
					params.get('limit') === '10'
			);
			await emptySheet.getByRole('button', { name: new RegExp(`${radius} km`) }).click();
			expect((await request).get('radius_km')).toBe(String(radius));
		}

		await expect(emptySheet.getByRole('button', { name: 'Radius 60 km' })).toBeDisabled();

		await emptySheet.getByRole('button', { name: /Masjid Masa Depan/ }).click();
		await expect(page).toHaveURL(/\/tempat\/place-future-1$/);
	});

	test('renders Leaflet markers for the stub places', async ({ page }) => {
		await page.goto('/peta');

		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// The two stub events belong to two places; nearby place list adds one place-only pin.
		const markers = eventPinMarkers(page);
		await expect(markers.first()).toBeVisible({ timeout: 10_000 });
		await expect(markers).toHaveCount(3);
		await expect(placePinMarkers(page)).toHaveCount(1);
	});

	test('GPS FAB is rendered', async ({ page }) => {
		await page.goto('/peta');

		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		// MapFab renders a button with the GPS aria-label.
		await expect(page.getByRole('button', { name: /Lokasiku/i }).first()).toBeVisible();
	});

	test('custom zoom controls are bottom-right and Leaflet default zoom control is absent', async ({
		page
	}) => {
		await page.goto('/peta');
		await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });

		const zoomIn = page.getByRole('button', { name: 'Perbesar peta' });
		const zoomOut = page.getByRole('button', { name: 'Perkecil peta' });
		await expect(zoomIn).toBeVisible();
		await expect(zoomOut).toBeVisible();
		await expect(page.locator('.leaflet-control-zoom')).toHaveCount(0);

		const box = await zoomIn.boundingBox();
		const mapBox = await page
			.getByRole('application', { name: 'Peta kajian interaktif' })
			.boundingBox();
		expect(box).not.toBeNull();
		expect(mapBox).not.toBeNull();
		if (box && mapBox) {
			expect(box.x).toBeGreaterThan(mapBox.x + mapBox.width - 90);
			expect(box.y).toBeGreaterThan(mapBox.y + mapBox.height / 2);
		}
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
