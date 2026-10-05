import { base } from '$app/paths';
import type { RequestHandler } from '@sveltejs/kit';
import { currentHead } from '$lib/public-config';
import { sitemapXml } from '$lib/site';

export const prerender = true;

export const GET: RequestHandler = () => {
	const { root } = currentHead(base);
	return new Response(sitemapXml(root), {
		headers: {
			'content-type': 'application/xml; charset=utf-8'
		}
	});
};
