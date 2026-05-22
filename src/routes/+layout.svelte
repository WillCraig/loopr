<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>loopr — repeat any loop into a longer ride</title>
</svelte:head>

{@render children()}
