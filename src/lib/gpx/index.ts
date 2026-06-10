/**
 * Public barrel for the loopr GPX library. Components consume this module;
 * internal modules are private.
 */

export { parseGpx } from './parser';
export { gpxIsPointToPoint, isPointToPoint, outAndBack, startEndGapMeters } from './outandback';
export { repeat } from './repeat';
export { serializeGpx } from './serialize';
export { computeSummary } from './summary';
export * from './types';
export * from './errors';
