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
	/** Unidades administrativas de primeiro nível ao selecionar um país. */
	showSubdivisions?: boolean;
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
	{ label: 'América do Sul', color: '#c3dccb' },
	{ label: 'América do Norte', color: '#cfdeea' },
	{ label: 'Europa', color: '#ddd2e8' },
	{ label: 'África', color: '#e6cdd7' },
	{ label: 'Ásia', color: '#dce6c4' },
	{ label: 'Oceania', color: '#c7e3dd' }
];

const POLITICAL_DARK: LegendSwatch[] = [
	{ label: 'América do Sul', color: '#203a2d' },
	{ label: 'América do Norte', color: '#1f2c3a' },
	{ label: 'Europa', color: '#302a3a' },
	{ label: 'África', color: '#3a2832' },
	{ label: 'Ásia', color: '#303a24' },
	{ label: 'Oceania', color: '#1f3a38' }
];

/** Mapa base: sem camada temática, sem coroplético. É o estado inicial do atlas. */
export const standardLayer: LayerConfig = {
	id: 'standard',
	index: '00',
	label: 'Padrão',
	short: 'Padrão',
	description: 'Mapa base com fronteiras, litoral e nomes. Escolha uma camada para ler dados.',
	icon: 'globe',
	sections: ['identity', 'neighbors'],
	showCoastline: true,
	legend: {
		type: 'none',
		note: 'Nenhuma camada temática ativa. Escolha uma camada no filtro para sobrepor dados ao mapa.'
	},
	colors: {
		light: {
			palette: ['#e4e9dd'],
			noData: '#e4e9dd',
			land: { fill: '#e4e9dd', stroke: '#7b8c80', hover: '#d9e2d8' }
		},
		dark: {
			palette: ['#1a221c'],
			noData: '#1a221c',
			land: { fill: '#1a221c', stroke: '#66786c', hover: '#26332a' }
		}
	}
};

export const mapLayers: LayerConfig[] = [
	{
		id: 'political',
		index: '01',
		label: 'Político',
		short: 'Político',
		description: 'Fronteiras, capitais, vizinhos, continentes, unidades e estados.',
		icon: 'border',
		sections: ['identity', 'neighbors'],
		showCoastline: true,
		showSubdivisions: true,
		legend: {
			type: 'categorical',
			items: POLITICAL_LIGHT,
			note: 'Cores apenas orientam a leitura; não expressam alinhamento político.'
		},
		colors: {
			light: {
				palette: ['#c3dccb', '#cfdeea', '#ddd2e8', '#e6cdd7', '#dce6c4', '#c7e3dd'],
				noData: '#e4e9dd',
				land: { fill: '#e4e9dd', stroke: '#7b8c80', hover: '#d9e2d8' },
				tints: POLITICAL_LIGHT
			},
			dark: {
				palette: ['#203a2d', '#1f2c3a', '#302a3a', '#3a2832', '#303a24', '#1f3a38'],
				noData: '#1a221c',
				land: { fill: '#1a221c', stroke: '#66786c', hover: '#26332a' },
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
				{ label: 'Relevo sombreado', color: '#86a37a' },
				{ label: 'Água', color: '#4f8894' },
				{ label: 'Litoral', color: '#5c6f62' },
				{ label: 'Fronteira', color: '#a7b6a9' }
			],
			note: 'O relevo sombreado vem de um modelo digital público (AWS Terrain Tiles) e depende da rede. As cores dos países não representam elevação.'
		},
		colors: {
			light: {
				palette: ['#dbe6cf', '#c6d8b6', '#c2d4a8', '#a8c095', '#87a87b', '#678c66'],
				noData: '#e0e7d8',
				land: { fill: '#e4e9dd', stroke: '#7b8c80', hover: '#d5e0d2' }
			},
			dark: {
				palette: ['#1b2b20', '#243a28', '#2e4a31', '#3e5c3b', '#537046', '#6d8a56'],
				noData: '#1a221c',
				land: { fill: '#1a221c', stroke: '#66786c', hover: '#24322a' }
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
				palette: ['#e5efe9', '#c5ded5', '#9ac8ba', '#68a798', '#3d8478', '#1e625a'],
				noData: '#e0e7df',
				land: { fill: '#e4e9dd', stroke: '#7b8c80', hover: '#d5e0d2' }
			},
			dark: {
				palette: ['#18231d', '#1e352d', '#294a40', '#35695c', '#4f9080', '#7cc0ad'],
				noData: '#1a221c',
				land: { fill: '#1a221c', stroke: '#66786c', hover: '#24322a' }
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
				palette: ['#f0e8ec', '#e1cbd4', '#cda4b3', '#b67c92', '#93566f', '#6b344b'],
				noData: '#e6e2e0',
				land: { fill: '#e4e9dd', stroke: '#7b8c80', hover: '#d5e0d2' }
			},
			dark: {
				palette: ['#22181d', '#33222a', '#4a2f3a', '#653e4f', '#87566b', '#b07f95'],
				noData: '#1a221c',
				land: { fill: '#1a221c', stroke: '#66786c', hover: '#24322a' }
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
				palette: ['#e4e9dd'],
				noData: '#e4e9dd',
				land: { fill: '#e4e9dd', stroke: '#7b8c80', hover: '#d9e2d8' }
			},
			dark: {
				palette: ['#1a221c'],
				noData: '#1a221c',
				land: { fill: '#1a221c', stroke: '#66786c', hover: '#26332a' }
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
				palette: ['#e4e9dd'],
				noData: '#e4e9dd',
				land: { fill: '#e4e9dd', stroke: '#7b8c80', hover: '#d9e2d8' }
			},
			dark: {
				palette: ['#1a221c'],
				noData: '#1a221c',
				land: { fill: '#1a221c', stroke: '#66786c', hover: '#26332a' }
			}
		}
	}
];

export const layerById = new Map([standardLayer, ...mapLayers].map((l) => [l.id, l]));
export const defaultLayer = standardLayer;

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
