import { describe, expect, it } from 'vitest';
import type { FeatureCollection, Point } from 'geojson';
import { FLAT_ZOOM_OFFSET, nearestLng, oceanCollection, wrapCollection } from './wrap';

describe('wrap do mundo em 2D', () => {
	it('duplica as feições em -360°, 0° e +360°', () => {
		const data: FeatureCollection<Point> = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					properties: { code: 'BRA' },
					geometry: { type: 'Point', coordinates: [-55, -10] }
				}
			]
		};
		const wrapped = wrapCollection(data);
		expect(wrapped.features).toHaveLength(3);
		expect(wrapped.features.map((feature) => (feature.geometry as Point).coordinates[0])).toEqual([
			-415, -55, 305
		]);
		// A cópia original é reaproveitada, sem mutar a entrada.
		expect(wrapped.features[1]).toBe(data.features[0]);
		expect((data.features[0].geometry as Point).coordinates[0]).toBe(-55);
	});

	it('aproxima uma longitude da cópia visível mais próxima', () => {
		expect(nearestLng(-170, 175)).toBe(190);
		expect(nearestLng(170, -175)).toBe(-190);
		expect(nearestLng(-55, 0)).toBe(-55);
	});

	it('desenha o oceano em três cópias no 2D e numa no globo', () => {
		expect(oceanCollection(true).features).toHaveLength(3);
		expect(oceanCollection(false).features).toHaveLength(1);
		const ring = (oceanCollection(false).features[0].geometry as { coordinates: number[][][] })
			.coordinates[0];
		expect(ring[0]).toEqual(ring[ring.length - 1]);
		expect(ring.length).toBeGreaterThan(180);
	});

	it('mantém o deslocamento de zoom coerente com as três cópias', () => {
		expect(FLAT_ZOOM_OFFSET).toBeCloseTo(Math.log2(3), 10);
	});
});
