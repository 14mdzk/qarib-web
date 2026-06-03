import { test, expect } from '@playwright/test';

test('home renders the marketing landing in Bahasa', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('lang', 'id');
	// hero heading contains the key word "terdekat"
	await expect(page.getByRole('heading', { level: 1 })).toContainText('terdekat');
	// nav brand link is visible
	await expect(page.getByRole('link', { name: /Qarib/ }).first()).toBeVisible();
	// "Buka Qarib" CTA is visible
	await expect(page.getByRole('link', { name: 'Buka Qarib' })).toBeVisible();
});
