import { test, expect } from '@playwright/test';

test('home renders the Qarib brand in Bahasa', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('lang', 'id');
	await expect(page.getByRole('link', { name: /Qarib/ })).toBeVisible();
	await expect(page.getByText('Kajian terdekat, dalam satu ketukan.')).toBeVisible();
});
