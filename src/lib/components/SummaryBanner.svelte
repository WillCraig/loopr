<script lang="ts">
	import { fmtDistance, fmtElev, distUnit, elevUnit } from '$lib/format';
	import type { Units } from '$lib/gpx';

	/** The denormalised numbers the SummaryBanner needs. Everything is already
	 *  in meters / raw percent so the component owns the unit-conversion calls. */
	export interface SummaryView {
		name: string;
		laps: number;
		/** True when each lap is an out-and-back (A-B-A) conversion. */
		outAndBack?: boolean;
		lapDistanceMeters: number;
		lapGainMeters: number;
		lapLossMeters: number;
		maxGradientPct: number;
		commute?: {
			distanceMeters: number;
			gainMeters: number;
			lossMeters: number;
		};
	}

	interface Props {
		view: SummaryView | null;
		units: Units;
	}
	let { view, units }: Props = $props();
</script>

{#if !view}
	<div class="summary-empty">Drop a route above to see your ride</div>
{:else}
	{@const c = view.commute}
	{@const totalDistanceMeters = view.lapDistanceMeters * view.laps + (c ? 2 * c.distanceMeters : 0)}
	{@const totalGainMeters = view.lapGainMeters * view.laps + (c ? c.gainMeters + c.lossMeters : 0)}
	{@const totalLossMeters = view.lapLossMeters * view.laps + (c ? c.gainMeters + c.lossMeters : 0)}
	<div class="summary" data-testid="summary">
		<div class="summary-label">Your ride</div>
		<div class="summary-name" data-testid="summary-name">
			{view.name}
			{#if view.outAndBack}
				<span class="summary-oab-chip" data-testid="summary-oab-chip">Out &amp; back</span>
			{/if}
		</div>
		{#if c}
			<div class="summary-commute" data-testid="summary-commute">
				+ {fmtDistance(c.distanceMeters, units)}
				{distUnit(units)} commute each way
			</div>
		{/if}
		<div class="summary-grid">
			<div class="stat">
				<span class="stat-label">Total distance</span>
				<span class="stat-value" data-testid="summary-total">
					{fmtDistance(totalDistanceMeters, units)}
					<span class="stat-unit">{distUnit(units)}</span>
				</span>
				<span class="stat-sub"
					>{fmtDistance(view.lapDistanceMeters, units)} {distUnit(units)} / lap</span
				>
			</div>
			<div class="stat">
				<span class="stat-label">Elevation gain</span>
				<span class="stat-value">
					{fmtElev(totalGainMeters, units)}
					<span class="stat-unit">{elevUnit(units)}</span>
				</span>
				<span class="stat-sub">{fmtElev(view.lapGainMeters, units)} {elevUnit(units)} / lap</span>
			</div>
			<div class="stat">
				<span class="stat-label">Elevation loss</span>
				<span class="stat-value">
					{fmtElev(totalLossMeters, units)}
					<span class="stat-unit">{elevUnit(units)}</span>
				</span>
				<span class="stat-sub">{fmtElev(view.lapLossMeters, units)} {elevUnit(units)} / lap</span>
			</div>
			<div class="stat">
				<span class="stat-label">Max grade</span>
				<span class="stat-value">
					{view.maxGradientPct.toFixed(1)}
					<span class="stat-unit">%</span>
				</span>
				<span class="stat-sub">per loop</span>
			</div>
			<div class="stat">
				<span class="stat-label">Laps</span>
				<span class="stat-value" data-testid="summary-laps">{view.laps}</span>
				<span class="stat-sub"
					>{view.laps === 1
						? view.outAndBack
							? 'there and back'
							: 'single loop'
						: 'repetitions'}</span
				>
			</div>
		</div>
	</div>
{/if}
