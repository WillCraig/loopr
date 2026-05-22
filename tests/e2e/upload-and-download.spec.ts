import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, '..', 'fixtures');

function gpxBuffer(name: string): Buffer {
	return Buffer.from(readFileSync(resolve(fixtures, `${name}.gpx`)));
}

test('page loads with empty drop zone visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /Repeat any loop/i })).toBeVisible();
	await expect(page.getByText('Drop your route here')).toBeVisible();
});

test('uploading simple_loop.gpx populates the summary card', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'simple_loop.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('simple_loop')
	});
	await expect(page.getByTestId('summary')).toBeVisible();
	await expect(page.getByTestId('summary-name')).toContainText('Kent Square Loop');
	await expect(page.getByTestId('summary-laps')).toHaveText('2');
});

test('changing laps updates summary in real time', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'simple_loop.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('simple_loop')
	});
	await expect(page.getByTestId('summary-laps')).toHaveText('2');
	const lapsInput = page.getByTestId('laps-input');
	await lapsInput.fill('5');
	await expect(page.getByTestId('summary-laps')).toHaveText('5');
});

test('toggling lap waypoints does not crash and keeps the summary stable', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'simple_loop.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('simple_loop')
	});
	const before = await page.getByTestId('summary-laps').textContent();
	// The real <input> is visually hidden; click the wrapping label instead.
	const markerLabel = page.locator('label.check').filter({
		hasText: 'Add a marker at the start of each lap'
	});
	await markerLabel.click();
	await markerLabel.click();
	const after = await page.getByTestId('summary-laps').textContent();
	expect(after).toBe(before);
});

test('switching units updates displayed values', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'simple_loop.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('simple_loop')
	});
	const total = page.getByTestId('summary-total');
	await expect(total).toContainText('mi');
	await page.getByRole('radio', { name: 'km' }).click();
	await expect(total).toContainText('km');
});

test('download button produces a file with expected name', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'simple_loop.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('simple_loop')
	});
	await expect(page.getByTestId('download-button')).toBeEnabled();
	const downloadPromise = page.waitForEvent('download');
	await page.getByTestId('download-button').click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe('simple_loop-x2.gpx');
});

test('downloaded file parses back to a valid GPX with expected point count', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'simple_loop.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('simple_loop')
	});
	await page.getByTestId('laps-input').fill('3');
	const downloadPromise = page.waitForEvent('download');
	await page.getByTestId('download-button').click();
	const download = await downloadPromise;
	const stream = await download.createReadStream();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(chunk as Buffer);
	const xml = Buffer.concat(chunks).toString('utf8');
	expect(xml).toContain('<gpx');
	expect(xml).toContain('Kent Square Loop x3');
	// 5 input points × 3 laps with dedup = 3*4 + 1 = 13 trkpts.
	const trkptCount = (xml.match(/<trkpt/g) ?? []).length;
	expect(trkptCount).toBe(13);
});

test('uploading no_track.gpx shows the "no track" error inline', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'no_track.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('no_track')
	});
	await expect(page.getByRole('alert')).toContainText(/no track/i);
});

test('uploading malformed GPX shows the parse error inline', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'broken.gpx',
		mimeType: 'application/gpx+xml',
		buffer: Buffer.from('<gpx><unclosed></gpx>')
	});
	await expect(page.getByRole('alert')).toContainText(/valid GPX/i);
});

test('adding a commute extends total distance and writes a -with-commute filename', async ({
	page
}) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').first().setInputFiles({
		name: 'simple_loop.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('simple_loop')
	});
	const totalBefore = await page.getByTestId('summary-total').textContent();

	await page.getByTestId('commute-toggle').click();
	const fileInputs = page.locator('[data-testid="file-input"]');
	await expect(fileInputs).toHaveCount(2);
	await fileInputs.nth(1).setInputFiles({
		name: 'commute_segment.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('commute_segment')
	});

	await expect(page.getByTestId('summary-commute')).toBeVisible();
	await expect(page.getByTestId('summary-commute')).toContainText(/commute each way/i);
	const totalAfter = await page.getByTestId('summary-total').textContent();
	expect(totalAfter).not.toBe(totalBefore);

	const downloadPromise = page.waitForEvent('download');
	await page.getByTestId('download-button').click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe('simple_loop-x2-with-commute.gpx');
});

test('minDistance mode shows live "→ N laps → X mi" hint', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'simple_loop.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('simple_loop')
	});
	await page.getByRole('radio', { name: 'Minimum distance' }).click();
	const hint = page.getByTestId('distance-hint');
	await expect(hint).toBeVisible();
	await expect(hint).toContainText(/laps/i);
	await expect(hint).toContainText(/total/i);
});
