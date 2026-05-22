/**
 * Public types for the loopr GPX library.
 *
 * All types are pure data shapes. The library never carries `<time>` data
 * forward — anything time-related is stripped during parsing.
 */

/** A single trackpoint. `ele` is meters; missing elevation is treated as 0 in
 *  calculations but kept as `undefined` here so serializers can omit it. */
export interface TrackPoint {
	lat: number;
	lon: number;
	ele?: number;
}

/** One track. Multi-segment tracks are collapsed into a single point list
 *  during parsing so callers don't have to think about segments. */
export interface Track {
	name?: string;
	points: TrackPoint[];
}

/** Standalone waypoints (created by route planners, lap markers, etc.). */
export interface Waypoint {
	lat: number;
	lon: number;
	ele?: number;
	name?: string;
	type?: string;
}

/** Routes (`<rte>`) are passed through opaquely. Loopr never repeats them; the
 *  raw XML is round-tripped verbatim so a planner that emits a route alongside
 *  a track doesn't lose data. */
export interface Route {
	rawXml: string;
}

/** Root document shape. */
export interface Gpx {
	tracks: Track[];
	waypoints: Waypoint[];
	routes: Route[];
	metadata?: { name?: string; creator?: string };
}

export type Units = 'mi' | 'km';

/** Lap configuration: either an explicit count, or a target distance from which
 *  the lap count is derived. */
export type LapMode = { type: 'count'; n: number } | { type: 'minDistance'; targetMeters: number };

export interface RepeatConfig {
	mode: LapMode;
	lapWaypoints: boolean;
	/** Overrides the default `${name} x${n}` suffix. Multi-track inputs get
	 *  ` (i+1)` appended so the names stay distinct. */
	nameOverride?: string;
	/** Optional commute GPX. Its first track is prepended to each lap track
	 *  and a reversed copy is appended, producing one seamless ride. */
	commute?: Gpx;
}

export interface TrackSummary {
	name: string;
	laps: number;
	/** In the units chosen by the caller. */
	distancePerLap: number;
	totalDistance: number;
	/** ft for `mi`, m for `km`. */
	elevationGain: number;
	elevationLoss: number;
	maxGradientPct: number;
}

export interface Summary {
	units: Units;
	laps: number;
	tracks: TrackSummary[];
	/** Per-leg commute stats in display units. Present only when a commute was
	 *  supplied. The same numbers apply to both legs (return is the reverse). */
	commute?: CommuteSummary;
}

export interface CommuteSummary {
	distance: number;
	elevationGain: number;
	elevationLoss: number;
}

/** Hard cap on how many laps loopr will emit. Mirrors the UI's input range and
 *  the safety check in `repeat()` for minDistance mode. */
export const MAX_LAPS = 100;
