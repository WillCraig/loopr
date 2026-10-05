<script lang="ts">
	import { base } from '$app/paths';
	import { currentHead } from '$lib/public-config';
	import { jsonLdScript } from '$lib/site';

	const head = currentHead(base);
	const structuredData = jsonLdScript(head.jsonLd);
</script>

<svelte:head>
	<title>{head.title}</title>
	<meta name="description" content={head.description} />
	<link rel="canonical" href={head.root} />
	<link rel="sitemap" type="application/xml" href="{head.root}sitemap.xml" />
	<meta name="robots" content="index, follow" />
	<meta name="theme-color" content="#ece5d3" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#15130f" media="(prefers-color-scheme: dark)" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="loopr" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:url" content={head.root} />
	<meta property="og:title" content={head.title} />
	<meta property="og:description" content={head.description} />
	<meta property="og:image" content={head.image} />
	<meta property="og:image:alt" content={head.imageAlt} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={head.title} />
	<meta name="twitter:description" content={head.description} />
	<meta name="twitter:image" content={head.image} />
	<meta name="twitter:image:alt" content={head.imageAlt} />
	<!-- JSON is escaped in jsonLdScript; it is not user content. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html structuredData}
</svelte:head>
