import { describe, expect, it } from 'vitest';
import { parseGpx, GpxParseError, NoTrackError, TooFewPointsError } from '$lib/gpx';
import { fixture } from './fixtures';

describe('parser', () => {
	it('parses valid GPX with single track', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		expect(gpx.tracks).toHaveLength(1);
		expect(gpx.tracks[0].name).toBe('Kent Square Loop');
		expect(gpx.tracks[0].points).toHaveLength(5);
		expect(gpx.metadata?.name).toBe('Kent Square');
	});

	it('throws GpxParseError on malformed XML', () => {
		expect(() => parseGpx('<gpx><unclosed></gpx>')).toThrow(GpxParseError);
	});

	it('strips <time> elements from trackpoints', () => {
		const xml = `<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>T</name><trkseg>
    <trkpt lat="0" lon="0"><ele>1</ele><time>2024-01-01T00:00:00Z</time></trkpt>
    <trkpt lat="1" lon="1"><ele>2</ele><time>2024-01-01T00:01:00Z</time></trkpt>
  </trkseg></trk>
</gpx>`;
		const gpx = parseGpx(xml);
		const pt = gpx.tracks[0].points[0];
		expect(pt).not.toHaveProperty('time');
		expect(pt.ele).toBe(1);
	});

	it('collapses multi-segment tracks into one point list', () => {
		const gpx = parseGpx(fixture('multi_segment'));
		expect(gpx.tracks).toHaveLength(1);
		expect(gpx.tracks[0].points).toHaveLength(6);
	});

	it('captures routes as raw XML for pass-through', () => {
		const gpx = parseGpx(fixture('with_route'));
		expect(gpx.routes).toHaveLength(1);
		expect(gpx.routes[0].rawXml).toContain('<rte');
		expect(gpx.routes[0].rawXml).toContain('Side Route');
	});

	it('captures waypoints with name and type', () => {
		const gpx = parseGpx(fixture('with_route'));
		expect(gpx.waypoints).toHaveLength(1);
		expect(gpx.waypoints[0].name).toBe('Trailhead');
		expect(gpx.waypoints[0].type).toBe('generic');
		expect(gpx.waypoints[0].lat).toBeCloseTo(41.15, 4);
	});

	it('throws NoTrackError on input with no <trk>', () => {
		expect(() => parseGpx(fixture('no_track'))).toThrow(NoTrackError);
	});

	it('throws TooFewPointsError on single-point track', () => {
		expect(() => parseGpx(fixture('single_point'))).toThrow(TooFewPointsError);
	});

	it('parses elevation as float when present', () => {
		const xml = `<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="0" lon="0"><ele>123.45</ele></trkpt>
    <trkpt lat="1" lon="1"><ele>200.0</ele></trkpt>
  </trkseg></trk>
</gpx>`;
		const gpx = parseGpx(xml);
		expect(gpx.tracks[0].points[0].ele).toBeCloseTo(123.45, 5);
		expect(gpx.tracks[0].points[1].ele).toBe(200);
	});

	it('treats missing elevation as undefined', () => {
		const xml = `<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="0" lon="0"/>
    <trkpt lat="1" lon="1"/>
  </trkseg></trk>
</gpx>`;
		const gpx = parseGpx(xml);
		expect(gpx.tracks[0].points[0].ele).toBeUndefined();
		expect(gpx.tracks[0].points[1].ele).toBeUndefined();
	});
});
