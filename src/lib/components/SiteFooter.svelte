<script lang="ts">
	import { currentAnalytics } from '$lib/public-config';

	const year = new Date().getFullYear();
	const analytics = currentAnalytics();
</script>

<footer class="site-footer container">
	<div class="left">
		<span>© {year} willc software house</span>
		<span>MIT licensed</span>
		<span>{analytics ? 'Cookieless page counts. No cookies.' : 'No analytics. No cookies.'}</span>
	</div>
	<div class="right">
		<a href="https://willc.pro" target="_blank" rel="noreferrer noopener">willc.pro</a>
		<a href="https://github.com/WillCraig/loopr" target="_blank" rel="noreferrer noopener"
			>source ↗</a
		>
	</div>
</footer>
