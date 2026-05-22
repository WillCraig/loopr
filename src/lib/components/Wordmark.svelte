<script lang="ts">
	/**
	 * Lowercase "loopr" with the two o's drawn as a continuous chain-link loop.
	 * Faithfully reproduces the design bundle's `Wordmark` component.
	 */
	interface Props {
		size?: number;
		color?: string;
	}
	let { size = 30, color = 'currentColor' }: Props = $props();

	const stroke = $derived(size * 0.18);
	const r = $derived(size * 0.42);
	const cy = $derived(size * 0.62);
	const svgWidth = $derived(size * 1.85);
</script>

<div
	class="wordmark"
	style:display="inline-flex"
	style:align-items="center"
	style:gap="{size * 0.06}px"
	style:color
	style:line-height="1"
	aria-label="loopr"
>
	<span
		style:font-family="'Geist', sans-serif"
		style:font-size="{size}px"
		style:font-weight="600"
		style:letter-spacing="-0.04em">l</span
	>
	<svg
		width={svgWidth}
		height={size}
		viewBox="0 0 {svgWidth} {size}"
		style:display="block"
		aria-hidden="true"
	>
		<circle
			cx={r + stroke / 2}
			{cy}
			r={r - stroke / 2}
			fill="none"
			stroke="currentColor"
			stroke-width={stroke}
		/>
		<circle
			cx={r * 2 + size * 0.25 + stroke / 2}
			{cy}
			r={r - stroke / 2}
			fill="none"
			stroke="currentColor"
			stroke-width={stroke}
		/>
	</svg>
	<span
		style:font-family="'Geist', sans-serif"
		style:font-size="{size}px"
		style:font-weight="600"
		style:letter-spacing="-0.04em">pr</span
	>
</div>
