<script lang="ts">
	import { version as pkgVersion } from '$app/environment';
	import {
		GpxParseError,
		LapCapExceededError,
		NoTrackError,
		TooFewPointsError,
		computeSummary,
		parseGpx,
		repeat,
		serializeGpx
	} from '$lib/gpx';
	import type { Gpx, Units } from '$lib/gpx';
	import { distToMeters, safeFilename } from '$lib/format';
	import { SAMPLE_FILENAME, sampleGpxText } from '$lib/sample';

	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import DropZone from '$lib/components/DropZone.svelte';
	import type { DropError, DropState, LoadedSummary } from '$lib/components/DropZone.svelte';
	// import HowToUse from '$lib/components/HowToUse.svelte'; // re-add when the commented-out section below is restored
	import LapConfig from '$lib/components/LapConfig.svelte';
	import type { Mode } from '$lib/components/LapConfig.svelte';
	import PrivacyCallout from '$lib/components/PrivacyCallout.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import SummaryBanner from '$lib/components/SummaryBanner.svelte';
	import type { SummaryView } from '$lib/components/SummaryBanner.svelte';
	import UnitsToggle from '$lib/components/UnitsToggle.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';

	// ── Top-level state ──────────────────────────────────────────────────────
	let parsed = $state<Gpx | null>(null);
	let filename = $state('');
	let error = $state<DropError | null>(null);
	let loading = $state(false);

	let mode = $state<Mode>('laps');
	let laps = $state(2);
	let minDistance = $state(50);
	let units = $state<Units>('mi');
	let addMarkers = $state(true);
	let customName = $state('');
	let renameOpen = $state(false);
	let minDistInclCommute = $state(false);

	let commuteEnabled = $state(false);
	let commuteParsed = $state<Gpx | null>(null);
	let commuteFilename = $state('');
	let commuteError = $state<DropError | null>(null);
	let commuteLoading = $state(false);

	const activeCommute = $derived(commuteEnabled ? commuteParsed : null);

	// ── Derived state ────────────────────────────────────────────────────────
	const trackSummary = $derived(parsed ? (computeSummary(parsed, units).tracks[0] ?? null) : null);
	const lapDistanceMeters = $derived.by(() => {
		if (!parsed) return null;
		const s = computeSummary(parsed, 'km').tracks[0];
		if (!s) return null;
		// distancePerLap is in km when units=km → convert back to meters.
		return s.distancePerLap * 1000;
	});

	const computedLaps = $derived.by(() => {
		if (mode !== 'distance' || !lapDistanceMeters || lapDistanceMeters <= 0) return null;
		let targetMeters = distToMeters(minDistance, units);
		if (minDistInclCommute && commuteDistanceMeters) {
			targetMeters = Math.max(0, targetMeters - 2 * commuteDistanceMeters);
		}
		return Math.max(1, Math.ceil(targetMeters / lapDistanceMeters));
	});

	const effectiveLaps = $derived(mode === 'distance' ? (computedLaps ?? 1) : laps);
	const overCap = $derived(effectiveLaps > 100);

	const sourceTrackName = $derived(parsed?.tracks[0]?.name ?? 'Repeated route');
	const defaultRidename = $derived(`${sourceTrackName} x${effectiveLaps}`);
	const ridename = $derived(customName.trim() || defaultRidename);

	const dropState: DropState = $derived(
		loading ? 'loading' : error ? 'error' : parsed ? 'loaded' : 'empty'
	);

	const commuteDropState: DropState = $derived(
		commuteLoading ? 'loading' : commuteError ? 'error' : commuteParsed ? 'loaded' : 'empty'
	);

	const loadedSummary: LoadedSummary | null = $derived.by(() => {
		if (!parsed || !lapDistanceMeters) return null;
		const km = computeSummary(parsed, 'km').tracks[0];
		if (!km) return null;
		return {
			filename,
			distanceMeters: lapDistanceMeters,
			gainMeters: km.elevationGain,
			pointCount: parsed.tracks.reduce((sum, t) => sum + t.points.length, 0)
		};
	});

	const commuteLoaded: LoadedSummary | null = $derived.by(() => {
		if (!commuteParsed) return null;
		const commuteSummary = computeSummary(commuteParsed, 'km');
		const t = commuteSummary.tracks[0];
		if (!t) return null;
		return {
			filename: commuteFilename,
			distanceMeters: t.totalDistance * 1000,
			gainMeters: t.elevationGain,
			pointCount: commuteParsed.tracks.reduce((sum, tr) => sum + tr.points.length, 0)
		};
	});

	const commuteDistanceMeters = $derived(
		commuteEnabled && commuteLoaded ? commuteLoaded.distanceMeters : null
	);

	const summaryView: SummaryView | null = $derived.by(() => {
		if (!parsed || !trackSummary) return null;
		const summary = computeSummary(parsed, 'km', activeCommute ?? undefined);
		const km = summary.tracks[0];
		if (!km) return null;
		return {
			name: ridename,
			laps: effectiveLaps,
			lapDistanceMeters: km.distancePerLap * 1000,
			lapGainMeters: km.elevationGain,
			lapLossMeters: km.elevationLoss,
			maxGradientPct: km.maxGradientPct,
			commute: summary.commute
				? {
						distanceMeters: summary.commute.distance * 1000,
						gainMeters: summary.commute.elevationGain,
						lossMeters: summary.commute.elevationLoss
					}
				: undefined
		};
	});

	let downloadEnabled = $state(false);
	let disabledReason = $state('Drop a route above to enable download.');
	$effect(() => {
		if (!parsed) {
			downloadEnabled = false;
			disabledReason = 'Drop a route above to enable download.';
		} else if (overCap) {
			downloadEnabled = false;
			disabledReason = 'Too many laps. Lower the target or pick a longer loop.';
		} else {
			downloadEnabled = true;
			disabledReason = '';
		}
	});

	// ── File handling ────────────────────────────────────────────────────────
	const MAX_FILE_BYTES = 25 * 1024 * 1024;

	type ParseResult = { gpx: Gpx; name: string } | { error: DropError };

	async function parseOne(file: File): Promise<ParseResult> {
		const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
		if (ext !== 'gpx') {
			return {
				error: {
					title: `That looks like a .${ext || '?'} file`,
					detail:
						'loopr only handles .gpx files. If you have a .fit or .tcx, export it as GPX from Strava, Ride With GPS or Garmin Connect first.'
				}
			};
		}
		if (file.size > MAX_FILE_BYTES) {
			return {
				error: {
					title: 'That file is unusually large',
					detail: 'Most route GPX files are well under 5 MB.'
				}
			};
		}
		const [text] = await Promise.all([file.text(), new Promise((r) => setTimeout(r, 200))]);
		try {
			return { gpx: parseGpx(text), name: file.name };
		} catch (e) {
			return { error: errorFor(e, file.name) };
		}
	}

	function errorFor(e: unknown, name: string): DropError {
		if (e instanceof NoTrackError) {
			return {
				title: 'No track inside that GPX',
				detail:
					'This file has routes or waypoints but no <trk> with points. loopr needs an actual recorded or planned track.'
			};
		}
		if (e instanceof TooFewPointsError) {
			return {
				title: 'Not enough track points',
				detail: `This track has ${e.pointCount} point${
					e.pointCount === 1 ? '' : 's'
				}. loopr needs at least 2 to compute distance.`
			};
		}
		if (e instanceof GpxParseError) {
			return {
				title: "This file doesn't look like valid GPX",
				detail: 'Try re-exporting from your route planner.'
			};
		}
		return {
			title: 'Something went wrong',
			detail: `We could not read ${name || 'that file'}. Try a different .gpx.`
		};
	}

	async function handleFile(file: File) {
		error = null;
		loading = true;
		parsed = null;
		filename = '';
		const result = await parseOne(file);
		loading = false;
		if ('error' in result) {
			error = result.error;
			return;
		}
		parsed = result.gpx;
		filename = result.name;
	}

	async function handleSample() {
		error = null;
		loading = true;
		parsed = null;
		filename = '';
		await new Promise((r) => setTimeout(r, 300));
		try {
			parsed = parseGpx(sampleGpxText());
			filename = SAMPLE_FILENAME;
		} catch (e) {
			error = errorFor(e, SAMPLE_FILENAME);
		} finally {
			loading = false;
		}
	}

	function handleClear() {
		parsed = null;
		filename = '';
		error = null;
		customName = '';
		renameOpen = false;
	}

	async function handleCommuteFile(file: File) {
		commuteError = null;
		commuteLoading = true;
		commuteParsed = null;
		commuteFilename = '';
		const result = await parseOne(file);
		commuteLoading = false;
		if ('error' in result) {
			commuteError = result.error;
			return;
		}
		commuteParsed = result.gpx;
		commuteFilename = result.name;
	}

	function handleCommuteClear() {
		commuteParsed = null;
		commuteFilename = '';
		commuteError = null;
	}

	// ── Download ────────────────────────────────────────────────────────────
	function handleDownload() {
		if (!parsed || !downloadEnabled) return;
		try {
			const repeated = repeat(parsed, {
				mode:
					mode === 'distance'
						? { type: 'count', n: effectiveLaps }
						: { type: 'count', n: laps },
				lapWaypoints: addMarkers,
				nameOverride: customName.trim() || undefined,
				commute: activeCommute ?? undefined
			});
			const xml = serializeGpx(repeated, pkgVersion);
			const stem = filename.replace(/\.gpx$/i, '');
			const suffix = activeCommute ? `-x${effectiveLaps}-with-commute` : `-x${effectiveLaps}`;
			const outName = `${safeFilename(`${stem}${suffix}`)}.gpx`;
			const blob = new Blob([xml], { type: 'application/gpx+xml' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = outName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (e) {
			if (e instanceof LapCapExceededError) {
				error = {
					title: 'That would need more than 100 laps',
					detail: 'Try a longer base loop or a smaller target distance.'
				};
			} else {
				error = {
					title: 'Could not build the route',
					detail: 'Something went wrong while stitching the laps together.'
				};
			}
		}
	}
</script>

<div class="page">
	<header class="site-header container">
		<Wordmark size={30} />
		<UnitsToggle {units} onChange={(u) => (units = u)} />
	</header>

	<section class="hero container">
		<PrivacyCallout placement="above" />
		<div class="eyebrow eyebrow-accent">A free tool for cyclists</div>
		<h1>Repeat any loop into a <em>longer ride</em>.</h1>
		<p class="hero-sub">
			Drop a GPX of one loop, choose how many times to ride it, download a new GPX you can import
			into Strava, Ride With GPS, Garmin Connect, or Wahoo.
		</p>
	</section>

	<section class="section container">
		<div class="section-head">
			<span class="section-num">01 — Route</span>
			<h2 class="section-title">Drop the loop you want to repeat.</h2>
		</div>
		<DropZone
			{dropState}
			{units}
			loaded={loadedSummary}
			{error}
			onFile={handleFile}
			onSample={handleSample}
			onClear={handleClear}
		/>
	</section>

	<section class="section container">
		<div class="section-head">
			<span class="section-num">01b — Commute</span>
			<h2 class="section-title">Riding to the loop? (optional)</h2>
		</div>
		<div class="commute-disclosure">
			<button
				type="button"
				class="rename-toggle"
				aria-expanded={commuteEnabled}
				data-testid="commute-toggle"
				onclick={() => (commuteEnabled = !commuteEnabled)}
			>
				<span class="chev">▸</span>
				Add a commute to/from the loop
			</button>
			{#if commuteEnabled}
				<DropZone
					dropState={commuteDropState}
					{units}
					loaded={commuteLoaded}
					error={commuteError}
					showSample={false}
					onFile={handleCommuteFile}
					onClear={handleCommuteClear}
				/>
				<p class="commute-hint">Used for the ride out; reversed for the ride home.</p>
			{/if}
		</div>
	</section>

	<section class="section container">
		<div class="section-head">
			<span class="section-num">02 — Laps</span>
			<h2 class="section-title">How long do you want to ride?</h2>
		</div>
		<LapConfig
			{mode}
			{laps}
			{minDistance}
			{units}
			{lapDistanceMeters}
			{commuteDistanceMeters}
			{minDistInclCommute}
			{addMarkers}
			{customName}
			nameSuggestion={defaultRidename}
			{renameOpen}
			onMode={(m) => (mode = m)}
			onLaps={(n) => (laps = n)}
			onMinDistance={(v) => (minDistance = v)}
			onMinDistInclCommute={(v) => (minDistInclCommute = v)}
			onAddMarkers={(v) => (addMarkers = v)}
			onCustomName={(v) => (customName = v)}
			onRenameOpen={(v) => (renameOpen = v)}
		/>
	</section>

	<section class="section container">
		<div class="section-head">
			<span class="section-num">03 — Review</span>
			<h2 class="section-title">What you'll actually ride.</h2>
		</div>
		<SummaryBanner view={summaryView} {units} />
	</section>

	<section class="section container">
		<div class="section-head">
			<span class="section-num">04 — Save</span>
			<h2 class="section-title">Take it with you.</h2>
		</div>
		<DownloadButton
			enabled={downloadEnabled}
			{ridename}
			{disabledReason}
			onClick={handleDownload}
		/>
	</section>

	<!--   TODO: consider placing this back in  -->
	<!-- <section class="section container"> -->
	<!-- 	<div class="section-head"> -->
	<!-- 		<span class="section-num">How to use this</span> -->
	<!-- 		<h2 class="section-title">Get the file onto your bike.</h2> -->
	<!-- 	</div> -->
	<!-- 	<HowToUse /> -->
	<!-- </section> -->

	<SiteFooter />
</div>
