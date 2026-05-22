/**
 * A small synthesized GPX for the "Try with a sample route" button so users
 * can preview the app without uploading anything. ~12mi rolling-hills loop
 * around an imagined Charlottesville start.
 *
 * This mirrors the prototype's `sampleGPXText` exactly so reviewers can
 * compare visuals against the design bundle.
 */

// TODO: replace this with a real GPX route of a circle, perhaps MF crit lake

export const SAMPLE_FILENAME = 'blue-ridge-sampler.gpx';

export function sampleGpxText(): string {
	const cx = 38.0293;
	const cy = -78.4767;
	const r = 0.045;
	const N = 96;
	const points: string[] = [];
	for (let i = 0; i <= N; i++) {
		const t = (i / N) * Math.PI * 2;
		const lat = cx + Math.sin(t) * r;
		const lon = cy + Math.cos(t) * r * 1.3;
		const ele = 180 + Math.sin(t * 3) * 28 + Math.cos(t * 5) * 14;
		points.push(
			`    <trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}"><ele>${ele.toFixed(1)}</ele></trkpt>`
		);
	}
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<gpx version="1.1" creator="loopr-sample" xmlns="http://www.topografix.com/GPX/1/1">',
		'  <trk><name>Blue Ridge Sampler</name><trkseg>',
		...points,
		'  </trkseg></trk>',
		'</gpx>'
	].join('\n');
}
