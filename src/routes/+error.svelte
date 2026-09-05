<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';

	const is404 = $derived(page.status === 404);
	const heading = $derived(is404 ? 'That route is off the map.' : 'Unexpected roadblock.');
	const detail = $derived(
		is404
			? 'The page you are looking for does not exist or has moved. Head back to the loop builder and drop a route.'
			: 'Something went wrong while loading this page. Head back to the loop builder and try again.'
	);
</script>

<svelte:head>
	<title>{page.status} — loopr</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
	<header class="site-header container">
		<Wordmark size={30} />
	</header>

	<section class="hero container">
		<div class="eyebrow eyebrow-accent">Error {page.status}</div>
		<h1>{heading}</h1>
		<p class="hero-sub">{detail}</p>
		<a class="btn-primary" href={resolve('/')}>Back to loopr</a>
	</section>

	<SiteFooter />
</div>

<style>
	a.btn-primary {
		text-decoration: none;
	}
</style>
