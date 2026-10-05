import { expect, test } from 'vitest';
import {
	SITE_DESCRIPTION,
	analyticsSnippet,
	humansTxt,
	pageHead,
	publicSiteOrigin,
	resolveAnalytics,
	robotsTxt,
	securityTxt,
	sitemapXml
} from '../../src/lib/site';

const root = 'https://willcraig.github.io/loopr/';

test('public URLs use the GitHub Pages project base', () => {
	const head = pageHead(undefined, '/loopr');
	expect(head.root).toBe(root);
	expect(head.image).toBe(`${root}og-image.png`);
	expect(head.description).toBe(SITE_DESCRIPTION);
	expect(head.jsonLd.url).toBe(root);
	expect(head.jsonLd['@type']).toBe('WebApplication');
});

test('a relative render base still publishes the project path', () => {
	expect(pageHead(undefined, '.').root).toBe(root);
	expect(pageHead(undefined, '').root).toBe('https://willcraig.github.io/');
});

test('invalid origins fall back to the Pages host', () => {
	expect(publicSiteOrigin('not a url')).toBe('https://willcraig.github.io');
	expect(publicSiteOrigin('https://loopr.example/ignored')).toBe('https://loopr.example');
});

test('robots and sitemap advertise the project with absolute URLs', () => {
	const robots = robotsTxt(root);
	expect(robots).toContain('User-agent: *');
	expect(robots).toContain('Allow: /');
	expect(robots).toContain('User-agent: GPTBot');
	expect(robots).toContain('Disallow: /');
	expect(robots).toContain(`Sitemap: ${root}sitemap.xml`);
	expect(sitemapXml(root)).toContain(`<loc>${root}</loc>`);
	expect(securityTxt(root)).toContain(`Canonical: ${root}.well-known/security.txt`);
	expect(humansTxt(root)).toContain(`Site: ${root}`);
});

test('analytics stays off without a real public id', () => {
	expect(resolveAnalytics({})).toBeNull();
	expect(resolveAnalytics({ goatcounter: 'https://YOUR_CODE.goatcounter.com/count' })).toBeNull();
	expect(resolveAnalytics({ provider: 'goatcounter' })).toBeNull();
	expect(
		resolveAnalytics({ provider: 'off', goatcounter: 'https://stats.example.com/count' })
	).toBeNull();
});

test('one configured provider is enough to enable analytics', () => {
	expect(resolveAnalytics({ goatcounter: 'https://stats.example.com/count' })).toEqual({
		provider: 'goatcounter',
		endpoint: 'https://stats.example.com/count'
	});
	expect(
		resolveAnalytics({
			provider: 'plausible',
			plausibleDomain: 'willcraig.github.io'
		})
	).toEqual({
		provider: 'plausible',
		domain: 'willcraig.github.io',
		script: 'https://plausible.io/js/script.js'
	});
	expect(resolveAnalytics({ cloudflareToken: 'abcdef1234567890' })).toEqual({
		provider: 'cloudflare',
		token: 'abcdef1234567890'
	});
});

test('analytics snippets only render a configured provider', () => {
	expect(analyticsSnippet(null)).toBe('');
	const goat = analyticsSnippet(
		resolveAnalytics({ goatcounter: 'https://stats.example.com/count' })
	);
	expect(goat).toContain('data-loopr-analytics');
	expect(goat).toContain('https://gc.zgo.at/count.js');
	expect(goat).toContain('https://stats.example.com/count');
	expect(analyticsSnippet(resolveAnalytics({ cloudflareToken: 'abcdef1234567890' }))).toContain(
		'cloudflareinsights.com/beacon.min.js'
	);
});

test('ambiguous analytics config does not guess', () => {
	expect(
		resolveAnalytics({
			goatcounter: 'https://stats.example.com/count',
			plausibleDomain: 'willcraig.github.io'
		})
	).toBeNull();
});
