import type { Gpx, Track, TrackPoint, Waypoint } from './types';

/**
 * Serialize a {@link Gpx} document to GPX 1.1 XML.
 *
 * The `version` parameter ends up in the root `creator="loopr ${version}"`
 * attribute. It's a free-form string the caller chooses (typically the app
 * version).
 *
 * No `<time>` elements are ever emitted. Tracks are collapsed into a single
 * `<trkseg>`. Routes are written back verbatim using their `rawXml`.
 */
export function serializeGpx(gpx: Gpx, version: string): string {
	const lines: string[] = [];
	lines.push('<?xml version="1.0" encoding="UTF-8"?>');
	lines.push(
		`<gpx version="1.1" creator="loopr ${escapeAttr(version)}" xmlns="http://www.topografix.com/GPX/1/1">`
	);

	if (gpx.metadata?.name) {
		lines.push('  <metadata>');
		lines.push(`    <name>${escapeText(gpx.metadata.name)}</name>`);
		lines.push('  </metadata>');
	}

	for (const wpt of gpx.waypoints) {
		lines.push(serializeWaypoint(wpt));
	}
	for (const trk of gpx.tracks) {
		lines.push(serializeTrack(trk));
	}
	for (const rte of gpx.routes) {
		lines.push(`  ${rte.rawXml.trim()}`);
	}

	lines.push('</gpx>');
	return lines.join('\n');
}

function serializeWaypoint(wpt: Waypoint): string {
	const lat = numAttr(wpt.lat);
	const lon = numAttr(wpt.lon);
	const inner: string[] = [];
	if (wpt.ele !== undefined) inner.push(`    <ele>${numText(wpt.ele)}</ele>`);
	if (wpt.name) inner.push(`    <name>${escapeText(wpt.name)}</name>`);
	if (wpt.type) inner.push(`    <type>${escapeText(wpt.type)}</type>`);
	if (inner.length === 0) {
		return `  <wpt lat="${lat}" lon="${lon}"/>`;
	}
	return [`  <wpt lat="${lat}" lon="${lon}">`, ...inner, `  </wpt>`].join('\n');
}

function serializeTrack(track: Track): string {
	const lines: string[] = ['  <trk>'];
	if (track.name) lines.push(`    <name>${escapeText(track.name)}</name>`);
	lines.push('    <trkseg>');
	for (const p of track.points) {
		lines.push(serializeTrackPoint(p));
	}
	lines.push('    </trkseg>');
	lines.push('  </trk>');
	return lines.join('\n');
}

function serializeTrackPoint(p: TrackPoint): string {
	const lat = numAttr(p.lat);
	const lon = numAttr(p.lon);
	if (p.ele === undefined) {
		return `      <trkpt lat="${lat}" lon="${lon}"/>`;
	}
	return `      <trkpt lat="${lat}" lon="${lon}"><ele>${numText(p.ele)}</ele></trkpt>`;
}

function numAttr(n: number): string {
	// Trim trailing zeros while preserving GPX-typical 6dp lat/lon precision.
	return Number.isInteger(n) ? n.toString() : Number.parseFloat(n.toFixed(7)).toString();
}

function numText(n: number): string {
	return Number.isInteger(n) ? n.toString() : Number.parseFloat(n.toFixed(3)).toString();
}

function escapeText(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
	return escapeText(s).replace(/"/g, '&quot;');
}
