import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';
import { worldUrl } from './world';

export type CountryFeature = Feature<Geometry, { code: string; name: string }>;

let cache: Promise<FeatureCollection> | null = null;

/** Carrega o GeoJSON uma única vez por sessão (o mesmo asset usado pelo mapa). */
export function loadWorld(): Promise<FeatureCollection> {
	if (!cache) {
		cache = fetch(worldUrl).then((res) => res.json() as Promise<FeatureCollection>);
	}
	return cache;
}

export async function featureFor(code: string): Promise<CountryFeature | null> {
	const world = await loadWorld();
	return (world.features as CountryFeature[]).find((f) => f.properties?.code === code) ?? null;
}

export function ringsOf(geometry: Geometry): number[][][] {
	if (geometry.type === 'Polygon') return (geometry as Polygon).coordinates;
	if (geometry.type === 'MultiPolygon') return (geometry as MultiPolygon).coordinates.flat();
	return [];
}

function normalizeRings(rings: number[][][]): number[][][] {
	if (!rings.length) return rings;
	const lons = rings.flat().map((p) => p[0]);
	const span = Math.max(...lons) - Math.min(...lons);
	if (span <= 180) return rings;
	const center = lons.reduce((a, b) => a + b, 0) / lons.length;
	return rings.map((ring) =>
		ring.map(([lon, lat]) => {
			let x = lon;
			while (x - center > 180) x -= 360;
			while (x - center < -180) x += 360;
			return [x, lat];
		})
	);
}

export interface LocatorShape {
	country: string;
	neighbors: string;
	grid: string;
	/** Coordenadas do centro e escala usadas, para desenhar o graticule. */
	bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number };
}

/**
 * Projeta o país (e vizinhos) em um viewBox equirretangular.
 * Usado no mini-mapa do card e no dossiê.
 */
export function locatorShape(
	country: CountryFeature,
	neighbors: CountryFeature[],
	width = 240,
	height = 132
): LocatorShape | null {
	const countryRings = normalizeRings(ringsOf(country.geometry));
	if (!countryRings.length) return null;
	const all = [...countryRings, ...neighbors.flatMap((n) => normalizeRings(ringsOf(n.geometry)))];
	const points = all.flat();
	if (!points.length) return null;
	const lons = points.map((p) => p[0]);
	const lats = points.map((p) => p[1]);
	let minLon = Math.min(...lons);
	let maxLon = Math.max(...lons);
	let minLat = Math.min(...lats);
	let maxLat = Math.max(...lats);

	const pad = 0.08;
	const padLon = Math.max((maxLon - minLon) * pad, 2.2);
	const padLat = Math.max((maxLat - minLat) * pad, 1.8);
	minLon -= padLon;
	maxLon += padLon;
	minLat -= padLat;
	maxLat += padLat;

	const spanLon = maxLon - minLon;
	const spanLat = maxLat - minLat;
	const scale = Math.min(width / spanLon, height / spanLat);
	const offsetX = (width - spanLon * scale) / 2;
	const offsetY = (height - spanLat * scale) / 2;

	const project = ([lon, lat]: number[]) =>
		`${(offsetX + (lon - minLon) * scale).toFixed(1)},${(offsetY + (maxLat - lat) * scale).toFixed(1)}`;

	const toPath = (rings: number[][][]) =>
		rings
			.map((ring) => {
				if (ring.length < 3) return '';
				return `M${ring.map(project).join('L')}Z`;
			})
			.join('');

	const step = spanLon > 100 ? 30 : spanLon > 55 ? 20 : spanLon > 25 ? 10 : 5;
	const grid: string[] = [];
	for (let lon = Math.ceil(minLon / step) * step; lon <= maxLon; lon += step) {
		const x = offsetX + (lon - minLon) * scale;
		grid.push(`M${x.toFixed(1)},${offsetY.toFixed(1)}V${(offsetY + spanLat * scale).toFixed(1)}`);
	}
	for (let lat = Math.ceil(minLat / step) * step; lat <= maxLat; lat += step) {
		const y = offsetY + (maxLat - lat) * scale;
		grid.push(`M${offsetX.toFixed(1)},${y.toFixed(1)}H${(offsetX + spanLon * scale).toFixed(1)}`);
	}

	return {
		country: toPath(countryRings),
		neighbors: toPath(neighbors.flatMap((n) => normalizeRings(ringsOf(n.geometry)))),
		grid: grid.join(''),
		bounds: { minLon, maxLon, minLat, maxLat }
	};
}
