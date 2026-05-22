import type { CommuteSummary, Gpx, Summary, TrackSummary, Units } from './types';

const EARTH_RADIUS_M = 6371008.8;
const M_PER_MI = 1609.344;
const M_PER_FT = 0.3048;
const GRADIENT_WINDOW_M = 100;

/**
 * Compute a {@link Summary} of `gpx` in the requested display units.
 *
 * The "laps" count is inferred from the track structure: a track produced by
 * {@link repeat} ends with N copies of its seed loop, so we detect repeats by
 * comparing the first point's coordinates against later points. Tracks that
 * don't loop (or weren't repeated) report `laps = 1`.
 *
 * - Distance uses the 2D haversine sum between consecutive points.
 * - Elevation gain/loss sums positive/negative deltas; missing elevation reads
 *   as 0.
 * - Max gradient is the steepest slope across any window of ≥100m. The window
 *   slides forward one point at a time; the trailing partial is ignored.
 */
export function computeSummary(gpx: Gpx, units: Units, commute?: Gpx): Summary {
	const tracks: TrackSummary[] = gpx.tracks.map((t) => summarizeTrack(t, units));
	const laps = tracks.length > 0 ? Math.max(...tracks.map((t) => t.laps)) : 1;
	const commuteSummary = commute ? summarizeCommute(commute, units) : undefined;
	return commuteSummary
		? { units, laps, tracks, commute: commuteSummary }
		: { units, laps, tracks };
}

function summarizeCommute(commute: Gpx, units: Units): CommuteSummary | undefined {
	const pts = commute.tracks[0]?.points;
	if (!pts || pts.length < 2) return undefined;
	let totalMeters = 0;
	let gainMeters = 0;
	let lossMeters = 0;
	for (let i = 1; i < pts.length; i++) {
		totalMeters += haversine(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
		const dEle = (pts[i].ele ?? 0) - (pts[i - 1].ele ?? 0);
		if (dEle > 0) gainMeters += dEle;
		else lossMeters += -dEle;
	}
	return {
		distance: distanceInUnits(totalMeters, units),
		elevationGain: elevationInUnits(gainMeters, units),
		elevationLoss: elevationInUnits(lossMeters, units)
	};
}

function summarizeTrack(
	track: { name?: string; points: { lat: number; lon: number; ele?: number }[] },
	units: Units
): TrackSummary {
	const pts = track.points;
	const laps = detectLaps(pts);
	let totalMeters = 0;
	let gainMeters = 0;
	let lossMeters = 0;

	for (let i = 1; i < pts.length; i++) {
		totalMeters += haversine(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
		const dEle = (pts[i].ele ?? 0) - (pts[i - 1].ele ?? 0);
		if (dEle > 0) gainMeters += dEle;
		else lossMeters += -dEle;
	}

	const maxGradientPct = maxGradient(pts);

	return {
		name: track.name ?? '',
		laps,
		distancePerLap: distanceInUnits(totalMeters / laps, units),
		totalDistance: distanceInUnits(totalMeters, units),
		elevationGain: elevationInUnits(gainMeters, units),
		elevationLoss: elevationInUnits(lossMeters, units),
		maxGradientPct
	};
}

function detectLaps(pts: { lat: number; lon: number }[]): number {
	if (pts.length < 2) return 1;
	const first = pts[0];
	let seams = 0;
	for (let i = 1; i < pts.length; i++) {
		if (pts[i].lat === first.lat && pts[i].lon === first.lon) seams++;
	}
	return seams > 0 ? seams : 1;
}

function maxGradient(pts: { lat: number; lon: number; ele?: number }[]): number {
	let max = 0;
	let i = 0;
	while (i < pts.length - 1) {
		let dist = 0;
		let j = i + 1;
		while (j < pts.length && dist < GRADIENT_WINDOW_M) {
			dist += haversine(pts[j - 1].lat, pts[j - 1].lon, pts[j].lat, pts[j].lon);
			j++;
		}
		if (dist >= GRADIENT_WINDOW_M) {
			const dEle = (pts[j - 1].ele ?? 0) - (pts[i].ele ?? 0);
			const grade = Math.abs(dEle / dist) * 100;
			if (grade > max) max = grade;
		}
		i++;
	}
	return max;
}

function distanceInUnits(meters: number, units: Units): number {
	return units === 'mi' ? meters / M_PER_MI : meters / 1000;
}

function elevationInUnits(meters: number, units: Units): number {
	return units === 'mi' ? meters / M_PER_FT : meters;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}
