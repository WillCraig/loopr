import { describe, expect, it } from 'vitest';
import { parseGpx, repeat, serializeGpx } from '$lib/gpx';
import { fixture } from './fixtures';

describe('serialize', () => {
	it('roundtrip: parse → serialize → parse produces equivalent structure', () => {
		const before = parseGpx(fixture('simple_loop'));
		const xml = serializeGpx(before, 'test-1.0');
		const after = parseGpx(xml);
		expect(after.tracks).toHaveLength(before.tracks.length);
		expect(after.tracks[0].points).toHaveLength(before.tracks[0].points.length);
		expect(after.tracks[0].name).toBe(before.tracks[0].name);
		const p0 = after.tracks[0].points[0];
		const q0 = before.tracks[0].points[0];
		expect(p0.lat).toBeCloseTo(q0.lat, 4);
		expect(p0.lon).toBeCloseTo(q0.lon, 4);
		expect(p0.ele).toBe(q0.ele);
	});

	it('sets creator attribute to "loopr {version}"', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const xml = serializeGpx(gpx, '0.42.0');
		expect(xml).toContain('creator="loopr 0.42.0"');
	});

	it('output contains no <time> elements', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const repeated = repeat(gpx, { mode: { type: 'count', n: 3 }, lapWaypoints: true });
		const xml = serializeGpx(repeated, '0.1.0');
		expect(xml).not.toContain('<time');
	});

	it('XML-escapes special characters in track names', () => {
		const gpx = parseGpx(fixture('simple_loop'));
		const renamed = repeat(gpx, {
			mode: { type: 'count', n: 2 },
			lapWaypoints: false,
			nameOverride: 'Tea & "Climb" <hill>'
		});
		const xml = serializeGpx(renamed, '0.1.0');
		// `"` is only special in attribute values, not element text — so we only
		// expect `&`, `<`, `>` escaped inside the track <name>.
		expect(xml).toContain('Tea &amp; "Climb" &lt;hill&gt;');
		// And it should still parse back cleanly:
		const back = parseGpx(xml);
		expect(back.tracks[0].name).toBe('Tea & "Climb" <hill>');
	});

	it('route rawXml passes through verbatim', () => {
		const gpx = parseGpx(fixture('with_route'));
		const xml = serializeGpx(gpx, '0.1.0');
		expect(xml).toContain('Side Route');
		const back = parseGpx(xml);
		expect(back.routes).toHaveLength(1);
		expect(back.routes[0].rawXml).toContain('Side Route');
	});
});
