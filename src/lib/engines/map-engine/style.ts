import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { worldUrl } from '#lib/data/world';
import type { ResolvedTheme } from '#lib/theme.svelte';
import { graticuleGeoJSON } from './graticule';

export const MAP_LAYER = {
	fillA: 'countries-fill-a',
	fillB: 'countries-fill-b',
	statusFill: 'countries-status-fill',
	highlight: 'countries-highlight',
	focusFill: 'countries-focus-fill',
	dim: 'countries-dim',
	disputed: 'countries-disputed',
	rivers: 'rivers',
	lakes: 'lakes',
	coastline: 'coastline',
	border: 'countries-border',
	focusLine: 'countries-focus-line',
	selected: 'countries-selected',
	hover: 'countries-hover',
	statusLine: 'countries-status-line',
	citiesMajor: 'cities-major',
	citiesMinor: 'cities-minor',
	micro: 'microstate-dots',
	hillshade: 'terrain-hillshade',
	graticuleMinor: 'graticule-minor',
	graticuleMajor: 'graticule-major'
} as const;

export interface MapPalette {
	ocean: string;
	land: string;
	border: string;
	coast: string;
	graticule: string;
	water: string;
	river: string;
	clay: string;
	accent: string;
	text: string;
	halo: string;
}

export function mapPalette(theme: ResolvedTheme): MapPalette {
	return theme === 'dark'
		? {
				ocean: '#12100d',
				land: '#26231c',
				border: '#5f5748',
				coast: '#9b8c72',
				graticule: '#e8ddc9',
				water: '#16242a',
				river: '#5f8e99',
				clay: '#a58a5f',
				accent: '#d8a84e',
				text: '#e8ddc9',
				halo: '#12100d'
			}
		: {
				ocean: '#dfe9ee',
				land: '#e2d6bf',
				border: '#8f7c5c',
				coast: '#6b5940',
				graticule: '#3d3528',
				water: '#cfdde0',
				river: '#4f8ea1',
				clay: '#8b6a4c',
				accent: '#7a2f2f',
				text: '#2a241b',
				halo: '#f4efe4'
			};
}

export type MapProjection = 'globe' | 'flat';

export const EQUAL_EARTH_PROJECTION = 'mundivista:equal-earth';

