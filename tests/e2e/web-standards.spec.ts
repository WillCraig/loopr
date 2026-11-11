import { expect, test } from '@playwright/test';

test('robots.txt allows search engines and blocks AI training scrapers', async ({ request }) => {
	const response = await request.get('/robots.txt');
	expect(response.status()).toBe(200);
	const body = await response.text();
	expect(body).toContain('User-agent: *');
	expect(body).toContain('Allow: /');

	// Groups are separated by blank lines; check each bot lands in the right one (#1).
	const groups = body.split(/\n\s*\n/).filter((g) => g.includes('User-agent:'));
	const groupFor = (bot: string) => groups.find((g) => g.includes(`User-agent: ${bot}`)) ?? '';
	for (const bot of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'Bytespider']) {
		expect(groupFor(bot), `${bot} should be disallowed`).toContain('Disallow: /');
	}
	// Assistant fetch bots retrieve a page for a user asking a question — allowed.
	for (const bot of [
		'ChatGPT-User',
		'Claude-Web',
		'PerplexityBot',
		'Applebot-Extended',
		'meta-externalagent',
		'meta-externalfetcher'
	]) {
		expect(groupFor(bot), `${bot} should be allowed`).toContain('Allow: /');
		expect(groupFor(bot)).not.toContain('Disallow:');
	}
	expect(body).toContain('Sitemap: https://loopr.willcsoftware.com/sitemap.xml');
});

test('favicon set and web manifest are served', async ({ request }) => {
	for (const path of [
		'/favicon.svg',
		'/favicon.ico',
		'/apple-touch-icon.png',
		'/icon-192.png',
		'/icon-512.png'
	]) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(200);
	}
	const manifest = await request.get('/site.webmanifest');
	expect(manifest.status()).toBe(200);
	const json = await manifest.json();
	expect(json.short_name).toBe('loopr');
	expect(json.icons.length).toBeGreaterThan(0);
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
