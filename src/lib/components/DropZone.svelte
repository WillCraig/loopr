<script lang="ts">
	import { fmtDistance, fmtElev, distUnit, elevUnit } from '$lib/format';
	import type { Units } from '$lib/gpx';
	import ErrorBlock from './ErrorBlock.svelte';

	export type DropState = 'empty' | 'loading' | 'loaded' | 'error';

	/** A summary of the currently-loaded route, used for the loaded-state row. */
	export interface LoadedSummary {
		filename: string;
		distanceMeters: number;
		gainMeters: number;
		pointCount: number;
	}

	export interface DropError {
		title: string;
		detail: string;
	}

	interface Props {
		dropState: DropState;
		units: Units;
		loaded?: LoadedSummary | null;
		error?: DropError | null;
		showSample?: boolean;
		onFile: (file: File) => void;
		onSample?: () => void;
		onClear: () => void;
	}
	let {
		dropState,
		units,
		loaded = null,
		error = null,
		showSample = true,
		onFile,
		onSample,
		onClear
	}: Props = $props();

	let dragging: boolean = $state(false);
	let inputEl: HTMLInputElement | undefined = $state();

	function pickFiles(list: FileList | null | undefined) {
		if (!list || list.length === 0) return;
		onFile(list[0]);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		pickFiles(event.dataTransfer?.files);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			inputEl?.click();
		}
	}
</script>

{#if dropState === 'loaded' && loaded}
	<div class="dropzone is-loaded" data-testid="dropzone">
		<div class="dz-loaded-row">
			<div class="dz-loaded-file">
				<div class="dz-file-icon">GPX</div>
				<div style="min-width: 0">
					<div class="dz-filename" data-testid="loaded-filename">{loaded.filename}</div>
					<div class="dz-fileinfo">
						{fmtDistance(loaded.distanceMeters, units)}
						{distUnit(units)}
						·
						{fmtElev(loaded.gainMeters, units)}
						{elevUnit(units)} gain ·
						{loaded.pointCount.toLocaleString()} pts
					</div>
				</div>
			</div>
			<button class="dz-clear" type="button" onclick={onClear}>Replace ↻</button>
		</div>
	</div>
{:else}
	<div>
		<div
			class="dropzone {dragging ? 'is-dragging' : ''} {dropState === 'error' ? 'is-error' : ''}"
			tabindex="0"
			role="button"
			aria-label="Drop your GPX file here, or click to choose"
			data-testid="dropzone"
			onclick={() => inputEl?.click()}
			onkeydown={onKeyDown}
			ondragover={(e) => {
				e.preventDefault();
				dragging = true;
			}}
			ondragleave={() => {
				dragging = false;
			}}
			ondrop={onDrop}
		>
			<svg class="dz-icon" viewBox="0 0 44 44" fill="none" aria-hidden="true">
				<path
					d="M22 6v22m0 0l-8-8m8 8l8-8"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M6 32v4a2 2 0 002 2h28a2 2 0 002-2v-4"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
				/>
			</svg>
			<h3 class="dz-title">
				{#if dragging}
					Drop it
				{:else if dropState === 'loading'}
					Reading file…
				{:else}
					Drop your route here
				{/if}
			</h3>
			<p class="dz-sub">
				{#if dragging}
					&nbsp;
				{:else if dropState === 'loading'}
					This should be near instant.
				{:else}
					or click to choose a file
				{/if}
			</p>
			<div class="dz-formats">
				<span>.gpx</span>
				<span>·</span>
				<span>up to 50,000 points</span>
			</div>
			{#if dropState !== 'loading' && showSample && onSample}
				<button
					class="dz-sample"
					type="button"
					data-testid="sample-button"
					onclick={(e) => {
						e.stopPropagation();
						onSample?.();
					}}
				>
					Try with a sample route →
				</button>
			{/if}
			<input
				bind:this={inputEl}
				type="file"
				accept=".gpx,application/gpx+xml,application/xml,text/xml"
				style="display: none"
				data-testid="file-input"
				onchange={(e) => pickFiles((e.currentTarget as HTMLInputElement).files)}
			/>
		</div>
		{#if dropState === 'loading'}
			<div class="loading-bar" aria-hidden="true"></div>
		{/if}
		{#if dropState === 'error' && error}
			<ErrorBlock title={error.title} detail={error.detail} />
		{/if}
	</div>
{/if}
