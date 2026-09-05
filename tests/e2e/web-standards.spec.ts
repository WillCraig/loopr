import { expect, test } from '@playwright/test';

test('robots.txt allows search engines and blocks AI training scrapers', async ({ request }) => {
	const response = await request.get('/robots.txt');
	expect(response.status()).toBe(200);
	const body = await response.text();
	expect(body).toContain('User-agent: *');
	expect(body).toContain('Allow: /');
	for (const bot of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'PerplexityBot']) {
		expect(body).toContain(`User-agent: ${bot}`);
	}
	expect(body).toContain('Disallow: /');
	expect(body).toContain('Sitemap: https://loopr.willcsoftware.com/sitemap.xml');
});

test('security.txt is RFC 9116 compliant and served from /.well-known', async ({ request }) => {
	const response = await request.get('/.well-known/security.txt');
	expect(response.status()).toBe(200);
	const body = await response.text();
	expect(body).toContain('Contact: https://github.com/WillCraig/loopr/security');
	expect(body).toMatch(/^Expires: \d{4}-\d{2}-\d{2}T/m);
	expect(body).toContain('Preferred-Languages: en');
});

test('humans.txt credits the humans behind the site', async ({ request }) => {
	const response = await request.get('/humans.txt');
	expect(response.status()).toBe(200);
	expect(await response.text()).toContain('WillC Software House');
});

test('unknown paths get the branded 404 page', async ({ request }) => {
	const response = await request.get('/this-page-does-not-exist');
	expect(response.status()).toBe(404);
	const body = await response.text();
	expect(body).toContain('That route is off the map.');
	expect(body).toContain('Back to loopr');
});
