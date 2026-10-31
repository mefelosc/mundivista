import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { worldUrl } from '#lib/data/world';
import { graticuleGeoJSON } from './graticule';

export const MAP_LAYER = {
	fill: 'countries-fill',
	statusFill: 'countries-status-fill',
	highlight: 'countries-highlight',
	focusFill: 'countries-focus-fill',
	dim: 'countries-dim',
	rivers: 'rivers',
	lakes: 'lakes',
	border: 'countries-border',
	focusLine: 'countries-focus-line',
	selected: 'countries-selected',
	hover: 'countries-hover',
	statusLine: 'countries-status-line',
	graticuleMinor: 'graticule-minor',
	graticuleMajor: 'graticule-major'
} as const;

const OCEAN = '#070b12';

export function createMapStyle(): StyleSpecification {
	const layers: LayerSpecification[] = [
		{
			id: 'background',
			type: 'background',
			paint: { 'background-color': OCEAN }
		},
		{
			id: MAP_LAYER.graticuleMinor,
			type: 'line',
			source: 'graticule',
			filter: ['==', ['get', 'kind'], 'minor'],
			paint: {
				'line-color': '#ffffff',
				'line-opacity': 0.035,
				'line-width': 0.6
			}
		},
		{
			id: MAP_LAYER.graticuleMajor,
			type: 'line',
			source: 'graticule',
			filter: ['==', ['get', 'kind'], 'major'],
			paint: {
				'line-color': '#ffffff',
				'line-opacity': 0.075,
				'line-width': 0.7
			}
		},
		{
			id: MAP_LAYER.fill,
			type: 'fill',
			source: 'countries',
			paint: {
				'fill-color': '#18222f',
				'fill-opacity': 1,
				'fill-antialias': true
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
					'#4ec9a0',
					'wrong',
					'#f0716f',
					'transparent'
				],
				'fill-opacity': [
					'case',
					['==', ['coalesce', ['feature-state', 'status'], 'none'], 'none'],
					0,
					0.22
				]
			}
		},
		{
			id: MAP_LAYER.highlight,
			type: 'fill',
			source: 'countries',
			paint: {
				'fill-color': '#e6b45c',
				'fill-opacity': [
					'case',
					['boolean', ['feature-state', 'highlight'], false],
					0.26,
					0
				]
			}
		},
		{
			id: MAP_LAYER.focusFill,
			type: 'fill',
			source: 'countries',
			paint: {
				'fill-color': '#6fb7ff',
				'fill-opacity': ['case', ['boolean', ['feature-state', 'focus'], false], 0.16, 0]
			}
		},
		{
			id: MAP_LAYER.dim,
			type: 'fill',
			source: 'countries',
			paint: {
				'fill-color': '#05080d',
				'fill-opacity': [
					'case',
					['boolean', ['feature-state', 'inFocus'], true],
					0,
					0.58
				]
			}
		},
		{
			id: MAP_LAYER.border,
			type: 'line',
			source: 'countries',
			paint: {
				'line-color': '#2c3a4a',
				'line-opacity': 0.95,
				'line-width': [
					'interpolate',
					['linear'],
					['zoom'],
					1,
					0.5,
					4,
					1.1,
					7,
					1.8
				]
			}
		},
		{
			id: MAP_LAYER.focusLine,
			type: 'line',
			source: 'countries',
			paint: {
				'line-color': '#6fb7ff',
				'line-opacity': ['case', ['boolean', ['feature-state', 'focus'], false], 0.9, 0],
				'line-width': 1.6
			}
		},
		{
			id: MAP_LAYER.selected,
			type: 'line',
			source: 'countries',
			paint: {
				'line-color': '#f0cd8e',
				'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0],
				'line-width': [
					'interpolate',
					['linear'],
					['zoom'],
					1,
					1.6,
					5,
					2.6
				]
			}
		},
		{
			id: MAP_LAYER.hover,
			type: 'line',
			source: 'countries',
			paint: {
				'line-color': '#a5d3ff',
				'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0],
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
					'#4ec9a0',
					'wrong',
					'#f0716f',
					'transparent'
				],
				'line-opacity': [
					'case',
					['==', ['coalesce', ['feature-state', 'status'], 'none'], 'none'],
					0,
					1
				],
				'line-width': 2.4
			}
		}
	];

	return {
		version: 8,
		name: 'Mundivista — base',
		sources: {
			countries: {
				type: 'geojson',
				data: worldUrl,
				promoteId: 'code'
			},
			graticule: {
				type: 'geojson',
				data: graticuleGeoJSON()
			}
		},
		layers
	} as StyleSpecification;
}
