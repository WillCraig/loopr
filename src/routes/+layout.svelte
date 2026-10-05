<script lang="ts">
	import '@fontsource/geist/latin-400.css';
	import '@fontsource/geist/latin-500.css';
	import '@fontsource/geist/latin-600.css';
	import '@fontsource/geist-mono/latin-400.css';
	import '@fontsource/geist-mono/latin-500.css';
	import '@fontsource/geist-mono/latin-600.css';
	import geistRegularUrl from '@fontsource/geist/files/geist-latin-400-normal.woff2?url';
	import '../app.css';
	import Analytics from '$lib/components/Analytics.svelte';

	let { children } = $props();
</script>

<Analytics />

<svelte:head>
	<link rel="preload" href={geistRegularUrl} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{@render children()}
