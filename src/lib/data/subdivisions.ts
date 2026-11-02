/// <reference types="vite/client" />
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

/** Propriedades geradas por tools/build-subdivisions.mjs. */
export interface SubdivisionProperties {
	id: string;
	/** Código do país (Natural Earth ADM0_A3). */
	adm0: string;
	name: string;
	/** Tipo já traduzido: Estado, Província, Distrito… */
	type: string;
	iso: string | null;
	/** Ponto de rótulo [lng, lat]. */
	label: [number, number] | null;
}

export type SubdivisionFeature = Feature<Polygon | MultiPolygon, SubdivisionProperties>;

export type SubdivisionCollection = FeatureCollection<
	Polygon | MultiPolygon,
	SubdivisionProperties
> & {
	code: string;
	count: number;
	retrieved: string;
};

/**
 * As URLs entram no bundle como assets; o arquivo de cada país só é baixado
 * quando o usuário o seleciona no mapa político. O glob é preguiçoso: evita
 * importar ~190 módulos de URL no primeiro carregamento da rota (e evita que
 * um arquivo problemático derrube o preload inteiro no modo dev).
 */
const loaders = import.meta.glob<string>('./generated/subdivisions/*.json', {
	query: '?url',
	import: 'default'
});

const byCode = new Map(
	Object.entries(loaders).map(([file, load]) => [
		file.slice(file.lastIndexOf('/') + 1, -'.json'.length),
		load
	])
);

export const subdivisionCountries = [...byCode.keys()].sort();

export function hasSubdivisions(code: string | null | undefined): boolean {
	return Boolean(code && byCode.has(code));
}

const cache = new Map<string, Promise<SubdivisionCollection | null>>();

export function loadSubdivisions(code: string | null | undefined): Promise<SubdivisionCollection | null> {
	if (!code) return Promise.resolve(null);
	const load = byCode.get(code);
	if (!load) return Promise.resolve(null);

	const cached = cache.get(code);
	if (cached) return cached;

	const request = load()
		.then((url) => fetch(url))
		.then((res) => {
			if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
			return res.json() as Promise<SubdivisionCollection>;
		})
		.catch((error) => {
			console.warn(`Unidades administrativas de ${code} indisponíveis`, error);
			cache.delete(code);
			return null;
		});

	cache.set(code, request);
	return request;
}
