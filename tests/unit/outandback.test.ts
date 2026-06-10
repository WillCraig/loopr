import { describe, expect, it } from 'vitest';
import {
	computeSummary,
	gpxIsPointToPoint,
	isPointToPoint,
	outAndBack,
	parseGpx,
	repeat,
	startEndGapMeters
} from '$lib/gpx';
import { fixture } from './fixtures';

/** Two tracks in one file: a closed loop and a point-to-point. */
const MIXED_XML = `<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Loop</name><trkseg>
    <trkpt lat="41.1500" lon="-81.3600"><ele>300</ele></trkpt>
    <trkpt lat="41.1510" lon="-81.3600"><ele>310</ele></trkpt>
    <trkpt lat="41.1500" lon="-81.3600"><ele>300</ele></trkpt>
  </trkseg></trk>
  <trk><name>OneWay</name><trkseg>
    <trkpt lat="41.2000" lon="-81.3600"><ele>300</ele></trkpt>
    <trkpt lat="41.2100" lon="-81.3600"><ele>320</ele></trkpt>
  </trkseg></trk>
</gpx>`;

describe('startEndGapMeters', () => {
	it('is ~0 for a closed loop', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		expect(startEndGapMeters(gpx.tracks[0])).toBeLessThan(1);
	});

	it('measures the full gap of a point-to-point track', () => {
		const gpx = parseGpx(fixture('point_to_point'));
		// 0.0100° of latitude ≈ 1112 m
		const gap = startEndGapMeters(gpx.tracks[0]);
		expect(gap).toBeGreaterThan(1000);
		expect(gap).toBeLessThan(1250);
	});
});

describe('isPointToPoint', () => {
	it('classifies a closed loop as not point-to-point', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		expect(isPointToPoint(gpx.tracks[0])).toBe(false);
	});

	it('classifies an A-B track as point-to-point', () => {
		const gpx = parseGpx(fixture('point_to_point'));
		expect(isPointToPoint(gpx.tracks[0])).toBe(true);
	});

	it('treats a sub-100m gap as a loop (GPS noise)', () => {
		// Ends ~56 m from the start.
		const gpx = parseGpx(`<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Noisy loop</name><trkseg>
    <trkpt lat="41.1500" lon="-81.3600"/>
    <trkpt lat="41.1520" lon="-81.3600"/>
    <trkpt lat="41.1505" lon="-81.3600"/>
  </trkseg></trk>
</gpx>`);
		expect(isPointToPoint(gpx.tracks[0])).toBe(false);
	});

	it('treats a gap below 2% of route length as a loop, even when over 100m', () => {
		// Out ~5.6 km, back to ~111 m from the start: gap 111 m < 2% (220 m).
		const gpx = parseGpx(`<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Big loop</name><trkseg>
    <trkpt lat="41.1500" lon="-81.3600"/>
    <trkpt lat="41.2000" lon="-81.3600"/>
    <trkpt lat="41.1510" lon="-81.3600"/>
  </trkseg></trk>
</gpx>`);
		expect(isPointToPoint(gpx.tracks[0])).toBe(false);
	});

	it('classifies a lollipop (out, loop, back) as a loop', () => {
		const gpx = parseGpx(`<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Lollipop</name><trkseg>
    <trkpt lat="41.1500" lon="-81.3600"/>
    <trkpt lat="41.1550" lon="-81.3600"/>
    <trkpt lat="41.1560" lon="-81.3590"/>
    <trkpt lat="41.1550" lon="-81.3600"/>
    <trkpt lat="41.1500" lon="-81.3600"/>
  </trkseg></trk>
</gpx>`);
		expect(isPointToPoint(gpx.tracks[0])).toBe(false);
	});
});

describe('gpxIsPointToPoint', () => {
	it('is false when every track loops', () => {
		expect(gpxIsPointToPoint(parseGpx(fixture('simple_loop')))).toBe(false);
	});

	it('is true when any track is point-to-point', () => {
		expect(gpxIsPointToPoint(parseGpx(MIXED_XML))).toBe(true);
	});
});

describe('outAndBack', () => {
	it('mirrors the track with the turnaround seam deduped (m points → 2m−1)', () => {
		const gpx = parseGpx(fixture('point_to_point')); // 5 points
		const result = outAndBack(gpx);
		expect(result.tracks[0].points).toHaveLength(9);
	});

	it('returns to the exact start, retracing points in reverse order', () => {
		const gpx = parseGpx(fixture('point_to_point'));
		const src = gpx.tracks[0].points;
		const pts = outAndBack(gpx).tracks[0].points;
		expect(pts[pts.length - 1]).toEqual(src[0]);
		expect(pts[5]).toEqual(src[3]);
		expect(pts[6]).toEqual(src[2]);
		expect(pts[7]).toEqual(src[1]);
	});

	it('mirrors elevation: round trip gain equals outbound gain + outbound loss', () => {
		const gpx = parseGpx(fixture('point_to_point')); // outbound: +50 gain, −10 loss
		const s = computeSummary(outAndBack(gpx), 'km').tracks[0];
		expect(s.elevationGain).toBeCloseTo(60, 5);
		expect(s.elevationLoss).toBeCloseTo(60, 5);
	});

	it('leaves loop tracks untouched in multi-track files', () => {
		const result = outAndBack(parseGpx(MIXED_XML));
		expect(result.tracks[0].points).toHaveLength(3); // loop unchanged
		expect(result.tracks[1].points).toHaveLength(3); // 2 → 2·2−1
	});

	it('adds a Turnaround waypoint at B when requested', () => {
		const gpx = parseGpx(fixture('point_to_point'));
		const result = outAndBack(gpx, { turnaround: true });
		const wpt = result.waypoints.find((w) => w.type === 'Turnaround');
		expect(wpt).toBeDefined();
		expect(wpt?.name).toBe('Turnaround');
		expect(wpt?.lat).toBe(41.16);
		expect(wpt?.ele).toBe(340);
	});

	it('adds no waypoint by default', () => {
		const gpx = parseGpx(fixture('point_to_point'));
		expect(outAndBack(gpx).waypoints).toHaveLength(gpx.waypoints.length);
	});

	it('does not mutate the input', () => {
		const gpx = parseGpx(fixture('point_to_point'));
		const before = JSON.stringify(gpx);
		outAndBack(gpx, { turnaround: true });
		expect(JSON.stringify(gpx)).toBe(before);
	});

	it('carries routes and metadata through unchanged', () => {
		const gpx = parseGpx(fixture('with_route'));
		const result = outAndBack(gpx);
		expect(result.routes).toEqual(gpx.routes);
		expect(result.metadata).toEqual(gpx.metadata);
	});

	it('composes with repeat as ping-pong: A-B-A ×2 = A-B-A-B-A', () => {
		const gpx = parseGpx(fixture('point_to_point')); // 5 → A-B-A is 9 points
		const repeated = repeat(outAndBack(gpx), {
			mode: { type: 'count', n: 2 },
			lapWaypoints: false
		});
		expect(repeated.tracks[0].points).toHaveLength(2 * 8 + 1); // 17
		expect(computeSummary(repeated, 'km').laps).toBe(2);
	});
});
