import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';

/**
 * O mundo em 2D é uma projeção planar registrada no MapLibre, que não repete
 * cópias automaticamente (ao contrário do Mercator). Para permitir pan infinito
 * no eixo leste–oeste, duplicamos as fontes em -360°, 0° e +360° e saltamos a
 * câmera em 360° sempre que ela cruza o antimeridiano. As três cópias cobrem
 * qualquer visão com até ~720° de largura.
 */
const OFFSETS = [-360, 0, 360] as const;

/** Número de cópias do mundo na praça da projeção planar. */
export const WORLD_COPIES = OFFSETS.length;

/** Deslocamento de zoom causado pela praça mais larga da projeção planar. */
export const FLAT_ZOOM_OFFSET = Math.log2(WORLD_COPIES);

function shiftPosition(position: Position, offset: number): Position {
	const next = position.slice() as Position;
	next[0] = position[0] + offset;
	return next;
}

function shiftCoordinates(coordinates: unknown, offset: number): unknown {
	if (!Array.isArray(coordinates)) return coordinates;
	if (typeof coordinates[0] === 'number') return shiftPosition(coordinates as Position, offset);
	return (coordinates as unknown[]).map((child) => shiftCoordinates(child, offset));
}

function shiftGeometry(geometry: Geometry, offset: number): Geometry {
	if (geometry.type === 'GeometryCollection') {
		return {
			...geometry,
			geometries: geometry.geometries.map((child) => shiftGeometry(child, offset))
		};
	}
	return { ...geometry, coordinates: shiftCoordinates(geometry.coordinates, offset) } as Geometry;
}

function shiftFeature(feature: Feature, offset: number): Feature {
	if (offset === 0) return feature;
	return {
		...feature,
		geometry: shiftGeometry(feature.geometry, offset)
	};
}

/** Duplica uma coleção em três cópias do mundo. */
export function wrapCollection<T extends FeatureCollection>(collection: T): T {
	const features: Feature[] = [];
	for (const offset of OFFSETS) {
		for (const feature of collection.features) features.push(shiftFeature(feature, offset));
	}
	return { ...collection, features } as T;
}

/** Duplica uma única feature em três cópias do mundo. */
export function wrapFeature(feature: Feature): Feature[] {
	return OFFSETS.map((offset) => shiftFeature(feature, offset));
}

/** Longitude mais próxima da câmera, para rótulos acompanharem a cópia visível. */
export function nearestLng(lng: number, centerLng: number): number {
	return lng + 360 * Math.round((centerLng - lng) / 360);
}

function oceanRing(): Position[] {
	const ring: Position[] = [];
	const step = 2;
	for (let lng = -180; lng < 180; lng += step) ring.push([lng, -90]);
	for (let lat = -90; lat < 90; lat += step) ring.push([180, lat]);
	for (let lng = 180; lng > -180; lng -= step) ring.push([lng, 90]);
	for (let lat = 90; lat > -90; lat -= step) ring.push([-180, lat]);
	ring.push(ring[0]);
	return ring;
}

/**
 * Polígono que cobre exatamente a área do mundo na projeção. É o "mar" do
 * atlas: fora dele o fundo do canvas fica transparente e mostra o espaço (3D)
 * ou a mesa de desenho (2D).
 */
export function oceanCollection(duplicate = true): FeatureCollection {
	const feature: Feature = {
		type: 'Feature',
		properties: {},
		geometry: { type: 'Polygon', coordinates: [oceanRing()] }
	};
	return { type: 'FeatureCollection', features: duplicate ? wrapFeature(feature) : [feature] };
}
