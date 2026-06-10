import { LapCapExceededError } from './errors';
import { haversine, samePoint } from './geo';
import type { Gpx, LapMode, RepeatConfig, Track, TrackPoint, Waypoint } from './types';
import { MAX_LAPS } from './types';

/**
 * Repeat every track in `gpx` according to `config`. Pure: returns a fresh
 * `Gpx`, never mutates the input.
 *
 * Each lap dedupes the seam: lap K's first point equals lap K-1's last point,
 * so the second-through-Nth lap reuse the original points array starting at
 * index 1. (m points repeated N times → N·(m−1)+1 output points.)
 *
 * @throws LapCapExceededError when `minDistance` mode would require more than
 *   {@link MAX_LAPS} laps. Count mode is the caller's responsibility — the UI
 *   caps its input at 100 already.
 */
export function repeat(gpx: Gpx, config: RepeatConfig): Gpx {
	const multipleTracks = gpx.tracks.length > 1;
	const newTracks: Track[] = [];
	const lapWaypoints: Waypoint[] = [];
	const commutePoints = config.commute?.tracks[0]?.points ?? null;

	gpx.tracks.forEach((track, idx) => {
		const n = resolveLapCount(track, config.mode);
		const lapPoints = repeatPoints(track.points, n);
		const points = commutePoints ? spliceCommute(lapPoints, commutePoints) : lapPoints;
		const name = trackName(track, n, idx, config, multipleTracks);
		newTracks.push({ name, points });
		if (config.lapWaypoints && n > 1) {
			const seam = track.points[0];
			const prefix = multipleTracks ? `${name} ` : '';
			for (let k = 2; k <= n; k++) {
				const wpt: Waypoint = {
					lat: seam.lat,
					lon: seam.lon,
					name: `${prefix}Lap ${k} start`,
					type: 'Lap'
				};
				if (seam.ele !== undefined) wpt.ele = seam.ele;
				lapWaypoints.push(wpt);
			}
		}
	});

	return {
		tracks: newTracks,
		waypoints: [...gpx.waypoints, ...lapWaypoints],
		routes: gpx.routes.map((r) => ({ rawXml: r.rawXml })),
		metadata: gpx.metadata ? { ...gpx.metadata } : undefined
	};
}

/** Prepend a commute and append its reverse around a lap-points array. Seams
 *  where the commute endpoint coincides with the lap endpoint are deduped so
 *  the output has no zero-length steps. */
function spliceCommute(lapPoints: TrackPoint[], commutePoints: TrackPoint[]): TrackPoint[] {
	if (commutePoints.length === 0) return lapPoints.slice();
	const reversed = commutePoints.slice().reverse();
	const out: TrackPoint[] = commutePoints.slice();
	const lapStart = lapPoints[0];
	const lapStartIdx = out.length > 0 && samePoint(out[out.length - 1], lapStart) ? 1 : 0;
	for (let i = lapStartIdx; i < lapPoints.length; i++) out.push(lapPoints[i]);
	const lapEnd = lapPoints[lapPoints.length - 1];
	const retStartIdx = reversed.length > 0 && samePoint(lapEnd, reversed[0]) ? 1 : 0;
	for (let i = retStartIdx; i < reversed.length; i++) out.push(reversed[i]);
	return out;
}

function resolveLapCount(track: Track, mode: LapMode): number {
	if (mode.type === 'count') {
		return Math.max(1, mode.n);
	}
	const lapDistance = lapDistanceMeters(track);
	if (lapDistance <= 0) return 1;
	const n = Math.max(1, Math.ceil(mode.targetMeters / lapDistance));
	if (n > MAX_LAPS) {
		throw new LapCapExceededError(n, MAX_LAPS);
	}
	return n;
}

function repeatPoints(points: Track['points'], n: number) {
	if (n <= 1) return points.slice();
	const out = points.slice();
	const tail = points.slice(1);
	for (let k = 2; k <= n; k++) {
		out.push(...tail);
	}
	return out;
}

function trackName(
	track: Track,
	n: number,
	idx: number,
	config: RepeatConfig,
	multipleTracks: boolean
): string {
	if (config.nameOverride && config.nameOverride.length > 0) {
		return multipleTracks ? `${config.nameOverride} (${idx + 1})` : config.nameOverride;
	}
	const base = track.name && track.name.length > 0 ? track.name : 'Repeated route';
	return `${base} x${n}`;
}

function lapDistanceMeters(track: Track): number {
	const pts = track.points;
	let total = 0;
	for (let i = 1; i < pts.length; i++) {
		total += haversine(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
	}
	return total;
}
