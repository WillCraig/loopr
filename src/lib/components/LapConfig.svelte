<script lang="ts">
	import { fmtDistance, distUnit, distToMeters } from '$lib/format';
	import type { Units } from '$lib/gpx';
	import ErrorBlock from './ErrorBlock.svelte';

	export type Mode = 'laps' | 'distance';

	interface Props {
		mode: Mode;
		laps: number;
		minDistance: number;
		units: Units;
		/** True when the loaded route is being ridden out-and-back (A-B-A). */
		outAndBack?: boolean;
		/** Lap distance in meters, when a route is loaded. */
		lapDistanceMeters: number | null;
		/** Commute one-way distance in meters, when a commute is active. */
		commuteDistanceMeters: number | null;
		minDistInclCommute: boolean;
		addMarkers: boolean;
		customName: string;
		nameSuggestion: string;
		renameOpen: boolean;
		onMode: (m: Mode) => void;
		onLaps: (n: number) => void;
		onMinDistance: (v: number) => void;
		onMinDistInclCommute: (v: boolean) => void;
		onAddMarkers: (v: boolean) => void;
		onCustomName: (v: string) => void;
		onRenameOpen: (v: boolean) => void;
	}
	let {
		mode,
		laps,
		minDistance,
		units,
		outAndBack = false,
		lapDistanceMeters,
		commuteDistanceMeters,
		minDistInclCommute,
		addMarkers,
		customName,
		nameSuggestion,
		renameOpen,
		onMode,
		onLaps,
		onMinDistance,
		onMinDistInclCommute,
		onAddMarkers,
		onCustomName,
		onRenameOpen
	}: Props = $props();

	const computedLaps = $derived.by(() => {
		if (mode !== 'distance' || !lapDistanceMeters || lapDistanceMeters <= 0) return null;
		let targetMeters = distToMeters(minDistance, units);
		if (minDistInclCommute && commuteDistanceMeters) {
			targetMeters = Math.max(0, targetMeters - 2 * commuteDistanceMeters);
		}
		return Math.max(1, Math.ceil(targetMeters / lapDistanceMeters));
	});

	const totalMeters = $derived.by(() => {
		if (!lapDistanceMeters) return null;
		const n = mode === 'distance' ? (computedLaps ?? 1) : laps;
		const loopMeters = lapDistanceMeters * n;
		if (mode === 'distance' && minDistInclCommute && commuteDistanceMeters) {
			return loopMeters + 2 * commuteDistanceMeters;
		}
		return loopMeters;
	});

	const overCap = $derived(computedLaps !== null && computedLaps > 100);

	function clampLaps(raw: string): number {
		const n = Number.parseInt(raw || '1', 10);
		if (!Number.isFinite(n)) return 1;
		return Math.max(1, Math.min(100, n));
	}

	function clampDistance(raw: string): number {
		const n = Number.parseFloat(raw || '1');
		if (!Number.isFinite(n) || n <= 0) return 1;
		return n;
	}
</script>

