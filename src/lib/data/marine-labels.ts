import raw from './generated/marine-labels.json';

export interface MarineLabel {
	name: string;
	lat: number;
	lng: number;
	kind: string;
	minZoom: number;
	priority: number;
}

const data = raw as unknown as { retrieved: string; labels: MarineLabel[] };

/** Nomes de oceanos, mares, baías e golfos do Natural Earth (1:50m). */
export const marineLabels: MarineLabel[] = data.labels;
export const marineRetrieved = data.retrieved;
