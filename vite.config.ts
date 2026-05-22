import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'happy-dom',
		include: ['tests/unit/**/*.{test,spec}.ts'],
		expect: { requireAssertions: true }
	}
});
