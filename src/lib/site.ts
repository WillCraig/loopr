import { DEFAULT_BASE_PATH, DEFAULT_SITE_ORIGIN } from '../../site.config.js';

/** Public site metadata, crawl files, and optional analytics. No secrets. */

export const REPO_URL = 'https://github.com/WillCraig/loopr';

export const SITE_TITLE =
	'loopr — Free GPX Loop Repeater for Cyclists, Triathletes & Race Organizers';

export const SITE_DESCRIPTION =
	'Free GPX loop repeater for cyclists, triathlon bike legs, and crit race courses. Drop a GPX of one circuit, set laps or a distance target, download a stitched GPX for Garmin, Wahoo, or Strava. Runs in your browser.';

export const SITE_IMAGE_ALT =
	'loopr — repeat any GPX loop into a longer ride. Free and private, in the browser.';

const PLAUSIBLE_SCRIPT_DEFAULT = 'https://plausible.io/js/script.js';
const PLACEHOLDER = /YOUR_|CHANGE_?ME|PASTE_/i;

export interface AnalyticsEnv {
	provider?: string;
	goatcounter?: string;
	plausibleDomain?: string;
	plausibleScript?: string;
	cloudflareToken?: string;
}

export type Analytics =
	| { provider: 'goatcounter'; endpoint: string }
	| { provider: 'plausible'; domain: string; script: string }
	| { provider: 'cloudflare'; token: string };

export interface PageHead {
	root: string;
	title: string;
	description: string;
	image: string;
	imageAlt: string;
	jsonLd: Record<string, unknown>;
}

function clean(value: string | undefined): string {
	return (value ?? '').trim();
}

function isPlaceholder(value: string): boolean {
	return value.length === 0 || PLACEHOLDER.test(value);
}

function isHttpsUrl(value: string): boolean {
	if (isPlaceholder(value)) return false;
	try {
		return new URL(value).protocol === 'https:';
	} catch {
		return false;
	}
}

function isHostname(value: string): boolean {
	if (isPlaceholder(value)) return false;
	return /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i.test(value);
}

function isBeaconToken(value: string): boolean {
	if (isPlaceholder(value)) return false;
	return /^[A-Za-z0-9_-]{10,128}$/.test(value);
}

/** Origin only, no path. Invalid values fall back to the GitHub Pages host. */
export function publicSiteOrigin(raw?: string): string {
	const value = clean(raw).replace(/\/+$/, '');
	if (!value) return DEFAULT_SITE_ORIGIN;
	try {
		const url = new URL(value);
		if (url.protocol !== 'https:' && url.protocol !== 'http:') return DEFAULT_SITE_ORIGIN;
		return url.origin;
	} catch {
		return DEFAULT_SITE_ORIGIN;
	}
}

/**
 * Configured base path (`/loopr`), or `''` when the site is served at the host root.
 * Relative render bases (`.` / `..`) fall back to the project default.
 */
export function absoluteBase(runtimeBase: string | undefined): string {
	const value = clean(runtimeBase);
	if (value.startsWith('/')) return value.replace(/\/+$/, '');
	if (value === '') return '';
	return DEFAULT_BASE_PATH;
}

/** Absolute site root with a trailing slash. */
export function siteRoot(origin: string, basePath: string): string {
	const path = basePath === '/' ? '' : basePath.replace(/\/+$/, '');
	return `${origin}${path}/`;
}

export function pageHead(originRaw: string | undefined, runtimeBase: string | undefined): PageHead {
	const root = siteRoot(publicSiteOrigin(originRaw), absoluteBase(runtimeBase));
	return {
		root,
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		image: `${root}og-image.png`,
		imageAlt: SITE_IMAGE_ALT,
		jsonLd: jsonLd(root)
	};
}

export function jsonLd(root: string): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'loopr',
		url: root,
		applicationCategory: 'SportsApplication',
		operatingSystem: 'Any',
		browserRequirements: 'Requires JavaScript. GPX files stay in the browser.',
		isAccessibleForFree: true,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		description: SITE_DESCRIPTION,
		image: `${root}og-image.png`,
		inLanguage: 'en',
		license: 'https://spdx.org/licenses/MIT.html',
		author: {
			'@type': 'Organization',
			name: 'WillC Software House',
			url: 'https://willc.pro'
		},
		featureList: [
			'GPX loop and lap repeater',
			'Criterium race course builder',
			'Triathlon bike leg route planner',
			'Endurance athlete GPX tool',
			'Garmin Connect compatible',
			'Wahoo ELEMNT compatible',
			'Strava import support',
			'Privacy-first — files never leave your browser'
		]
	};
}

