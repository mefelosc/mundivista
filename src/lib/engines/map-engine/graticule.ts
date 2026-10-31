import type { FeatureCollection, LineString } from 'geojson';

/**
 * Gratícula: meridianos e paralelos a cada 30°, com destaque para o Equador,
 * os trópicos e os círculos polares.
 */
export function graticuleGeoJSON(): FeatureCollection<LineString, { kind: 'minor' | 'major' }> {
	const features: FeatureCollection<LineString, { kind: 'minor' | 'major' }>['features'] = [];

	for (let lng = -180; lng <= 180; lng += 30) {
		features.push({
			type: 'Feature',
			properties: { kind: lng === 0 || Math.abs(lng) === 180 ? 'major' : 'minor' },
			geometry: {
				type: 'LineString',
				coordinates: Array.from({ length: 37 }, (_, i) => [lng, -80 + i * (160 / 36)])
			}
		});
	}

	for (let lat = -60; lat <= 60; lat += 30) {
		features.push({
			type: 'Feature',
			properties: { kind: lat === 0 ? 'major' : 'minor' },
			geometry: {
				type: 'LineString',
				coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat])
			}
		});
	}

	for (const lat of [23.436, -23.436, 66.563, -66.563]) {
		features.push({
			type: 'Feature',
			properties: { kind: 'major' },
			geometry: {
				type: 'LineString',
				coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat])
			}
		});
	}

	return { type: 'FeatureCollection', features };
}
