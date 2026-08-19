import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

const fixture = (name: string) => resolve('tests', 'fixtures', `${name}.gpx`);

test.describe('@visual UI snapshots', () => {
	test('empty page', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('body')).toHaveScreenshot('empty-page.png');
	});

	test('configured route', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('sample-button').click();
		await expect(page.getByTestId('summary')).toBeVisible();
		await page.getByRole('radio', { name: 'Minimum distance' }).click();
		await expect(page.getByTestId('distance-hint')).toBeVisible();
		await expect(page.locator('body')).toHaveScreenshot('configured-route.png');
	});

	test('out-and-back route', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('file-input').setInputFiles(fixture('point_to_point'));
		await expect(page.getByTestId('oab-callout')).toBeVisible();
		await expect(page.locator('body')).toHaveScreenshot('out-and-back-route.png');
	});

	test('validation error', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('file-input').setInputFiles({
			name: 'broken.gpx',
			mimeType: 'application/gpx+xml',
			buffer: Buffer.from('<gpx><unclosed></gpx>')
		});
		await expect(page.getByRole('alert')).toBeVisible();
		await expect(page.locator('body')).toHaveScreenshot('validation-error.png');
	});
});
