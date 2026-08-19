import { defineConfig, devices } from '@playwright/test';

const uiSpecs = /.*(?:ui-quality|visual)\.spec\.ts/;

export default defineConfig({
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	outputDir: 'test-results/artifacts',
	snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'tests/e2e',
	testMatch: '**/*.spec.ts',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	expect: {
		toHaveScreenshot: {
			animations: 'disabled',
			caret: 'hide',
			maxDiffPixelRatio: 0.005,
			threshold: 0.2
		}
	},
	projects: [
		{
			name: 'desktop-chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'desktop-firefox',
			testMatch: uiSpecs,
			use: { ...devices['Desktop Firefox'] }
		},
		{
			name: 'desktop-webkit',
			testMatch: uiSpecs,
			use: { ...devices['Desktop Safari'] }
		},
		{
			name: 'mobile-chromium',
			testMatch: uiSpecs,
			use: { ...devices['Pixel 7'] }
		},
		{
			name: 'mobile-webkit',
			testMatch: uiSpecs,
			use: { ...devices['iPhone 15'] }
		}
	]
});
