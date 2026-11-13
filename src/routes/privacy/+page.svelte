<script lang="ts">
	import { resolve } from '$app/paths';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
</script>

<svelte:head>
	<title>Privacy — loopr</title>
	<meta
		name="description"
		content="How loopr handles your GPX files and what its cookieless GoatCounter analytics record."
	/>
	<link rel="canonical" href="https://loopr.willcsoftware.com/privacy" />
</svelte:head>

<div class="page">
	<header class="site-header container">
		<Wordmark size={30} />
	</header>

	<main id="main" tabindex="-1">
		<section class="hero container">
			<div class="eyebrow eyebrow-accent">Privacy</div>
			<h1>Your GPX never leaves your <em>browser</em>.</h1>
			<p class="hero-sub">
				loopr is a free tool that repeats a GPX loop into a longer ride. This page explains what
				happens to your files and what the site records about visits.
			</p>
		</section>

		<section class="section container">
			<div class="section-head">
				<span class="section-num">01 — Files</span>
				<h2 class="section-title">Processed only in your browser.</h2>
			</div>
			<div class="section-body">
				<p>
					When you drop a GPX file into loopr, it is read, repeated, and turned into a download
					entirely inside your browser. The file is not uploaded, sent to a server, or stored by
					loopr. Closing or reloading the tab clears it.
				</p>
			</div>
		</section>

		<section class="section container">
			<div class="section-head">
				<span class="section-num">02 — Analytics</span>
				<h2 class="section-title">Aggregate page counts, no cookies.</h2>
			</div>
			<div class="section-body">
				<p>
					loopr uses <a href="https://www.goatcounter.com" rel="noreferrer noopener">GoatCounter</a
					>, a privacy-friendly analytics service, to count visits. It records only aggregate
					counts: the page, referrer, browser, country, and screen size. GoatCounter sets no cookies
					and does not store IP addresses. loopr runs no other analytics, advertising, or tracking
					scripts.
				</p>
				<p>Analytics is not loaded on localhost or other local development hosts.</p>
			</div>
		</section>

		<section class="section container">
			<div class="section-body section-foot">
				<p class="updated">Last updated 13 November 2026.</p>
				<a class="btn-primary" href={resolve('/')}>Back to loopr</a>
			</div>
		</section>
	</main>

	<SiteFooter />
</div>

<style>
	.section-body {
		max-width: 60ch;
		margin-left: 152px;
		font-size: 17px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.section-body p {
		margin: 0 0 16px;
	}
	.section-foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
	}
	.section-foot p {
		margin: 0;
		font-family: 'Geist Mono', ui-monospace, monospace;
		font-size: 12px;
		letter-spacing: 0.05em;
		color: var(--ink-3);
	}
	a.btn-primary {
		text-decoration: none;
	}

	@media (max-width: 680px) {
		.section-body {
			margin-left: 0;
		}
	}
</style>
