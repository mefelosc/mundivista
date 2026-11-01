import type { LayerConfig, ResolvedLayer } from '#lib/configurations/map-layers';
import type { Locale } from './i18n';
import { indicatorUnit, localizeContinent } from './i18n-data';

type AnyLayer = LayerConfig | ResolvedLayer;

const LAYER_EN: Record<string, { label: string; short: string; description: string; note?: string }> = {
	standard: {
		label: 'Standard',
		short: 'Standard',
		description: 'Base map with borders, coastline and names. Choose a layer to read data.',
		note: 'No thematic layer active. Choose a layer in the filter to overlay data on the map.'
	},
	political: {
		label: 'Political',
		short: 'Political',
		description: 'Borders, capitals, neighbours, continents, units and states.',
		note: 'Colours only guide reading; they do not express political alignment.'
	},
	physical: {
		label: 'Physical',
		short: 'Physical',
		description: 'Rivers, lakes, coastline, relief and landforms.',
		note: 'Shaded relief comes from a public digital model (AWS Terrain Tiles) and depends on the network. Country colours do not represent elevation.'
	},
	population: {
		label: 'Demography',
		short: 'Population',
		description: 'Density, growth, life expectancy and cities.'
	},
	economy: {
		label: 'Economy',
		short: 'Economy',
		description: 'GDP, GDP per capita, trade and industry.'
	},
	geopolitics: {
		label: 'Geopolitics',
		short: 'Geopolitics',
		description: 'Alliances, blocs, organisations and disputed territories.',
		note: 'Choose a bloc to highlight its members. Hatching marks disputed status in Kosovo, Palestine, Western Sahara, the Falklands, Siachen and Chagos, without assigning sovereignty.'
	},
	history: {
		label: 'History',
		short: 'History',
		description: 'Dissolved federations, independence and name changes.',
		note: 'Historical snapshots use current polygons as an approximation. They are not period borders.'
	}
};

const PHYSICAL_LABELS_EN: Record<string, string> = {
	'Relevo sombreado': 'Shaded relief',
	Água: 'Water',
	Litoral: 'Coastline',
	Fronteira: 'Border'
};

export function localizedLayer(layer: AnyLayer, locale: Locale): AnyLayer {
	if (locale === 'pt') return layer;
	const meta = LAYER_EN[layer.id];
	if (!meta) return layer;
	const legend = layer.legend;
	let localizedLegend = legend;
	if (legend.type === 'gradient') {
		localizedLegend = {
			...legend,
			unit: layer.indicator ? indicatorUnit(layer.indicator, locale) : legend.unit,
			note: meta.note ?? legend.note
		};
	} else if (legend.type === 'categorical') {
		localizedLegend = {
			...legend,
			items: legend.items.map((item) => ({
				...item,
				label: PHYSICAL_LABELS_EN[item.label] ?? localizeContinent(item.label, 'en')
			})),
			note: meta.note ?? legend.note
		};
	} else {
		localizedLegend = { ...legend, note: meta.note ?? legend.note };
	}
	return {
		...layer,
		label: meta.label,
		short: meta.short,
		description: meta.description,
		legend: localizedLegend
	};
}
