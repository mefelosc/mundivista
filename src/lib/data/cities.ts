import citiesRaw from './generated/cities.json';
import type { Feature, FeatureCollection, Point } from 'geojson';

export interface CityProps {
	name: string;
	nameEn: string;
	pop: number;
	code: string;
	capital: boolean;
	minZoom: number;
}

const data = citiesRaw as unknown as {
	retrieved: string;
	cities: FeatureCollection<Point, CityProps>;
};

/** Cidades principais do Natural Earth (pontos populacionais, não manchas urbanas). */
export const cityPoints: Feature<Point, CityProps>[] = data.cities.features;
export const citiesRetrieved = data.retrieved;
