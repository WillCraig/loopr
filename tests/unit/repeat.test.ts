import { describe, expect, it } from 'vitest';
import { parseGpx, repeat, LapCapExceededError } from '$lib/gpx';
import { fixture } from './fixtures';

describe('repeat', () => {
	it('n=1 returns same point count', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const result = repeat(gpx, { mode: { type: 'count', n: 1 }, lapWaypoints: false });
		expect(result.tracks[0].points).toHaveLength(gpx.tracks[0].points.length);
	});

	it('n=2 dedupes seam (m+1 input → 2m+1 output)', () => {
		const gpx = parseGpx(fixture('simple_loop')); // 5 points (m=4)
		const result = repeat(gpx, { mode: { type: 'count', n: 2 }, lapWaypoints: false });
		expect(result.tracks[0].points).toHaveLength(2 * 4 + 1); // 9
	});

	it('n=3 dedupes two seams', () => {
		const gpx = parseGpx(fixture('simple_loop')); // m=4
		const result = repeat(gpx, { mode: { type: 'count', n: 3 }, lapWaypoints: false });
		expect(result.tracks[0].points).toHaveLength(3 * 4 + 1); // 13
	});

	it('preserves coordinates in expected concatenation order', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const result = repeat(gpx, { mode: { type: 'count', n: 2 }, lapWaypoints: false });
		const pts = result.tracks[0].points;
		// First lap: pts 0..4. Second lap reuses pts 1..4 (4 points).
		expect(pts[0]).toEqual(gpx.tracks[0].points[0]);
		expect(pts[4]).toEqual(gpx.tracks[0].points[4]);
		expect(pts[5]).toEqual(gpx.tracks[0].points[1]);
		expect(pts[8]).toEqual(gpx.tracks[0].points[4]);
	});

	it('applies default name suffix "xN"', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const result = repeat(gpx, { mode: { type: 'count', n: 7 }, lapWaypoints: false });
		expect(result.tracks[0].name).toBe('Kent Square Loop x7');
	});

	it('respects nameOverride exactly', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const result = repeat(gpx, {
			mode: { type: 'count', n: 3 },
			lapWaypoints: false,
			nameOverride: 'My Big Ride'
		});
		expect(result.tracks[0].name).toBe('My Big Ride');
	});

	it('repeats multiple tracks independently', () => {
		const xml = `<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>A</name><trkseg>
    <trkpt lat="0" lon="0"/><trkpt lat="1" lon="0"/><trkpt lat="0" lon="0"/>
  </trkseg></trk>
  <trk><name>B</name><trkseg>
    <trkpt lat="5" lon="5"/><trkpt lat="6" lon="5"/><trkpt lat="5" lon="5"/>
  </trkseg></trk>
</gpx>`;
		const gpx = parseGpx(xml);
		const result = repeat(gpx, { mode: { type: 'count', n: 2 }, lapWaypoints: false });
		expect(result.tracks).toHaveLength(2);
		expect(result.tracks[0].name).toBe('A x2');
		expect(result.tracks[1].name).toBe('B x2');
		expect(result.tracks[0].points).toHaveLength(5);
		expect(result.tracks[1].points).toHaveLength(5);
	});

	it('passes routes through unchanged', () => {
		const gpx = parseGpx(fixture('with_route'));
		const result = repeat(gpx, { mode: { type: 'count', n: 2 }, lapWaypoints: false });
		expect(result.routes).toHaveLength(1);
		expect(result.routes[0].rawXml).toBe(gpx.routes[0].rawXml);
	});

	it('passes existing waypoints through unchanged', () => {
		const gpx = parseGpx(fixture('with_route'));
		const result = repeat(gpx, { mode: { type: 'count', n: 3 }, lapWaypoints: false });
		const original = gpx.waypoints[0];
		const survived = result.waypoints.find((w) => w.name === original.name);
		expect(survived).toBeDefined();
		expect(survived?.lat).toBe(original.lat);
	});

	it('adds lap waypoints with correct names (single track)', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const result = repeat(gpx, { mode: { type: 'count', n: 4 }, lapWaypoints: true });
		const names = result.waypoints.map((w) => w.name);
		expect(names).toEqual(['Lap 2 start', 'Lap 3 start', 'Lap 4 start']);
	});

	it('adds lap waypoints with correct names (multi-track)', () => {
		const xml = `<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>A</name><trkseg>
    <trkpt lat="0" lon="0"/><trkpt lat="1" lon="0"/><trkpt lat="0" lon="0"/>
  </trkseg></trk>
  <trk><name>B</name><trkseg>
    <trkpt lat="5" lon="5"/><trkpt lat="6" lon="5"/><trkpt lat="5" lon="5"/>
  </trkseg></trk>
</gpx>`;
		const gpx = parseGpx(xml);
		const result = repeat(gpx, { mode: { type: 'count', n: 2 }, lapWaypoints: true });
		const names = result.waypoints.map((w) => w.name);
		expect(names).toContain('A x2 Lap 2 start');
		expect(names).toContain('B x2 Lap 2 start');
	});

	it('lap waypoint coordinates match seam point', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const seam = gpx.tracks[0].points[0];
		const result = repeat(gpx, { mode: { type: 'count', n: 3 }, lapWaypoints: true });
		for (const wpt of result.waypoints.filter((w) => w.type === 'Lap')) {
			expect(wpt.lat).toBe(seam.lat);
			expect(wpt.lon).toBe(seam.lon);
			expect(wpt.ele).toBe(seam.ele);
		}
	});

	it('minDistance mode: computes ceil(target / lapDistance)', () => {
		const gpx = parseGpx(fixture('simple_loop')); // lap ≈ 390m
		const result = repeat(gpx, {
			mode: { type: 'minDistance', targetMeters: 1000 },
			lapWaypoints: false
		});
		// ceil(1000 / ~390) = 3
		expect(result.tracks[0].name).toBe('Kent Square Loop x3');
	});

	it('minDistance mode: returns n=1 when target < lapDistance', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const result = repeat(gpx, {
			mode: { type: 'minDistance', targetMeters: 50 },
			lapWaypoints: false
		});
		expect(result.tracks[0].name).toBe('Kent Square Loop x1');
	});

	it('minDistance mode: throws LapCapExceededError when n > MAX_LAPS', () => {
		const gpx = parseGpx(fixture('simple_loop')); // lap ≈ 390m → 101 laps ≈ 39.4km
		expect(() =>
			repeat(gpx, {
				mode: { type: 'minDistance', targetMeters: 100_000 }, // 100km
				lapWaypoints: false
			})
		).toThrow(LapCapExceededError);
	});

	describe('with commute', () => {
		it('prepends commute and appends reversed commute around 1 lap (coincident seam)', () => {
			const gpx = parseGpx(fixture('simple_loop')); // 5 points; first == last (closed loop)
			const commute = parseGpx(fixture('commute_segment')); // 3 points; ends at loop start
			const result = repeat(gpx, {
				mode: { type: 'count', n: 1 },
				lapWaypoints: false,
				commute
			});
			// commute (3) + lap-start-deduped lap (4) + reversed commute first-deduped (2)
			// = 3 + 4 + 2 = 9 points
			expect(result.tracks[0].points).toHaveLength(9);
			const pts = result.tracks[0].points;
			const cm = commute.tracks[0].points;
			// First three points are the commute, in order.
			expect(pts[0]).toEqual(cm[0]);
			expect(pts[1]).toEqual(cm[1]);
			expect(pts[2]).toEqual(cm[2]);
			// Last three points are the reversed commute.
			expect(pts[pts.length - 1]).toEqual(cm[0]);
			expect(pts[pts.length - 2]).toEqual(cm[1]);
			expect(pts[pts.length - 3]).toEqual(cm[2]);
		});

		it('prepends commute around N=3 laps and preserves lap point count', () => {
			const gpx = parseGpx(fixture('simple_loop')); // m=4 → N=3 laps = 13 points
			const commute = parseGpx(fixture('commute_segment')); // 3 points, coincident seam
			const result = repeat(gpx, {
				mode: { type: 'count', n: 3 },
				lapWaypoints: false,
				commute
			});
			// 3 (commute) + 13 (laps; first deduped vs commute end) − 1
			// + 3 (reversed commute; first deduped vs lap end) − 1
			// = 3 + 12 + 2 = 17
			expect(result.tracks[0].points).toHaveLength(17);
		});

		it('lap waypoints still anchor on the loop seam, not the commute', () => {
			const gpx = parseGpx(fixture('simple_loop'));
			const commute = parseGpx(fixture('commute_segment'));
			const seam = gpx.tracks[0].points[0];
			const result = repeat(gpx, {
				mode: { type: 'count', n: 3 },
				lapWaypoints: true,
				commute
			});
			const lapWpts = result.waypoints.filter((w) => w.type === 'Lap');
			expect(lapWpts).toHaveLength(2); // laps 2 and 3
			for (const w of lapWpts) {
				expect(w.lat).toBe(seam.lat);
				expect(w.lon).toBe(seam.lon);
			}
		});

		it('non-coincident seam concatenates without dropping a point', () => {
			const gpx = parseGpx(fixture('simple_loop'));
			// Commute whose end (5,5) does not match the loop start (41.15, -81.36).
			const offsetCommute = parseGpx(`<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>off</name><trkseg>
    <trkpt lat="4" lon="4"/><trkpt lat="5" lon="5"/>
  </trkseg></trk>
</gpx>`);
			const result = repeat(gpx, {
				mode: { type: 'count', n: 1 },
				lapWaypoints: false,
				commute: offsetCommute
			});
			// 2 (commute) + 5 (lap, no dedupe) + 2 (reversed commute, no dedupe) = 9
			expect(result.tracks[0].points).toHaveLength(9);
			// First commute point intact, last point is the commute's first (since reversed).
			expect(result.tracks[0].points[0]).toEqual(offsetCommute.tracks[0].points[0]);
			expect(result.tracks[0].points[8]).toEqual(offsetCommute.tracks[0].points[0]);
		});
	});
});
