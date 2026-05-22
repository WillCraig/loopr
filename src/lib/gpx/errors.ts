/**
 * Typed error classes the UI pattern-matches on by `instanceof` or `name`.
 *
 * Keeping them as a small fixed set means the user-facing copy can be chosen
 * by the component layer instead of buried in the library.
 */

export class GpxParseError extends Error {
	constructor(message = 'GPX could not be parsed as XML') {
		super(message);
		this.name = 'GpxParseError';
	}
}

export class NoTrackError extends Error {
	constructor(message = 'GPX contains no <trk> element') {
		super(message);
		this.name = 'NoTrackError';
	}
}

export class TooFewPointsError extends Error {
	constructor(
		public readonly trackName: string,
		public readonly pointCount: number
	) {
		super(
			`Track ${trackName ? `"${trackName}"` : ''} has ${pointCount} point(s); need at least 2`.trim()
		);
		this.name = 'TooFewPointsError';
	}
}

export class LapCapExceededError extends Error {
	constructor(
		public readonly requestedLaps: number,
		public readonly cap: number
	) {
		super(`Lap count ${requestedLaps} exceeds cap of ${cap}`);
		this.name = 'LapCapExceededError';
	}
}
