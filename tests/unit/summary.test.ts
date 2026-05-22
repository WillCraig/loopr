import { describe, expect, it } from 'vitest';
import { parseGpx, repeat, computeSummary } from '$lib/gpx';
import { fixture } from './fixtures';

const M_PER_MI = 1609.344;
const M_PER_FT = 0.3048;

describe('summary', () => {
	it('total distance matches haversine sum', () => {
		const gpx = parseGpx(fixture('simple_loop')); // ~390m square loop
		const summary = computeSummary(gpx, 'km');
		// 0.001° lat ~= 111.2m, 0.001° lon at lat 41° ~= 83.9m → total ≈ 0.390km
		expect(summary.tracks[0].totalDistance).toBeGreaterThan(0.38);
		expect(summary.tracks[0].totalDistance).toBeLessThan(0.4);
	});

	it('elevation gain sums positive deltas', () => {
		const gpx = parseGpx(fixture('simple_loop')); // deltas: +20, -10, -5, -5
		const summary = computeSummary(gpx, 'km');
		expect(summary.tracks[0].elevationGain).toBeCloseTo(20, 5);
	});

	it('elevation loss sums absolute negative deltas', () => {
		const gpx = parseGpx(fixture('simple_loop')); // losses: 10 + 5 + 5 = 20
		const summary = computeSummary(gpx, 'km');
		expect(summary.tracks[0].elevationLoss).toBeCloseTo(20, 5);
	});

	it('max gradient computed over 100m window', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const summary = computeSummary(gpx, 'km');
		// Steepest 100m: 20m rise across 111m → ~18.0%
		expect(summary.tracks[0].maxGradientPct).toBeGreaterThan(17);
		expect(summary.tracks[0].maxGradientPct).toBeLessThan(19);
	});

	it('skips windows shorter than 100m at end', () => {
		// Two points only 50m apart → no window ever reaches 100m.
		const xml = `<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="0" lon="0"><ele>0</ele></trkpt>
    <trkpt lat="0.0004491" lon="0"><ele>50</ele></trkpt>
  </trkseg></trk>
</gpx>`;
		const gpx = parseGpx(xml);
		const summary = computeSummary(gpx, 'km');
		expect(summary.tracks[0].maxGradientPct).toBe(0);
	});

	it('units conversion: m → mi', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const km = computeSummary(gpx, 'km').tracks[0].totalDistance;
		const mi = computeSummary(gpx, 'mi').tracks[0].totalDistance;
		expect(mi).toBeCloseTo((km * 1000) / M_PER_MI, 4);
	});

	it('units conversion: m → km', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const summary = computeSummary(gpx, 'km');
		// totalDistance is in km; sanity-check it's roughly 0.39
		expect(summary.tracks[0].totalDistance).toBeCloseTo(0.39, 1);
		// elevation gain is in meters for km units
		expect(summary.tracks[0].elevationGain).toBeCloseTo(20, 4);
	});

	it('missing elevation treated as 0 silently', () => {
		const xml = `<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="0" lon="0"/>
    <trkpt lat="0.001" lon="0"/>
    <trkpt lat="0.002" lon="0"/>
  </trkseg></trk>
</gpx>`;
		const gpx = parseGpx(xml);
		const summary = computeSummary(gpx, 'km');
		expect(summary.tracks[0].elevationGain).toBe(0);
		expect(summary.tracks[0].elevationLoss).toBe(0);
		expect(summary.tracks[0].totalDistance).toBeGreaterThan(0);
	});

	it('distance per lap = total / laps', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const repeated = repeat(gpx, { mode: { type: 'count', n: 5 }, lapWaypoints: false });
		const summary = computeSummary(repeated, 'mi');
		expect(summary.tracks[0].laps).toBe(5);
		expect(summary.tracks[0].totalDistance / summary.tracks[0].laps).toBeCloseTo(
			summary.tracks[0].distancePerLap,
			6
		);
	});

	it('elevation in feet when units = mi', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const summary = computeSummary(gpx, 'mi');
		// 20m of gain ≈ 65.6ft
		expect(summary.tracks[0].elevationGain).toBeCloseTo(20 / M_PER_FT, 2);
	});

	describe('commute', () => {
		it('omits commute block when no commute is supplied', () => {
			const gpx = parseGpx(fixture('simple_loop'));
			const summary = computeSummary(gpx, 'km');
			expect(summary.commute).toBeUndefined();
		});

		it('reports commute distance and elevation in display units', () => {
			const gpx = parseGpx(fixture('simple_loop'));
			const commute = parseGpx(fixture('commute_segment'));
			const summary = computeSummary(gpx, 'km', commute);
			expect(summary.commute).toBeDefined();
			expect(summary.commute!.distance).toBeGreaterThan(0);
			// commute_segment elevations: 295 → 297 → 300. Gain 5, loss 0.
			expect(summary.commute!.elevationGain).toBeCloseTo(5, 5);
			expect(summary.commute!.elevationLoss).toBeCloseTo(0, 5);
		});

		it('returns undefined commute block when commute track has fewer than 2 points', () => {
			const gpx = parseGpx(fixture('simple_loop'));
			const empty = { tracks: [{ points: [] }], waypoints: [], routes: [] };
			const summary = computeSummary(gpx, 'km', empty);
			expect(summary.commute).toBeUndefined();
		});
	});
});
