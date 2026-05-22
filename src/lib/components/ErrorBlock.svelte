<script lang="ts">
	interface Props {
		title: string;
		detail: string;
	}
	let { title, detail }: Props = $props();
</script>

<div class="err" role="alert">
	<p class="err-title">{title}</p>
	<p class="err-detail">{detail}</p>
</div>
