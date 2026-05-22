import { GpxParseError, NoTrackError, TooFewPointsError } from './errors';
import type { Gpx, Route, Track, TrackPoint, Waypoint } from './types';

const GPX_NS = 'http://www.topografix.com/GPX/1/1';

/**
 * Parse a GPX XML string into a `Gpx`. Reads only the elements loopr cares
 * about: trackpoints with optional elevation, waypoints, route blocks (kept as
 * opaque XML), and the top-level metadata `<name>` and `<creator>`.
 *
 * `<time>` elements are intentionally never extracted — loopr produces routes,
 * not rides, so carrying time data forward would be misleading.
 *
 * @throws GpxParseError on malformed XML
 * @throws NoTrackError if there is no `<trk>` element
 * @throws TooFewPointsError if any track has fewer than 2 points
 */
export function parseGpx(xml: string): Gpx {
	const doc = new DOMParser().parseFromString(xml, 'application/xml');
	if (doc.getElementsByTagName('parsererror').length > 0) {
		throw new GpxParseError();
	}

	const root = doc.documentElement;
	if (!root || root.localName !== 'gpx') {
		throw new GpxParseError('Root element is not <gpx>');
	}

	const tracks = parseTracks(root);
	if (tracks.length === 0) {
		throw new NoTrackError();
	}
	for (const track of tracks) {
		if (track.points.length < 2) {
			throw new TooFewPointsError(track.name ?? '', track.points.length);
		}
	}

	return {
		tracks,
		waypoints: parseWaypoints(root),
		routes: parseRoutes(root),
		metadata: parseMetadata(root)
	};
}

function parseTracks(root: Element): Track[] {
	const out: Track[] = [];
	for (const trk of childrenByLocalName(root, 'trk')) {
		const name = textOfFirstChild(trk, 'name');
		const points: TrackPoint[] = [];
		for (const seg of childrenByLocalName(trk, 'trkseg')) {
			for (const pt of childrenByLocalName(seg, 'trkpt')) {
				const parsed = parseTrackPoint(pt);
				if (parsed) points.push(parsed);
			}
		}
		out.push(name ? { name, points } : { points });
	}
	return out;
}

function parseTrackPoint(el: Element): TrackPoint | null {
	const lat = Number.parseFloat(el.getAttribute('lat') ?? '');
	const lon = Number.parseFloat(el.getAttribute('lon') ?? '');
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
	const eleText = textOfFirstChild(el, 'ele');
	if (eleText != null) {
		const ele = Number.parseFloat(eleText);
		if (Number.isFinite(ele)) return { lat, lon, ele };
	}
	return { lat, lon };
}

function parseWaypoints(root: Element): Waypoint[] {
	const out: Waypoint[] = [];
	for (const w of childrenByLocalName(root, 'wpt')) {
		const lat = Number.parseFloat(w.getAttribute('lat') ?? '');
		const lon = Number.parseFloat(w.getAttribute('lon') ?? '');
		if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
		const wpt: Waypoint = { lat, lon };
		const eleText = textOfFirstChild(w, 'ele');
		if (eleText != null) {
			const ele = Number.parseFloat(eleText);
			if (Number.isFinite(ele)) wpt.ele = ele;
		}
		const name = textOfFirstChild(w, 'name');
		if (name) wpt.name = name;
		const type = textOfFirstChild(w, 'type');
		if (type) wpt.type = type;
		out.push(wpt);
	}
	return out;
}

function parseRoutes(root: Element): Route[] {
	const out: Route[] = [];
	for (const rte of childrenByLocalName(root, 'rte')) {
		out.push({ rawXml: serializeElement(rte) });
	}
	return out;
}

function parseMetadata(root: Element): Gpx['metadata'] {
	const md: NonNullable<Gpx['metadata']> = {};
	const meta = firstChildByLocalName(root, 'metadata');
	if (meta) {
		const name = textOfFirstChild(meta, 'name');
		if (name) md.name = name;
	}
	const creator = root.getAttribute('creator');
	if (creator) md.creator = creator;
	return Object.keys(md).length > 0 ? md : undefined;
}

// ── DOM helpers ────────────────────────────────────────────────────────────

function childrenByLocalName(parent: Element, name: string): Element[] {
	const out: Element[] = [];
	for (const c of Array.from(parent.children)) {
		if (c.localName === name) out.push(c);
	}
	return out;
}

function firstChildByLocalName(parent: Element, name: string): Element | null {
	for (const c of Array.from(parent.children)) {
		if (c.localName === name) return c;
	}
	return null;
}

function textOfFirstChild(parent: Element, name: string): string | undefined {
	const el = firstChildByLocalName(parent, name);
	if (!el) return undefined;
	const text = el.textContent?.trim();
	return text && text.length > 0 ? text : undefined;
}

function serializeElement(el: Element): string {
	const xml = new XMLSerializer().serializeToString(el);
	// happy-dom/jsdom strip namespace declarations from inner elements when the
	// document already declares the GPX namespace at the root. Some bike
	// computers want the namespace inline on each `<rte>`; reattach if missing.
	if (xml.startsWith('<rte ') && !xml.includes('xmlns=')) {
		return xml.replace('<rte', `<rte xmlns="${GPX_NS}"`);
	}
	if (xml.startsWith('<rte>')) {
		return xml.replace('<rte>', `<rte xmlns="${GPX_NS}">`);
	}
	return xml;
}
