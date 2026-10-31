import type { CardSection, IndicatorKey, LayerId } from '#lib/types';
import type { ResolvedTheme } from '#lib/theme.svelte';

export interface LegendSwatch {
	label: string;
	color: string;
}

export interface LayerColors {
	/** Paleta do coroplético, do menor para o maior valor. */
	palette: string[];
	noData: string;
	land: { fill: string; stroke: string; hover: string };
	/** Tints categóricos (continentes, feições). */
	tints?: LegendSwatch[];
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
	sections: CardSection[];
	/** Organizações que podem ser destacadas nesta camada. */
	blocs?: string[];
	showPhysical?: boolean;
	showCities?: boolean;
	showCoastline?: boolean;
	/** Hachura em territórios com estatuto disputado. */
	showDisputed?: boolean;
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
	colors: { light: LayerColors; dark: LayerColors };
}

export type ResolvedLayer = Omit<LayerConfig, 'colors' | 'legend'> &
	LayerColors & {
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
	};

const CONTINENTS_PT = [
	'América do Sul',
	'América do Norte',
	'Europa',
	'África',
	'Ásia',
	'Oceania'
] as const;

const POLITICAL_LIGHT: LegendSwatch[] = [
	{ label: 'América do Sul', color: '#d5c095' },
	{ label: 'América do Norte', color: '#e8dcc2' },
	{ label: 'Europa', color: '#cbb692' },
	{ label: 'África', color: '#e4cc92' },
	{ label: 'Ásia', color: '#dcc8a2' },
	{ label: 'Oceania', color: '#d8d3b4' }
];

const POLITICAL_DARK: LegendSwatch[] = [
	{ label: 'América do Sul', color: '#2a2b22' },
	{ label: 'América do Norte', color: '#2e2c22' },
	{ label: 'Europa', color: '#332c28' },
	{ label: 'África', color: '#332a1e' },
	{ label: 'Ásia', color: '#2b2e25' },
	{ label: 'Oceania', color: '#2d2e26' }
];

