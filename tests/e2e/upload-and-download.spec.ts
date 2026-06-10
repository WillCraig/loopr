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
	await page
		.locator('[data-testid="file-input"]')
		.first()
		.setInputFiles({
			name: 'simple_loop.gpx',
			mimeType: 'application/gpx+xml',
			buffer: gpxBuffer('simple_loop')
		});
	const totalBefore = await page.getByTestId('summary-total').textContent();

	await page.getByTestId('commute-toggle').click();
	const commuteInput = page.locator('[data-testid="file-input"]');
	await expect(commuteInput).toHaveCount(1);
	await commuteInput.setInputFiles({
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

test('point-to-point route shows the out-and-back callout, defaulted on', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'point_to_point.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('point_to_point')
	});
	await expect(page.getByTestId('oab-callout')).toBeVisible();
	await expect(page.getByTestId('oab-on')).toHaveAttribute('aria-checked', 'true');
	await expect(page.getByTestId('oab-roundtrip')).toContainText(/round trip/i);
	// Laps default to a single out-and-back, and the summary reflects it.
	await expect(page.getByTestId('laps-input')).toHaveValue('1');
	await expect(page.getByTestId('summary-laps')).toHaveText('1');
	await expect(page.getByTestId('summary-oab-chip')).toBeVisible();
	await expect(page.getByTestId('summary-name')).toContainText('River Path North out & back');
});

test('loop route never shows the out-and-back callout', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'simple_loop.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('simple_loop')
	});
	await expect(page.getByTestId('summary')).toBeVisible();
	await expect(page.getByTestId('oab-callout')).toHaveCount(0);
});

test('switching the callout to one-way undoes the conversion', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'point_to_point.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('point_to_point')
	});
	const total = page.getByTestId('summary-total');
	await expect(total).toContainText('1.4'); // 2 × 0.69 mi round trip
	await page.getByTestId('oab-off').click();
	await expect(page.getByTestId('oab-warning')).toContainText(/jump/i);
	await expect(total).toContainText('0.7'); // back to the one-way distance
	await expect(page.getByTestId('summary-oab-chip')).toHaveCount(0);
});

test('return-leg arrowhead is solid so its point survives the dash pattern', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'point_to_point.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('point_to_point')
	});
	await expect(page.getByTestId('oab-callout')).toBeVisible();
	// The chevron is ~20 units long; a dashed stroke puts its tip in a gap.
	const headDash = await page
		.locator('[data-testid="oab-callout"] .oab-return path:last-of-type')
		.evaluate((el) => getComputedStyle(el).strokeDasharray);
	expect(headDash).toBe('none');
	// The shaft must stay dashed — that's the visual language for "return leg".
	const shaftDash = await page
		.locator('[data-testid="oab-callout"] .oab-return path:first-of-type')
		.evaluate((el) => getComputedStyle(el).strokeDasharray);
	expect(shaftDash).not.toBe('none');
});

test('out-and-back download mirrors the route and names it accordingly', async ({ page }) => {
	await page.goto('/');
	await page.locator('[data-testid="file-input"]').setInputFiles({
		name: 'point_to_point.gpx',
		mimeType: 'application/gpx+xml',
		buffer: gpxBuffer('point_to_point')
	});
	await expect(page.getByTestId('download-button')).toBeEnabled();
	const downloadPromise = page.waitForEvent('download');
	await page.getByTestId('download-button').click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe('point_to_point-out-and-back.gpx');
	const stream = await download.createReadStream();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(chunk as Buffer);
	const xml = Buffer.concat(chunks).toString('utf8');
	expect(xml).toContain('River Path North out &amp; back');
	// 5 one-way points mirrored with the turnaround deduped = 9 trkpts.
	const trkptCount = (xml.match(/<trkpt/g) ?? []).length;
	expect(trkptCount).toBe(9);
	// The default marker checkbox adds a turnaround waypoint at B.
	expect(xml).toContain('<name>Turnaround</name>');
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
