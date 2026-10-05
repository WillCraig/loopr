import { base } from '$app/paths';
import type { RequestHandler } from '@sveltejs/kit';
import { currentHead } from '$lib/public-config';
import { humansTxt } from '$lib/site';

export const prerender = true;

export const GET: RequestHandler = () => {
	const { root } = currentHead(base);
	return new Response(humansTxt(root), {
		headers: {
			'content-type': 'text/plain; charset=utf-8'
		}
	});
};
