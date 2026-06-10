/**
 * Shared geometry helpers for the GPX library. Internal module — not exported
 * from the public barrel.
 */

const EARTH_RADIUS_M = 6371008.8;

export const SEAM_DEDUPE_EPSILON = 1e-6;

/** Great-circle distance in meters between two lat/lon pairs. */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/** True when two points coincide within {@link SEAM_DEDUPE_EPSILON} degrees. */
export function samePoint(
	a: { lat: number; lon: number },
	b: { lat: number; lon: number }
): boolean {
	return (
		Math.abs(a.lat - b.lat) < SEAM_DEDUPE_EPSILON && Math.abs(a.lon - b.lon) < SEAM_DEDUPE_EPSILON
	);
}