export function createMapStyle(
	theme: ResolvedTheme = 'light',
	projection: MapProjection = 'globe'
): StyleSpecification {
	const p = mapPalette(theme);
	const dark = theme === 'dark';
	const layers: LayerSpecification[] = [
		{
			id: 'background',
			type: 'background',
			paint: { 'background-color': p.ocean }
		},
		{
			id: MAP_LAYER.graticuleMinor,
			type: 'line',
			source: 'graticule',
			filter: ['==', ['get', 'kind'], 'minor'],
			paint: {
				'line-color': p.graticule,
				'line-opacity': dark ? 0.05 : 0.07,
				'line-width': 0.55
			}
		},
		{
			id: MAP_LAYER.graticuleMajor,
			type: 'line',
			source: 'graticule',
			filter: ['==', ['get', 'kind'], 'major'],
			paint: {
				'line-color': p.graticule,
				'line-opacity': dark ? 0.11 : 0.13,
				'line-width': 0.7
			}
		},
		{
			id: MAP_LAYER.fillB,
			type: 'fill',
			source: 'countries',
			paint: {
				'fill-color': p.land,
				'fill-opacity': 0,
				'fill-opacity-transition': { duration: 340, delay: 0 },
				'fill-antialias': true
			}
		},
		{
			id: MAP_LAYER.fillA,
			type: 'fill',
			source: 'countries',
			paint: {
				'fill-color': p.land,
				'fill-opacity': 1,
				'fill-opacity-transition': { duration: 340, delay: 0 },
				'fill-antialias': true
			}
		},
		{
			id: MAP_LAYER.hillshade,
			type: 'hillshade',
			source: 'terrain-dem',
			layout: { visibility: 'none' },
			paint: {
				'hillshade-exaggeration': dark ? 0.72 : 0.62,
				'hillshade-shadow-color': dark ? '#050403' : '#4d412e',
				'hillshade-highlight-color': dark ? '#d8ccb2' : '#fffaf0',
				'hillshade-accent-color': dark ? '#4a3f2e' : '#b9a780'
			}
		},
		{
			id: MAP_LAYER.disputed,
			type: 'fill',
			source: 'countries',
			filter: ['==', ['get', 'disputed'], true],
			layout: { visibility: 'none' },
			paint: {
				'fill-pattern': 'disputed-hatch',
				'fill-opacity': dark ? 0.5 : 0.42
			}
		},
		{
			id: MAP_LAYER.statusFill,
			type: 'fill',
			source: 'countries',
			paint: {
				'fill-color': [
					'match',
					['coalesce', ['feature-state', 'status'], 'none'],
					'correct',
					'#4f8f6b',
					'wrong',
					'#b0503f',
					'transparent'
				],
				'fill-opacity': [
					'case',
					['==', ['coalesce', ['feature-state', 'status'], 'none'], 'none'],
					0,
					dark ? 0.3 : 0.36
				]
			}
		},
		{
			id: MAP_LAYER.highlight,
			type: 'fill',
			source: 'countries',
			paint: {
				'fill-color': p.accent,
				'fill-opacity': ['case', ['boolean', ['feature-state', 'highlight'], false], dark ? 0.3 : 0.26, 0]
			}
		},
		{
			id: MAP_LAYER.focusFill,
			type: 'fill',
			source: 'countries',
			paint: {
				'fill-color': p.clay,
				'fill-opacity': ['case', ['boolean', ['feature-state', 'focus'], false], dark ? 0.2 : 0.22, 0]
			}
		},
		{
			id: MAP_LAYER.dim,
			type: 'fill',
			source: 'countries',
			paint: {
				'fill-color': dark ? '#0a0907' : '#f4efe4',
				'fill-opacity': ['case', ['boolean', ['feature-state', 'inFocus'], true], 0, dark ? 0.62 : 0.68]
			}
		},
		{
			id: MAP_LAYER.border,
			type: 'line',
			source: 'countries',
			paint: {
				'line-color': p.border,
				'line-opacity': dark ? 0.72 : 0.82,
				'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.45, 4, 0.9, 7, 1.4]
			}
		},
		{
			id: MAP_LAYER.focusLine,
			type: 'line',
			source: 'countries',
			paint: {
				'line-color': p.clay,
				'line-opacity': ['case', ['boolean', ['feature-state', 'focus'], false], 0.95, 0],
				'line-width': 1.4
			}
		},
		{
			id: MAP_LAYER.selected,
			type: 'line',
			source: 'countries',
			paint: {
				'line-color': p.accent,
				'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0],
				'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.7, 5, 2.6]
			}
		},
		{
			id: MAP_LAYER.hover,
			type: 'line',
			source: 'countries',
			paint: {
				'line-color': p.accent,
				'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.85, 0],
				'line-width': 1.2
			}
		},
		{
			id: MAP_LAYER.statusLine,
			type: 'line',
			source: 'countries',
			paint: {
				'line-color': [
					'match',
					['coalesce', ['feature-state', 'status'], 'none'],
					'correct',
					'#4f8f6b',
					'wrong',
					'#b0503f',
					'transparent'
				],
				'line-opacity': [
					'case',
					['==', ['coalesce', ['feature-state', 'status'], 'none'], 'none'],
					0,
					1
				],
				'line-width': 2.2
			}
		},
		{
			id: MAP_LAYER.citiesMajor,
			type: 'circle',
			source: 'cities',
			layout: { visibility: 'none' },
			paint: {
				'circle-color': p.accent,
				'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 1.4, 3, 2.3, 6, 4],
				'circle-stroke-color': p.halo,
				'circle-stroke-width': 0.8,
				'circle-opacity': 0.9
			}
		},
		{
			id: MAP_LAYER.citiesMinor,
			type: 'circle',
			source: 'cities',
			layout: { visibility: 'none' },
			minzoom: 3.2,
			paint: {
				'circle-color': p.clay,
				'circle-radius': ['interpolate', ['linear'], ['zoom'], 3.2, 1.2, 6, 2.6],
				'circle-stroke-color': p.halo,
				'circle-stroke-width': 0.7,
				'circle-opacity': 0.8
			}
		},
		{
			id: MAP_LAYER.micro,
			type: 'circle',
			source: 'cities',
			filter: ['==', ['get', 'micro'], true],
			minzoom: 1.4,
			paint: {
				'circle-color': p.accent,
				'circle-radius': ['interpolate', ['linear'], ['zoom'], 1.4, 2, 5, 3.4],
				'circle-stroke-color': p.halo,
				'circle-stroke-width': 0.9,
				'circle-opacity': 0.9
			}
		}
	];

	return {
		version: 8,
		name: `Mundivista — atlas ${theme}`,
		projection: {
			type: projection === 'flat' ? EQUAL_EARTH_PROJECTION : 'globe'
		} as never,
		sources: {
			countries: {
				type: 'geojson',
				data: worldUrl,
				promoteId: 'code'
			},
			cities: {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			},
			'terrain-dem': {
				type: 'raster-dem',
				tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
				encoding: 'terrarium',
				tileSize: 256,
				maxzoom: 12,
				attribution: 'Elevação: AWS Terrain Tiles (SRTM, GMTED, NED e outras fontes públicas)'
			},
			graticule: {
				type: 'geojson',
				data: graticuleGeoJSON()
			}
		},
		layers,
		light: {
			anchor: 'viewport',
			color: dark ? '#f3e7cd' : '#fffaf0',
			intensity: dark ? 0.28 : 0.18
		},
		terrain: undefined
	} as StyleSpecification;
}