export function jsonLdScript(data: Record<string, unknown>): string {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}

export function robotsTxt(root: string): string {
	return `# loopr — ${root}
# Search engine crawlers are welcome. AI training scrapers are not.
# robots.txt is a courtesy convention, not an enforcement mechanism.
#
# GitHub Pages project sites: this file is published at ${root}robots.txt
# (the project serves it). Compliant crawlers request robots.txt from the
# host root. There is no user.github.io site in front of this project, so
# that root file 404s and crawlers may fetch the site. Submit the sitemap
# below in Search Console. The homepage also links rel="sitemap".

User-agent: *
Allow: /

# AI training scrapers and data-collection bots
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-Web
User-agent: anthropic-ai
User-agent: CCBot
User-agent: Google-Extended
User-agent: PerplexityBot
User-agent: Bytespider
User-agent: Applebot-Extended
User-agent: meta-externalagent
User-agent: meta-externalfetcher
User-agent: cohere-ai
User-agent: Diffbot
User-agent: ImagesiftBot
User-agent: img2dataset
User-agent: Timpibot
User-agent: YouBot
Disallow: /

Sitemap: ${root}sitemap.xml
`;
}

export function sitemapXml(root: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${root}</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}

export function securityTxt(root: string): string {
	return `Contact: ${REPO_URL}/security
Expires: 2027-08-31T00:00:00.000Z
Preferred-Languages: en
Canonical: ${root}.well-known/security.txt
`;
}

export function humansTxt(root: string): string {
	return `# humans.txt — real humans made this site.

WillC Software House — https://willc.pro
Site: ${root}
Source: ${REPO_URL}
Built with: SvelteKit, TypeScript, Vite — deployed to GitHub Pages
License: MIT
Thanks: the open-source GPS/cycling tooling community, and every rider who sent feedback.
`;
}

/**
 * Turn public build-time env into at most one analytics snippet.
 * Empty values and documented placeholders stay off. If more than one
 * service is configured, set PUBLIC_ANALYTICS_PROVIDER to pick one.
 */
export function resolveAnalytics(env: AnalyticsEnv): Analytics | null {
	const provider = clean(env.provider).toLowerCase();
	if (provider === 'off' || provider === 'none') return null;

	const goat = clean(env.goatcounter);
	const domain = clean(env.plausibleDomain);
	const script = clean(env.plausibleScript) || PLAUSIBLE_SCRIPT_DEFAULT;
	const token = clean(env.cloudflareToken);

	const goatOk = isHttpsUrl(goat);
	const plausibleOk = isHostname(domain) && isHttpsUrl(script);
	const cloudflareOk = isBeaconToken(token);

	if (provider === 'goatcounter')
		return goatOk ? { provider: 'goatcounter', endpoint: goat } : null;
	if (provider === 'plausible') {
		return plausibleOk ? { provider: 'plausible', domain, script } : null;
	}
	if (provider === 'cloudflare') return cloudflareOk ? { provider: 'cloudflare', token } : null;
	if (provider) return null;

	const enabled = [goatOk, plausibleOk, cloudflareOk].filter(Boolean).length;
	if (enabled !== 1) return null;
	if (goatOk) return { provider: 'goatcounter', endpoint: goat };
	if (plausibleOk) return { provider: 'plausible', domain, script };
	return { provider: 'cloudflare', token };
}

function escapeAttr(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** HTML for the chosen analytics snippet. Empty when analytics is off. */
export function analyticsSnippet(analytics: Analytics | null): string {
	if (!analytics) return '';
	if (analytics.provider === 'goatcounter') {
		return `<script data-loopr-analytics async src="https://gc.zgo.at/count.js" data-goatcounter="${escapeAttr(analytics.endpoint)}"></script>`;
	}
	if (analytics.provider === 'plausible') {
		return `<script data-loopr-analytics defer data-domain="${escapeAttr(analytics.domain)}" src="${escapeAttr(analytics.script)}"></script>`;
	}
	const beacon = escapeAttr(JSON.stringify({ token: analytics.token }));
	return `<script data-loopr-analytics defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="${beacon}"></script>`;
}
