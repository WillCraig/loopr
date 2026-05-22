<script lang="ts">
	import type { Units } from '$lib/gpx';

	interface Props {
		units: Units;
		onChange: (u: Units) => void;
	}
	let { units, onChange }: Props = $props();
</script>

<div class="units-toggle" role="radiogroup" aria-label="Units">
	<button
		type="button"
		data-on={units === 'mi' ? '1' : '0'}
		onclick={() => onChange('mi')}
		role="radio"
		aria-checked={units === 'mi'}>mi</button
	>
	<button
		type="button"
		data-on={units === 'km' ? '1' : '0'}
		onclick={() => onChange('km')}
		role="radio"
		aria-checked={units === 'km'}>km</button
	>
</div>
