import { haversine, samePoint } from './geo';
import type { Gpx, Track, TrackPoint, Waypoint } from './types';

/** A start→end gap below this is always treated as a closed loop (GPS noise). */
export const P2P_MIN_GAP_M = 100;
/** …and the gap must also exceed this fraction of the track's length, so long
 *  routes that end a street or two from home still count as loops. */
export const P2P_GAP_FRACTION = 0.02;

/** Great-circle distance in meters between a track's first and last point. */
export function startEndGapMeters(track: Track): number {
	const pts = track.points;
	if (pts.length < 2) return 0;
	const a = pts[0];
	const b = pts[pts.length - 1];
	return haversine(a.lat, a.lon, b.lat, b.lon);
}

/** True when the track ends far enough from its start to be a one-way (A-B)
 *  route rather than a closed loop. Lollipops end at their start, so they
 *  classify as loops. */
export function isPointToPoint(track: Track): boolean {
	const gap = startEndGapMeters(track);
	const threshold = Math.max(P2P_MIN_GAP_M, P2P_GAP_FRACTION * trackLengthMeters(track));
	return gap > threshold;
}

/** True when any track in the file is point-to-point. */
export function gpxIsPointToPoint(gpx: Gpx): boolean {
	return gpx.tracks.some(isPointToPoint);
}

export interface OutAndBackOptions {
	/** Add a "Turnaround" waypoint at B for each converted track. */
	turnaround?: boolean;
}

/**
 * Convert every point-to-point track into an out-and-back (A-B-A) by appending
 * the reversed track, deduping the shared point at B. (m points → 2m−1.)
 * Loop tracks pass through untouched. Pure: never mutates the input.
 */
export function outAndBack(gpx: Gpx, opts: OutAndBackOptions = {}): Gpx {
	const turnWaypoints: Waypoint[] = [];
	const tracks: Track[] = gpx.tracks.map((track) => {
		if (!isPointToPoint(track)) return { ...track, points: track.points.slice() };
		if (opts.turnaround) turnWaypoints.push(turnaroundWaypoint(track));
		return { ...track, points: mirrorPoints(track.points) };
	});
	return {
		tracks,
		waypoints: [...gpx.waypoints, ...turnWaypoints],
		routes: gpx.routes.map((r) => ({ rawXml: r.rawXml })),
		metadata: gpx.metadata ? { ...gpx.metadata } : undefined
	};
}

function mirrorPoints(pts: TrackPoint[]): TrackPoint[] {
	const reversed = pts.slice().reverse();
	const out = pts.slice();
	const start = reversed.length > 0 && samePoint(out[out.length - 1], reversed[0]) ? 1 : 0;
	for (let i = start; i < reversed.length; i++) out.push(reversed[i]);
	return out;
}

function turnaroundWaypoint(track: Track): Waypoint {
	const b = track.points[track.points.length - 1];
	const wpt: Waypoint = { lat: b.lat, lon: b.lon, name: 'Turnaround', type: 'Turnaround' };
	if (b.ele !== undefined) wpt.ele = b.ele;
	return wpt;
}

function trackLengthMeters(track: Track): number {
	const pts = track.points;
	let total = 0;
	for (let i = 1; i < pts.length; i++) {
		total += haversine(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
	}
	return total;
}
