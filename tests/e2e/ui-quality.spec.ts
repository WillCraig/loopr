import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function loadSample(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.getByTestId('sample-button').click();
	await expect(page.getByTestId('summary')).toBeVisible();
}

test('the app and its essential assets are available without browser errors', async ({ page }) => {
	const browserErrors: string[] = [];
	const failedResponses: string[] = [];
	page.on('console', (message) => {
		if (message.type() === 'error') browserErrors.push(message.text());
	});
	page.on('pageerror', (error) => browserErrors.push(error.message));
	page.on('response', (response) => {
		if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
	});

	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	await expect(page).toHaveTitle(/loopr/i);
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		'https://loopr.willcsoftware.com/'
	);
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Repeat any loop');
	await expect(page.getByRole('button', { name: /Drop your GPX file/i })).toBeVisible();
	await expect(page.getByRole('contentinfo')).toBeVisible();

	expect(failedResponses).toEqual([]);
	expect(browserErrors).toEqual([]);
});

test('the core UI journey works', async ({ page }) => {
	await loadSample(page);

	await expect(page.getByTestId('summary-name')).toContainText('x2');
	await page.getByRole('button', { name: 'More laps' }).click();
	await expect(page.getByTestId('summary-laps')).toHaveText('3');

	await page.getByRole('radio', { name: 'km' }).click();
	await expect(page.getByTestId('summary-total')).toContainText('km');
	await expect(page.getByTestId('download-button')).toBeEnabled();

	const downloadPromise = page.waitForEvent('download');
	await page.getByTestId('download-button').click();
	await expect((await downloadPromise).suggestedFilename()).toBe('blue-ridge-sampler-x3.gpx');
});

test('the empty and populated screens have no serious accessibility violations', async ({
	page
}) => {
	await page.goto('/');
	const empty = await new AxeBuilder({ page }).analyze();
	expect(
		empty.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')
	).toEqual([]);

	await page.getByTestId('sample-button').click();
	await expect(page.getByTestId('summary')).toBeVisible();
	const populated = await new AxeBuilder({ page }).analyze();
	expect(
		populated.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')
	).toEqual([]);
});

test('keyboard activation works for the primary controls', async ({ page }) => {
	await page.goto('/');
	const kilometers = page.getByRole('radio', { name: 'km', exact: true });
	await kilometers.focus();
	await expect(kilometers).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(kilometers).toHaveAttribute('aria-checked', 'true');

	const dropzone = page.getByRole('button', { name: /Drop your GPX file/i });
	await dropzone.focus();
	await expect(dropzone).toBeFocused();
	const chooserPromise = page.waitForEvent('filechooser');
	await page.keyboard.press('Enter');
	await (await chooserPromise).setFiles([]);

	await page.getByTestId('sample-button').focus();
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('summary')).toBeVisible();
});

test('the page never overflows the viewport', async ({ page }) => {
	await loadSample(page);
	const dimensions = await page.evaluate(() => ({
		documentWidth: document.documentElement.scrollWidth,
		viewportWidth: document.documentElement.clientWidth
	}));
	expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
	await page.getByTestId('download-button').scrollIntoViewIfNeeded();
	await expect(page.getByTestId('download-button')).toBeVisible();
});
