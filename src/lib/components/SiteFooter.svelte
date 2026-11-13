<script lang="ts">
	import { resolve } from '$app/paths';

	const year = new Date().getFullYear();
</script>

<footer class="site-footer container">
	<div class="left">
		<span>© {year} willc software house</span>
		<span>MIT licensed</span>
		<span>Cookieless analytics. No cookies.</span>
	</div>
	<div class="right">
		<a href={resolve('/privacy')}>privacy</a>
		<a href="https://willc.pro" target="_blank" rel="noreferrer noopener">willc.pro</a>
		<a href="https://github.com/WillCraig/loopr" target="_blank" rel="noreferrer noopener"
			>source ↗</a
		>
	</div>
</footer>