export const mapLayers: LayerConfig[] = [
	{
		id: 'political',
		index: '01',
		label: 'Político',
		short: 'Político',
		description: 'Fronteiras, capitais, vizinhos e continentes.',
		icon: 'border',
		sections: ['identity', 'neighbors'],
		showCoastline: true,
		legend: {
			type: 'categorical',
			items: POLITICAL_LIGHT,
			note: 'Cores apenas orientam a leitura; não expressam alinhamento político.'
		},
		colors: {
			light: {
				palette: ['#d5c095', '#e8dcc2', '#cbb692', '#e4cc92', '#dcc8a2', '#d8d3b4'],
				noData: '#e2d6bf',
				land: { fill: '#e2d6bf', stroke: '#8a7756', hover: '#d3c2a2' },
				tints: POLITICAL_LIGHT
			},
			dark: {
				palette: ['#2a2b22', '#2e2c22', '#332c28', '#332a1e', '#2b2e25', '#2d2e26'],
				noData: '#26231c',
				land: { fill: '#26231c', stroke: '#6d6250', hover: '#352f24' },
				tints: POLITICAL_DARK
			}
		}
	},
	{
		id: 'physical',
		index: '02',
		label: 'Físico',
		short: 'Físico',
		description: 'Rios, lagos, litoral, relevo e formações.',
		icon: 'terrain',
		sections: ['identity', 'environment', 'neighbors'],
		showPhysical: true,
		showCoastline: true,
		legend: {
			type: 'categorical',
			items: [
				{ label: 'Relevo sombreado', color: '#8f7355' },
				{ label: 'Água', color: '#4f8ea1' },
				{ label: 'Litoral', color: '#6b5940' },
				{ label: 'Fronteira', color: '#a1906f' }
			],
			note: 'O relevo sombreado vem de um modelo digital público (AWS Terrain Tiles) e depende da rede. As cores dos países não representam elevação.'
		},
		colors: {
			light: {
				palette: ['#c8d2b4', '#b6c29c', '#c8b98c', '#c2a172', '#a9855f', '#8b6a4c'],
				noData: '#d8d1bc',
				land: { fill: '#d8d1bc', stroke: '#8d7d61', hover: '#cabf9f' }
			},
			dark: {
				palette: ['#232b22', '#2b3527', '#3b3b26', '#4a3d26', '#5c4730', '#6f5136'],
				noData: '#20241d',
				land: { fill: '#20241d', stroke: '#6e6550', hover: '#2f3527' }
			}
		}
	},
	{
		id: 'population',
		index: '03',
		label: 'Demografia',
		short: 'População',
		description: 'Densidade, crescimento, expectativa de vida e cidades.',
		icon: 'density',
		indicator: 'popDensity',
		scale: 'log',
		showCities: true,
		showCoastline: true,
		sections: ['demography', 'identity', 'neighbors'],
		legend: {
			type: 'gradient',
			low: 'Menos denso',
			high: 'Mais denso',
			unit: 'hab/km²'
		},
		colors: {
			light: {
				palette: ['#e6e0d0', '#c6d6cb', '#9bbfb4', '#6b9f96', '#3c7b77', '#1c5759'],
				noData: '#e0d9c8',
				land: { fill: '#e0d9c8', stroke: '#8d7d61', hover: '#cfc6ae' }
			},
			dark: {
				palette: ['#1c211d', '#23403b', '#2e625c', '#44867c', '#68a99a', '#9ed3c2'],
				noData: '#211f19',
				land: { fill: '#211f19', stroke: '#6d6250', hover: '#302d24' }
			}
		}
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
		showCoastline: true,
		sections: ['economy', 'identity', 'neighbors'],
		legend: {
			type: 'gradient',
			low: 'Menor PIB per capita',
			high: 'Maior PIB per capita',
			unit: 'US$ correntes'
		},
		colors: {
			light: {
				palette: ['#e9e1ce', '#d8c49c', '#c4a268', '#a97c42', '#855a25', '#5f3f13'],
				noData: '#e2dac8',
				land: { fill: '#e2dac8', stroke: '#8d7d61', hover: '#d1c5a9' }
			},
			dark: {
				palette: ['#211d16', '#3c301c', '#5d4726', '#826134', '#ac8946', '#d6b268'],
				noData: '#201d16',
				land: { fill: '#201d16', stroke: '#6d6250', hover: '#2e281c' }
			}
		}
	},
	{
		id: 'geopolitics',
		index: '05',
		label: 'Geopolítica',
		short: 'Geopolítica',
		description: 'Alianças, blocos, organizações e territórios disputados.',
		icon: 'alliance',
		showCoastline: true,
		showDisputed: true,
		sections: ['geopolitics', 'identity', 'neighbors'],
		blocs: ['nato', 'eu', 'brics', 'opec', 'g20', 'asean'],
		legend: {
			type: 'none',
			note: 'Escolha um bloco para destacar os membros. Hachura marca estatuto disputado em Kosovo, Palestina, Saara Ocidental, Malvinas, Siachen e Chagos, sem atribuir soberania.'
		},
		colors: {
			light: {
				palette: ['#e2d9c6'],
				noData: '#e2d9c6',
				land: { fill: '#e2d9c6', stroke: '#8d7d61', hover: '#d2c6ad' }
			},
			dark: {
				palette: ['#24211a'],
				noData: '#24211a',
				land: { fill: '#24211a', stroke: '#6d6250', hover: '#332e23' }
			}
		}
	},
	{
		id: 'history',
		index: '06',
		label: 'História',
		short: 'História',
		description: 'Federações dissolvidas, independências e mudanças de nome.',
		icon: 'timeline',
		showCoastline: true,
		sections: ['history', 'geopolitics', 'identity'],
		blocs: ['ussr', 'yugoslavia', 'eu', 'nato'],
		legend: {
			type: 'none',
			note: 'Recortes históricos usam os polígonos atuais como aproximação. Não são fronteiras do período.'
		},
		colors: {
			light: {
				palette: ['#e5d9c2'],
				noData: '#e5d9c2',
				land: { fill: '#e5d9c2', stroke: '#8d7d61', hover: '#d6c6a8' }
			},
			dark: {
				palette: ['#251f18'],
				noData: '#251f18',
				land: { fill: '#251f18', stroke: '#6d6250', hover: '#352c20' }
			}
		}
	}
];

export const layerById = new Map(mapLayers.map((l) => [l.id, l]));
export const defaultLayer = mapLayers[0];

export function getLayer(id: LayerId, theme: ResolvedTheme = 'light'): ResolvedLayer {
	const base = layerById.get(id) ?? defaultLayer;
	const colors = base.colors[theme];
	const legend =
		base.legend.type === 'categorical' && colors.tints
			? { ...base.legend, items: colors.tints }
			: base.legend;
	return { ...base, ...colors, legend };
}

export const layerContinents = CONTINENTS_PT;
