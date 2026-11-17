import { expect, test } from '@playwright/test';

const root = 'https://willcraig.github.io/loopr/';

test('robots.txt allows search engines and blocks AI training scrapers', async ({ request }) => {
	const response = await request.get('/loopr/robots.txt');
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
	expect(body).toContain(`Sitemap: ${root}sitemap.xml`);
});

test('sitemap lists the project and privacy URLs', async ({ request }) => {
	const response = await request.get('/loopr/sitemap.xml');
	expect(response.status()).toBe(200);
	const body = await response.text();
	expect(body).toContain(`<loc>${root}</loc>`);
	expect(body).toContain(`<loc>${root}privacy</loc>`);
});

test('favicon set and web manifest are served', async ({ request }) => {
	for (const path of [
		'/loopr/favicon.svg',
		'/loopr/favicon.ico',
		'/loopr/apple-touch-icon.png',
		'/loopr/icon-192.png',
		'/loopr/icon-512.png'
	]) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(200);
	}
	const manifest = await request.get('/loopr/site.webmanifest');
	expect(manifest.status()).toBe(200);
	const json = await manifest.json();
	expect(json.short_name).toBe('loopr');
	expect(json.icons.length).toBeGreaterThan(0);
});

test('security.txt is RFC 9116 compliant and served from /.well-known', async ({ request }) => {
	const response = await request.get('/loopr/.well-known/security.txt');
	expect(response.status()).toBe(200);
	const body = await response.text();
	expect(body).toContain('Contact: https://github.com/WillCraig/loopr/security');
	expect(body).toMatch(/^Expires: \d{4}-\d{2}-\d{2}T/m);
	expect(body).toContain('Preferred-Languages: en');
	expect(body).toContain(`Canonical: ${root}.well-known/security.txt`);
});

test('humans.txt credits the humans behind the site', async ({ request }) => {
	const response = await request.get('/loopr/humans.txt');
	expect(response.status()).toBe(200);
	const body = await response.text();
	expect(body).toContain('WillC Software House');
	expect(body).toContain(`Site: ${root}`);
});

test('the homepage is crawlable HTML at the project base', async ({ request }) => {
	const response = await request.get('/loopr/');
	expect(response.status()).toBe(200);
	const body = await response.text();
	expect(body).toContain('<h1');
	expect(body).toContain('Repeat any loop');
	expect(body).toContain('WebApplication');
	expect(body).toContain(`<link rel="canonical" href="${root}"/>`);
	expect(body).not.toContain('willcsoftware');
	expect(body).not.toContain('goatcounter');
	expect(body).not.toContain('gc.zgo.at');
	expect(body).not.toContain('href="/_app/');
	expect(body).not.toContain('src="/_app/');
	expect(body).toContain('/loopr/_app/');
});

test('unknown paths get the branded 404 page', async ({ request }) => {
	const response = await request.get('/loopr/this-page-does-not-exist');
	expect(response.status()).toBe(404);
	const body = await response.text();
	expect(body).toContain('That route is off the map.');
	expect(body).toContain('Back to loopr');
	expect(body).not.toContain('href="/_app/');
	expect(body).not.toContain('src="/_app/');
	expect(body).toContain('/loopr/');
});

test('privacy page covers in-browser GPX processing and GoatCounter', async ({ request }) => {
	const response = await request.get('/loopr/privacy');
	expect(response.status()).toBe(200);
	const body = await response.text();
	expect(body).toContain('Processed only in your browser.');
	expect(body).toContain('GoatCounter');
	expect(body).toContain('no cookies');
	expect(body).toContain('does not store IP addresses');
	expect(body).toContain(`<link rel="canonical" href="${root}privacy"/>`);

	const sitemap = await request.get('/loopr/sitemap.xml');
	expect(await sitemap.text()).toContain(`<loc>${root}privacy</loc>`);
});
