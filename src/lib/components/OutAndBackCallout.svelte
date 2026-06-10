<script lang="ts">
	import { fmtDistance, distUnit } from '$lib/format';
	import type { Units } from '$lib/gpx';

	interface Props {
		/** Distance between the route's start and end. */
		gapMeters: number;
		/** One-way length of the dropped route. */
		oneWayMeters: number;
		units: Units;
		on: boolean;
		onToggle: (on: boolean) => void;
	}
	let { gapMeters, oneWayMeters, units, on, onToggle }: Props = $props();
</script>

<div class="oab" data-testid="oab-callout">
	<div class="oab-head">
		<div class="oab-headings">
			<div class="eyebrow eyebrow-accent">Point-to-point detected</div>
			<h3 class="oab-title">
				This route ends {fmtDistance(gapMeters, units)}
				{distUnit(units)} from where it starts.
			</h3>
			<p class="oab-sub">
				Ride it out and back? loopr retraces the same path in reverse so you finish where you began.
			</p>
		</div>
		<div class="lap-mode lap-mode--seg oab-toggle" role="radiogroup" aria-label="Out and back">
			<button
				type="button"
				data-on={on ? '1' : '0'}
				role="radio"
				aria-checked={on}
				data-testid="oab-on"
				onclick={() => onToggle(true)}>Out &amp; back</button
			>
			<button
				type="button"
				data-on={!on ? '1' : '0'}
				role="radio"
				aria-checked={!on}
				data-testid="oab-off"
				onclick={() => onToggle(false)}>One way</button
			>
		</div>
	</div>

	<svg class="oab-diagram" viewBox="0 0 320 56" aria-hidden="true" data-on={on ? '1' : '0'}>
		<!-- outbound leg -->
		<line class="oab-out" x1="24" y1="20" x2="290" y2="20" />
		<path class="oab-out" d="M283 15.5 L292 20 L283 24.5" fill="none" />
		<!-- return leg (lights up when the toggle is on) -->
		<g class="oab-return">
			<path class="oab-return-line" d="M296 26 Q296 42 280 42 L52 42" fill="none" />
			<path class="oab-return-head" d="M53 37.5 L44 42 L53 46.5" fill="none" />
		</g>
		<circle class="oab-dot-a" cx="20" cy="20" r="4.5" />
		<circle class="oab-dot-b" cx="296" cy="20" r="4.5" />
		<text class="oab-label" x="20" y="9" text-anchor="middle">A</text>
		<text class="oab-label" x="296" y="9" text-anchor="middle">B</text>
	</svg>

	{#if on}
		<div class="live-compute" data-testid="oab-roundtrip">
			<span class="arrow">→</span>
			<strong>{fmtDistance(2 * oneWayMeters, units)} {distUnit(units)}</strong>
			<span>round trip · finishes back at the start</span>
		</div>
	{:else}
		<p class="oab-warn" data-testid="oab-warning">
			Heads up: repeating a one-way route creates a jump from the end back to the start.
		</p>
	{/if}
</div>
