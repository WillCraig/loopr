import { expect, test } from '@playwright/test';

const root = 'https://willcraig.github.io/loopr/';

test('robots.txt allows search engines and blocks AI training scrapers', async ({ request }) => {
	const response = await request.get('/loopr/robots.txt');
	expect(response.status()).toBe(200);
	const body = await response.text();
	expect(body).toContain('User-agent: *');
	expect(body).toContain('Allow: /');
	for (const bot of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'PerplexityBot']) {
		expect(body).toContain(`User-agent: ${bot}`);
	}
	expect(body).toContain('Disallow: /');
	expect(body).toContain(`Sitemap: ${root}sitemap.xml`);
});

test('sitemap lists the project URL', async ({ request }) => {
	const response = await request.get('/loopr/sitemap.xml');
	expect(response.status()).toBe(200);
	expect(await response.text()).toContain(`<loc>${root}</loc>`);
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
