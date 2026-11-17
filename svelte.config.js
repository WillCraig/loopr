import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { DEFAULT_BASE_PATH } from './site.config.js';

// GitHub Pages project sites are served at /<repo>/. SvelteKit keeps a trailing
// slash on that base root, which matches Pages' /loopr → /loopr/ redirect.
// Override with BASE_PATH= (empty) when building for a host-root custom domain.
// This is read from the process environment, not from Vite's .env files.
const base = process.env.BASE_PATH === undefined ? DEFAULT_BASE_PATH : process.env.BASE_PATH;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		paths: {
			base,
			// Absolute /loopr/... URLs so the homepage, fonts, and the 404 shell
			// all resolve on a project Pages site. Relative links break the fallback
			// page, which GitHub serves at unknown paths.
			relative: false
		},
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		})
	}
};

export default config;
