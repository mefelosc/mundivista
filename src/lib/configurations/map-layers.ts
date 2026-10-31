import type { CardSection, IndicatorKey, LayerId } from '#lib/types';

export interface LegendSwatch {
	label: string;
	color: string;
}

export interface LayerConfig {
	id: LayerId;
	index: string;
	label: string;
	short: string;
	description: string;
	icon: string;
	/** Indicador usado no coroplético. Ausente = camada sem coroplético. */
	indicator?: IndicatorKey;
	scale?: 'log' | 'linear';
	palette?: string[];
	noData: string;
	sections: CardSection[];
	/** Organizações que podem ser destacadas nesta camada. */
	blocs?: string[];
	showPhysical?: boolean;
	legend:
		| {
				type: 'gradient';
				low: string;
				high: string;
				unit: string;
				note?: string;
		  }
		| {
				type: 'categorical';
				items: LegendSwatch[];
				note?: string;
		  }
		| {
				type: 'none';
				note?: string;
		  };
	land: { fill: string; stroke: string; hover: string };
}

const POLITICAL_TINTS: LegendSwatch[] = [
	{ label: 'América do Sul', color: '#1d303b' },
	{ label: 'América do Norte', color: '#223040' },
	{ label: 'Europa', color: '#2a2f42' },
	{ label: 'África', color: '#2e2a22' },
	{ label: 'Ásia', color: '#1f3132' },
	{ label: 'Oceania', color: '#263033' }
];

export const mapLayers: LayerConfig[] = [
	{
		id: 'political',
		index: '01',
		label: 'Político',
		short: 'Político',
		description: 'Fronteiras, capitais, vizinhos e continentes.',
		icon: 'globe',
		noData: '#18222f',
		sections: ['identity', 'neighbors'],
		legend: {
			type: 'categorical',
			items: POLITICAL_TINTS,
			note: 'Cores apenas orientam a leitura; não expressam alinhamento político.'
		},
		land: { fill: '#18222f', stroke: '#2c3a4a', hover: '#243448' }
	},
	{
		id: 'physical',
		index: '02',
		label: 'Físico',
		short: 'Físico',
		description: 'Rios, lagos, relevo e grandes formações.',
		icon: 'terrain',
		noData: '#1a2118',
		sections: ['identity', 'environment', 'neighbors'],
		showPhysical: true,
		legend: {
			type: 'categorical',
			items: [
				{ label: 'Rios e lagos', color: '#3f7f9c' },
				{ label: 'Relevo', color: '#b9a47a' }
			],
			note: 'Relevo simplificado por rótulos curados; não é um modelo digital de elevação.'
		},
		land: { fill: '#1a2118', stroke: '#2b3626', hover: '#263020' }
	},
	{
		id: 'population',
		index: '03',
		label: 'Demografia',
		short: 'População',
		description: 'Densidade, crescimento, expectativa de vida e urbanização.',
		icon: 'users',
		indicator: 'popDensity',
		scale: 'log',
		palette: ['#101a24', '#173247', '#1f5170', '#2f7fa3', '#56b3cf', '#9fe6f4'],
		noData: '#111820',
		sections: ['demography', 'identity', 'neighbors'],
		legend: {
			type: 'gradient',
			low: 'Menos denso',
			high: 'Mais denso',
			unit: 'hab/km²'
		},
		land: { fill: '#111a25', stroke: '#2b3a4a', hover: '#1b2a3a' }
	},
	{
		id: 'economy',
		index: '04',
		label: 'Economia',
		short: 'Economia',
		description: 'PIB, PIB per capita, comércio e indústria.',
		icon: 'coins',
		indicator: 'gdpPerCapita',
		scale: 'log',
		palette: ['#171410', '#3a2f1a', '#6b5424', '#a17d33', '#d4a94f', '#f3d792'],
		noData: '#15130f',
		sections: ['economy', 'identity', 'neighbors'],
		legend: {
			type: 'gradient',
			low: 'Menor PIB per capita',
			high: 'Maior PIB per capita',
			unit: 'US$ correntes'
		},
		land: { fill: '#15130f', stroke: '#3a3226', hover: '#241f17' }
	},
	{
		id: 'geopolitics',
		index: '05',
		label: 'Geopolítica',
		short: 'Geopolítica',
		description: 'Alianças, blocos econômicos e organizações.',
		icon: 'shield',
		noData: '#161d26',
		sections: ['geopolitics', 'identity', 'neighbors'],
		blocs: ['nato', 'eu', 'brics', 'opec', 'g20', 'asean'],
		legend: {
			type: 'none',
			note: 'Escolha um bloco para destacar os membros no mapa.'
		},
		land: { fill: '#161d26', stroke: '#2b3948', hover: '#202c3a' }
	},
	{
		id: 'history',
		index: '06',
		label: 'História',
		short: 'História',
		description: 'Federações dissolvidas, independências e mudanças de nome.',
		icon: 'clock',
		noData: '#1c1916',
		sections: ['history', 'geopolitics', 'identity'],
		blocs: ['ussr', 'yugoslavia', 'eu', 'nato'],
		legend: {
			type: 'none',
			note: 'Camadas históricas mostram fronteiras e blocos de outros períodos.'
		},
		land: { fill: '#1c1916', stroke: '#3a3229', hover: '#28231d' }
	}
];

export const layerById = new Map(mapLayers.map((l) => [l.id, l]));
export const defaultLayer = mapLayers[0];

export function getLayer(id: LayerId): LayerConfig {
	return layerById.get(id) ?? defaultLayer;
}
