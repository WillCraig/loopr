<script lang="ts">
	/**
	 * Lowercase "loopr" with the two o's drawn as an overlapping route loop.
	 * The surrounding type inherits the shared route-workshop font system.
	 */
	interface Props {
		size?: number;
		color?: string;
	}
	let { size = 30, color = 'currentColor' }: Props = $props();

	const stroke = $derived(size * 0.14);
	const r = $derived(size * 0.37);
	const cy = $derived(size * 0.55);
	const firstCx = $derived(r + stroke / 2);
	const secondCx = $derived(firstCx + size * 0.61);
	const svgWidth = $derived(secondCx + r + stroke / 2);
</script>

<div
	class="wordmark"
	style:--wordmark-size="{size}px"
	style:--wordmark-gap="{size * 0.055}px"
	style:color
	aria-label="loopr"
>
	<span class="wordmark-letter wordmark-l">l</span>
	<svg
		class="wordmark-loops"
		width={svgWidth}
		height={size}
		viewBox="0 0 {svgWidth} {size}"
		aria-hidden="true"
	>
		<circle
			cx={firstCx}
			{cy}
			r={r - stroke / 2}
			fill="none"
			stroke="currentColor"
			stroke-width={stroke}
		/>
		<circle
			cx={secondCx}
			{cy}
			r={r - stroke / 2}
			fill="none"
			stroke="currentColor"
			stroke-width={stroke}
		/>
	</svg>
	<span class="wordmark-letter wordmark-pr">pr</span>
</div>
