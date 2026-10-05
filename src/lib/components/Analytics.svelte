<script lang="ts">
	import { currentAnalyticsSnippet } from '$lib/public-config';

	const snippet = currentAnalyticsSnippet();
</script>

<svelte:head>
	{#if snippet}
		<!-- Snippet is built from validated public env, with attributes escaped. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html snippet}
	{/if}
</svelte:head>
