import { describe, expect, it } from 'vitest';
import { elevToMeters } from '$lib/format';

describe('elevToMeters', () => {
	it('converts feet to meters (1 ft → 0.3048 m)', () => {
		expect(elevToMeters(1, 'mi')).toBeCloseTo(0.3048, 10);
	});

	it('meters identity: value passes through unchanged for km units', () => {
		expect(elevToMeters(100, 'km')).toBe(100);
	});

	it('Everest: 29 029 ft ≈ 8 848 m (within 5 m)', () => {
		expect(Math.abs(elevToMeters(29029, 'mi') - 8848)).toBeLessThan(5);
	});
});
