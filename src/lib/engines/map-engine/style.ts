import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { worldUrl } from '#lib/data/world';
import type { ResolvedTheme } from '#lib/theme.svelte';
import { graticuleGeoJSON } from './graticule';
import { FLAT_ZOOM_OFFSET, oceanCollection, wrapCollection } from './wrap';

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
	subdivisionsFill: 'subdivisions-fill',
	subdivisionsLine: 'subdivisions-line',
	subdivisionActiveFill: 'subdivision-active-fill',
	subdivisionActiveLine: 'subdivision-active-line',
	focusLine: 'countries-focus-line',
	selected: 'countries-selected',
	hover: 'countries-hover',
	statusLine: 'countries-status-line',
	citiesMajor: 'cities-major',
	citiesMinor: 'cities-minor',
	micro: 'microstate-dots',
	hits: 'country-hit-points',
	hillshade: 'terrain-hillshade',
	ocean: 'world-ocean',
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
				ocean: '#101820',
				land: '#1a221c',
				border: '#66786c',
				coast: '#9eb1a3',
				graticule: '#e6eee8',
				water: '#16262b',
				river: '#5f95a1',
				clay: '#b19bc0',
				accent: '#d0a2b5',
				text: '#e6eee8',
				halo: '#0f1411'
			}
		: {
				ocean: '#dfeaef',
				land: '#e4e9dd',
				border: '#7b8c80',
				coast: '#5c6f62',
				graticule: '#32443a',
				water: '#cfe1e4',
				river: '#4f8894',
				clay: '#7d6a86',
				accent: '#7a4963',
				text: '#22322a',
				halo: '#f3f6f2'
			};
}

export type MapProjection = 'globe' | 'flat';

export const FLAT_PROJECTION = 'mundivista:flat';

export function createMapStyle(
	theme: ResolvedTheme = 'light',
	projection: MapProjection = 'flat'
): StyleSpecification {
	const p = mapPalette(theme);
	const dark = theme === 'dark';
	const flat = projection === 'flat';
	const zoomOffset = flat ? FLAT_ZOOM_OFFSET : 0;
	const layers: LayerSpecification[] = [
		{
			// Transparente: fora do mundo aparece o espaço (globo) ou a mesa (2D).
			id: 'background',
			type: 'background',
			paint: { 'background-color': 'rgba(0, 0, 0, 0)' }
		},
		{
			id: MAP_LAYER.ocean,
			type: 'fill',
			source: 'world-ocean',
			paint: { 'fill-color': p.ocean, 'fill-antialias': true }
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
				'hillshade-shadow-color': dark ? '#050806' : '#3f4c3f',
				'hillshade-highlight-color': dark ? '#dbe6dc' : '#f8fbf5',
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
			id: MAP_LAYER.subdivisionsFill,
			type: 'fill',
			source: 'subdivisions',
			layout: { visibility: 'none' },
			paint: {
				'fill-color': p.clay,
				'fill-opacity': dark ? 0.16 : 0.1
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
			id: MAP_LAYER.subdivisionsLine,
			type: 'line',
			source: 'subdivisions',
			layout: { visibility: 'none' },
			paint: {
				'line-color': p.border,
				'line-opacity': dark ? 0.85 : 0.9,
				'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.5, 4, 0.9, 7, 1.3]
			}
		},
		{
			id: MAP_LAYER.subdivisionActiveFill,
			type: 'fill',
			source: 'subdivisions',
			filter: ['==', ['get', 'id'], '__none__'],
			paint: {
				'fill-color': p.accent,
				'fill-opacity': dark ? 0.24 : 0.18
			}
		},
		{
			id: MAP_LAYER.subdivisionActiveLine,
			type: 'line',
			source: 'subdivisions',
			filter: ['==', ['get', 'id'], '__none__'],
			paint: {
				'line-color': p.accent,
				'line-opacity': 0.95,
				'line-width': 1.8
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
			minzoom: 3.2 + zoomOffset,
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
			minzoom: 1.4 + zoomOffset,
			paint: {
				'circle-color': p.accent,
				'circle-radius': ['interpolate', ['linear'], ['zoom'], 1.4, 2, 5, 3.4],
				'circle-stroke-color': p.halo,
				'circle-stroke-width': 0.9,
				'circle-opacity': 0.9
			}
		},
		{
			id: MAP_LAYER.hits,
			type: 'circle',
			source: 'country-hits',
			paint: {
				'circle-radius': 1,
				'circle-color': '#000000',
				'circle-opacity': 0.01
			}
		}
	];

	return {
		version: 8,
		name: `Mundivista — atlas ${theme}`,
		projection: {
			type: projection === 'flat' ? FLAT_PROJECTION : 'globe'
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
			subdivisions: {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] },
				promoteId: 'id'
			},
			'country-hits': {
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
			'world-ocean': {
				type: 'geojson',
				data: oceanCollection(flat)
			},
			graticule: {
				type: 'geojson',
				data: flat ? wrapCollection(graticuleGeoJSON()) : graticuleGeoJSON()
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