<div>
	<div class="lap-mode lap-mode--seg" role="radiogroup" aria-label="Lap configuration mode">
		<button
			type="button"
			data-on={mode === 'laps' ? '1' : '0'}
			role="radio"
			aria-checked={mode === 'laps'}
			onclick={() => onMode('laps')}>Number of laps</button
		>
		<button
			type="button"
			data-on={mode === 'distance' ? '1' : '0'}
			role="radio"
			aria-checked={mode === 'distance'}
			onclick={() => onMode('distance')}>Minimum distance</button
		>
	</div>

	<div class="config-body">
		{#if mode === 'laps'}
			<div>
				<div class="bignum-input">
					<label class="sr-only" for="laps-input">Number of laps</label>
					<input
						id="laps-input"
						type="number"
						min="1"
						max="100"
						value={laps}
						data-testid="laps-input"
						oninput={(e) => onLaps(clampLaps((e.currentTarget as HTMLInputElement).value))}
					/>
					<span class="bignum-suffix"
						>{outAndBack
							? laps === 1
								? 'out & back'
								: 'out & backs'
							: laps === 1
								? 'lap'
								: 'laps'}</span
					>
					<div class="stepper">
						<button
							type="button"
							aria-label="Fewer laps"
							disabled={laps <= 1}
							onclick={() => onLaps(Math.max(1, laps - 1))}>−</button
						>
						<button
							type="button"
							aria-label="More laps"
							disabled={laps >= 100}
							onclick={() => onLaps(Math.min(100, laps + 1))}>+</button
						>
					</div>
				</div>
				{#if totalMeters != null}
					<div class="live-compute" data-testid="laps-total">
						<span class="arrow">→</span>
						<strong>{fmtDistance(totalMeters, units)} {distUnit(units)}</strong>
						<span>total ride</span>
					</div>
				{/if}
			</div>
		{:else}
			<div>
				{#if commuteDistanceMeters !== null}
					<div
						class="distance-scope"
						role="radiogroup"
						aria-label="What the distance target includes"
					>
						<label class="scope-option">
							<input
								type="radio"
								name="dist-scope"
								checked={!minDistInclCommute}
								onchange={() => onMinDistInclCommute(false)}
							/>
							Loop only <span class="scope-help">(commute added on top)</span>
						</label>
						<label class="scope-option">
							<input
								type="radio"
								name="dist-scope"
								checked={minDistInclCommute}
								onchange={() => onMinDistInclCommute(true)}
							/>
							Total ride <span class="scope-help">(commute counts toward the target)</span>
						</label>
					</div>
				{/if}
				<div class="bignum-input">
					<label class="sr-only" for="min-distance-input">Target minimum distance</label>
					<input
						id="min-distance-input"
						type="number"
						min="1"
						value={minDistance}
						data-testid="min-distance-input"
						oninput={(e) =>
							onMinDistance(clampDistance((e.currentTarget as HTMLInputElement).value))}
					/>
					<span class="bignum-suffix">{distUnit(units)} minimum</span>
				</div>
				{#if computedLaps !== null && totalMeters != null}
					<div class="live-compute" data-testid="distance-hint">
						<span class="arrow">→</span>
						<strong>{computedLaps} {computedLaps === 1 ? 'lap' : 'laps'}</strong>
						<span>·</span>
						<strong>{fmtDistance(totalMeters, units)} {distUnit(units)}</strong>
						<span>total</span>
					</div>
				{/if}
			</div>
		{/if}

		{#if overCap}
			<ErrorBlock
				title="That's more than 100 laps"
				detail="loopr caps rides at 100 laps to keep the file safe for bike computers. Try a longer loop or a smaller target distance."
			/>
		{/if}

		<label class="check">
			<input
				type="checkbox"
				checked={addMarkers}
				data-testid="markers-checkbox"
				onchange={(e) => onAddMarkers((e.currentTarget as HTMLInputElement).checked)}
			/>
			<span class="box"></span>
			<span class="check-body">
				<span class="check-label"
					>{outAndBack
						? 'Add markers at the turnaround and each lap start'
						: 'Add a marker at the start of each lap'}</span
				>
				<span class="check-help"
					>Your bike computer can show these so you know which lap you're on.</span
				>
			</span>
		</label>

		<div class="rename">
			<button
				type="button"
				class="rename-toggle"
				aria-expanded={renameOpen}
				onclick={() => onRenameOpen(!renameOpen)}
			>
				<span class="chev">▸</span>
				Rename this route (optional)
			</button>
			{#if renameOpen}
				<input
					class="rename-input"
					value={customName}
					placeholder={nameSuggestion}
					data-testid="rename-input"
					oninput={(e) => onCustomName((e.currentTarget as HTMLInputElement).value)}
				/>
			{/if}
		</div>
	</div>
</div>
