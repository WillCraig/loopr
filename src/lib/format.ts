/**
 * Display formatting helpers shared by the UI components.
 *
 * These wrap the unit math the gpx library exposes so components can stay
 * declarative; nothing about display lives inside `src/lib/gpx/`.
 */

import type { Units } from './gpx';

const M_PER_MI = 1609.344;

/** Distance in display units, fixed to 1dp. */
export function fmtDistance(meters: number, units: Units): string {
	const v = units === 'mi' ? meters / M_PER_MI : meters / 1000;
	return v.toFixed(1);
}

/** Elevation in display units, rounded and locale-formatted. */
export function fmtElev(meters: number, units: Units): string {
	const v = units === 'mi' ? meters / 0.3048 : meters;
	return Math.round(v).toLocaleString();
}

export function distUnit(units: Units): 'mi' | 'km' {
	return units === 'mi' ? 'mi' : 'km';
}

export function elevUnit(units: Units): 'ft' | 'm' {
	return units === 'mi' ? 'ft' : 'm';
}

/** Convert a value expressed in `units` back to meters. */
export function distToMeters(value: number, units: Units): number {
	return units === 'mi' ? value * M_PER_MI : value * 1000;
}

/**
 * Make a filename safe-ish. Same rule as the prototype: keep word chars,
 * dashes, dots, spaces; replace everything else with `_`.
 */
export function safeFilename(name: string): string {
	return name.replace(/[^\w\-. ]/g, '_');
}
