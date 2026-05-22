<script lang="ts">
	interface Props {
		enabled: boolean;
		ridename: string;
		disabledReason: string;
		onClick: () => void;
	}
	let { enabled, ridename, disabledReason, onClick }: Props = $props();
</script>

<div class="download">
	<button
		class="btn-primary"
		type="button"
		disabled={!enabled}
		data-testid="download-button"
		onclick={onClick}
	>
		<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
			<path
				d="M9 2v10m0 0l-4-4m4 4l4-4M3 14v1a1 1 0 001 1h10a1 1 0 001-1v-1"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		Download your route
	</button>
	<div class="download-hint">
		{#if enabled}
			<strong>{ridename}</strong> — saved as a .gpx file. Import into Strava, Ride With GPS, Garmin Connect,
			or Wahoo to send to your bike computer.
		{:else}
			{disabledReason}
		{/if}
	</div>
</div>
