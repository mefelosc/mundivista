<script lang="ts">
	import { onMount } from 'svelte';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import type { ExpressionSpecification, Map as MlMap, MapMouseEvent, StyleSpecification } from 'maplibre-gl';
	import { countries, getCountry } from '#lib/data/countries';
	import { physicalLabels } from '#lib/data/physical-labels';
	import { physicalUrl } from '#lib/data/world';
	import { capitalInPortuguese } from '#lib/data/capitals-pt';
	import { buildChoropleth, withNoData } from '#lib/engines/map-engine/choropleth';
	import { createMapStyle, MAP_LAYER } from '#lib/engines/map-engine/style';
	import type { LayerConfig } from '#lib/configurations/map-layers';

	interface Props {
		layer: LayerConfig;
		selected?: string | null;
		highlight?: string[];
		focus?: string[] | null;
		status?: Record<string, 'correct' | 'wrong'>;
		interactive?: boolean;
		showLabels?: boolean;
		onselect?: (code: string) => void;
		onhover?: (code: string | null) => void;
		onview?: (view: { lat: number; lng: number; zoom: number }) => void;
		class?: string;
	}

	let {
		layer,
		selected = null,
		highlight = [],
		focus = null,
		status = {},
		interactive = true,
		showLabels = true,
		onselect,
		onhover,
		onview,
		class: className = ''
	}: Props = $props();

	let container: HTMLDivElement;
	let labelsEl: HTMLDivElement;
	let map: MlMap | null = null;
	let ready = $state(false);
	let failed = $state(false);
	let hovered = $state<string | null>(null);

	let labelEntries: {
		el: HTMLElement;
		kind: 'country' | 'capital' | 'physical';
		code?: string;
		lat: number;
		lng: number;
		minZoom: number;
		priority: number;
		text: string;
	}[] = [];

	const measureCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
	const measureCtx = measureCanvas?.getContext('2d') ?? null;
	const widthCache = new Map<string, number>();

	function measure(text: string, font: string): number {
		const key = `${font}|${text}`;
		const cached = widthCache.get(key);
		if (cached !== undefined) return cached;
		if (!measureCtx) return text.length * 6;
		measureCtx.font = font;
		const w = measureCtx.measureText(text).width;
		widthCache.set(key, w);
		return w;
	}

	const CONTINENT_MATCH = [
		'match',
		['get', 'continent'],
		'América do Sul',
		'#1d303b',
		'América do Norte',
		'#223040',
		'Europa',
		'#2a2f42',
		'África',
		'#2e2a22',
		'Ásia',
		'#1f3132',
		'Oceania',
		'#263033',
		'#18222f'
	] as unknown as ExpressionSpecification;

	function applySelected() {
		if (!map || !ready) return;
		for (const country of countries) {
			map!.setFeatureState(
				{ source: 'countries', id: country.code },
				{ selected: country.code === selected }
			);
		}
	}

	function applyHighlight() {
		if (!map || !ready) return;
		const set = new Set(highlight);
		for (const country of countries) {
			map!.setFeatureState(
				{ source: 'countries', id: country.code },
				{ highlight: set.has(country.code) }
			);
		}
	}

	function applyFocus() {
		if (!map || !ready) return;
		const set = focus ? new Set(focus) : null;
		for (const country of countries) {
			map!.setFeatureState(
				{ source: 'countries', id: country.code },
				{ focus: set ? set.has(country.code) : false, inFocus: set ? set.has(country.code) : true }
			);
		}
	}

	let previousStatus = new Set<string>();

	function applyStatus() {
		if (!map || !ready) return;
		for (const code of previousStatus) {
			map!.setFeatureState({ source: 'countries', id: code }, { status: 'none' });
		}
		previousStatus = new Set(Object.keys(status));
		for (const [code, value] of Object.entries(status)) {
			map!.setFeatureState({ source: 'countries', id: code }, { status: value });
		}
	}

	function applyLayer() {
		if (!map || !ready) return;

		if (layer.indicator) {
			const values = countries
				.map((c) => c.indicators[layer.indicator!]?.v)
				.filter((v): v is number => typeof v === 'number');
			const scale = buildChoropleth(layer, values);
			for (const country of countries) {
				const value = country.indicators[layer.indicator];
				map!.setFeatureState(
					{ source: 'countries', id: country.code },
					value ? { has: true, value: value.v } : { has: false, value: 0 }
				);
			}
			if (scale) {
				map!.setPaintProperty(
					MAP_LAYER.fill,
					'fill-color',
					withNoData(scale.expression, layer.noData)
				);
			} else {
				map!.setPaintProperty(MAP_LAYER.fill, 'fill-color', layer.noData);
			}
		} else if (layer.id === 'political') {
			map!.setPaintProperty(MAP_LAYER.fill, 'fill-color', CONTINENT_MATCH);
		} else {
			map!.setPaintProperty(MAP_LAYER.fill, 'fill-color', layer.land.fill);
		}

		map!.setPaintProperty(MAP_LAYER.border, 'line-color', layer.land.stroke);
		for (const id of [MAP_LAYER.rivers, MAP_LAYER.lakes]) {
			if (map!.getLayer(id)) {
				map!.setLayoutProperty(id, 'visibility', layer.showPhysical ? 'visible' : 'none');
			}
		}
	}

	function labelClass(kind: string): string {
		if (kind === 'country') return 'map-label';
		if (kind === 'capital') return 'map-capital';
		return 'map-physical';
	}

	function buildLabels() {
		if (!labelsEl) return;
		labelsEl.replaceChildren();
		labelEntries = [];

		const make = (text: string, kind: 'country' | 'capital' | 'physical', code?: string) => {
			const el = document.createElement(kind === 'country' ? 'button' : 'span');
			if (kind === 'country') {
				(el as HTMLButtonElement).type = 'button';
				(el as HTMLButtonElement).tabIndex = -1;
				el.setAttribute('aria-label', text);
				el.addEventListener('click', (event) => {
					event.stopPropagation();
					if (code) onselect?.(code);
				});
			}
			el.className = labelClass(kind);
			el.textContent = text;
			el.style.display = 'none';
			labelsEl.appendChild(el);
			return el;
		};

		for (const country of countries) {
			labelEntries.push({
				el: make(country.name, 'country', country.code),
				kind: 'country',
				code: country.code,
				lat: country.label[1],
				lng: country.label[0],
				minZoom: country.labelRank <= 1 ? 0.0 : country.labelRank === 2 ? 0.6 : country.labelRank === 3 ? 1.4 : country.labelRank === 4 ? 2.2 : 3.0,
				priority: country.labelRank * 10 + (country.areaKm2 ? 0 : 5),
				text: country.name
			});
		}

		for (const country of countries) {
			if (!country.capitalLatLng) continue;
			const name = capitalInPortuguese(country.code, country.capital);
			if (!name) continue;
			labelEntries.push({
				el: make(name, 'capital'),
				kind: 'capital',
				code: country.code,
				lat: country.capitalLatLng[0],
				lng: country.capitalLatLng[1],
				minZoom: 3.1,
				priority: 200 + (country.indicators.population?.v ? Math.log10(country.indicators.population.v) : 0),
				text: name
			});
		}

		for (const physical of physicalLabels) {
			labelEntries.push({
				el: make(physical.name, 'physical'),
				kind: 'physical',
				lat: physical.lat,
				lng: physical.lng,
				minZoom: physical.minZoom,
				priority: 400,
				text: physical.name
			});
		}
	}

	let frame = 0;

	function scheduleLabels() {
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			updateLabels();
		});
	}

	function updateLabels() {
		if (!map || !labelsEl || !showLabels) {
			if (labelsEl) for (const entry of labelEntries) entry.el.style.display = 'none';
			return;
		}

		const zoom = map.getZoom();
		const width = container.clientWidth;
		const height = container.clientHeight;
		const focusSet = focus ? new Set(focus) : null;
		const placed: { x: number; y: number; w: number; h: number }[] = [];

		const ordered = [...labelEntries].sort((a, b) => {
			if (a.code === selected) return -1;
			if (b.code === selected) return 1;
			if (a.kind !== b.kind) {
				const order = { country: 0, physical: 1, capital: 2 };
				return order[a.kind] - order[b.kind];
			}
			return a.priority - b.priority;
		});

		for (const entry of ordered) {
			// Em rodadas com foco, só os países candidatos recebem rótulo.
			if (focusSet && entry.kind === 'country' && !focusSet.has(entry.code ?? '')) {
				entry.el.style.display = 'none';
				continue;
			}
			if (entry.kind === 'physical' && (!layer.showPhysical || zoom < entry.minZoom)) {
				entry.el.style.display = 'none';
				continue;
			}
			if (entry.kind === 'capital') {
				const allowedLayers = layer.id === 'political' || layer.id === 'geopolitics' || layer.id === 'history';
				if (!allowedLayers || focusSet || zoom < entry.minZoom) {
					entry.el.style.display = 'none';
					continue;
				}
			}
			if (entry.kind === 'country' && entry.code !== selected && zoom < entry.minZoom) {
				entry.el.style.display = 'none';
				continue;
			}

			const point = map.project([entry.lng, entry.lat]);
			if (point.x < -60 || point.x > width + 60 || point.y < -30 || point.y > height + 30) {
				entry.el.style.display = 'none';
				continue;
			}

			const isSmall = entry.kind === 'country' && zoom < 2.2 && (getCountry(entry.code ?? '')?.areaKm2 ?? 0) < 40000;
			if (isSmall && entry.code !== selected) {
				entry.el.style.display = 'none';
				continue;
			}

			const font =
				entry.kind === 'country'
					? '600 10px "Inter Variable", system-ui, sans-serif'
					: entry.kind === 'capital'
						? '400 10px "Inter Variable", system-ui, sans-serif'
						: '500 9px "JetBrains Mono Variable", monospace';
			const textWidth = measure(entry.text.toUpperCase(), font) + entry.text.length * 0.35;
			const boxWidth = textWidth + 8;
			const boxHeight = 15;
			const rect = {
				x: point.x - boxWidth / 2,
				y: point.y - boxHeight / 2,
				w: boxWidth,
				h: boxHeight
			};
			const collision = placed.some(
				(p) =>
					rect.x < p.x + p.w + 3 &&
					rect.x + rect.w + 3 > p.x &&
					rect.y < p.y + p.h + 2 &&
					rect.y + rect.h + 2 > p.y
			);
			if (collision) {
				entry.el.style.display = 'none';
				continue;
			}

			placed.push(rect);
			entry.el.style.display = 'block';
			entry.el.style.transform = `translate3d(${Math.round(point.x)}px, ${Math.round(point.y)}px, 0) translate(-50%, -50%)`;
			entry.el.classList.toggle('is-selected', entry.code === selected);
			entry.el.classList.toggle('is-hovered', entry.code === hovered);
			entry.el.style.zIndex = entry.code === selected ? '5' : '1';
		}
	}

	async function setupMap() {
		if (!container) return;
		try {
			const maplibregl = await import('maplibre-gl');
			maplibregl.setWorkerUrl(workerUrl);
			const isMobile = window.innerWidth < 720;
			map = new maplibregl.Map({
				container,
				style: createMapStyle() as StyleSpecification,
				center: [0, 16],
				zoom: isMobile ? -0.3 : 1.3,
				minZoom: -0.6,
				maxZoom: 7.5,
				attributionControl: false,
				renderWorldCopies: true,
				dragRotate: false,
				pitchWithRotate: false
			});

			map.touchZoomRotate.disableRotation();
			map.keyboard.disableRotation();
			map.getCanvas().setAttribute('aria-label', 'Mapa-múndi interativo');
			map.getCanvas().setAttribute('role', 'application');

			map.on('error', (event) => {
				// Erros de tile/rede não devem derrubar a interface.
				console.warn('MapLibre:', event.error?.message ?? event.error);
			});

			map.on('load', async () => {
				try {
					const physical = await fetch(physicalUrl).then((res) => res.json());
					if (!map) return;
					map!.addSource('lakes', { type: 'geojson', data: physical.lakes });
					map!.addSource('rivers', { type: 'geojson', data: physical.rivers });
					map!.addLayer(
						{
							id: MAP_LAYER.lakes,
							type: 'fill',
							source: 'lakes',
							paint: { 'fill-color': '#0c1d2a', 'fill-opacity': 0.95 }
						},
						MAP_LAYER.border
					);
					map!.addLayer(
						{
							id: MAP_LAYER.rivers,
							type: 'line',
							source: 'rivers',
							paint: {
								'line-color': '#2f6d8a',
								'line-opacity': 0.7,
								'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.4, 6, 1.8]
							}
						},
						MAP_LAYER.border
					);
				} catch (err) {
					console.warn('Não foi possível carregar rios e lagos', err);
				}

				ready = true;
				applyLayer();
				applySelected();
				applyHighlight();
				applyFocus();
				applyStatus();
				buildLabels();
				updateLabels();
				map?.resize();
			});

			map.on('move', () => {
				scheduleLabels();
				if (onview) {
					const center = map!.getCenter();
					onview({ lat: center.lat, lng: center.lng, zoom: map!.getZoom() });
				}
			});
			map.on('zoom', scheduleLabels);
			map.on('resize', scheduleLabels);

			map.on('mousemove', (event: MapMouseEvent) => {
				if (!interactive || !map) return;
				const feature = map!.queryRenderedFeatures(event.point, {
					layers: [MAP_LAYER.fill]
				})[0];
				const code = (feature?.properties?.code as string) ?? null;
				if (code !== hovered) {
					if (hovered) map!.setFeatureState({ source: 'countries', id: hovered }, { hover: false });
					hovered = code;
					if (code) map!.setFeatureState({ source: 'countries', id: code }, { hover: true });
					onhover?.(code);
					map.getCanvas().style.cursor = code ? 'pointer' : '';
					scheduleLabels();
				}
			});

			map.on('mouseout', () => {
				if (!map) return;
				if (hovered) map!.setFeatureState({ source: 'countries', id: hovered }, { hover: false });
				hovered = null;
				onhover?.(null);
				map.getCanvas().style.cursor = '';
				scheduleLabels();
			});

			map.on('click', (event: MapMouseEvent) => {
				if (!interactive || !map) return;
				const feature = map!.queryRenderedFeatures(event.point, {
					layers: [MAP_LAYER.fill]
				})[0];
				const code = feature?.properties?.code as string | undefined;
				if (code) onselect?.(code);
			});

			resizeObserver = new ResizeObserver(() => {
				map?.resize();
				scheduleLabels();
			});
			resizeObserver.observe(container);
		} catch (err) {
			console.error(err);
			failed = true;
		}
	}

	let resizeObserver: ResizeObserver | null = null;

	onMount(() => {
		setupMap();
		return () => {
			if (frame) cancelAnimationFrame(frame);
			resizeObserver?.disconnect();
			map?.remove();
			map = null;
		};
	});

	$effect(() => {
		// Dependências explícitas para reaplicar estados quando mudam.
		void ready;
		void selected;
		if (ready) applySelected();
	});

	$effect(() => {
		void ready;
		void highlight;
		if (ready) applyHighlight();
	});

	$effect(() => {
		void ready;
		void focus;
		if (ready) {
			applyFocus();
			scheduleLabels();
		}
	});

	$effect(() => {
		void ready;
		void status;
		if (ready) applyStatus();
	});

	$effect(() => {
		void showLabels;
		scheduleLabels();
	});

	$effect(() => {
		void ready;
		void layer;
		if (ready) {
			applyLayer();
			scheduleLabels();
		}
	});

	export function flyTo(center: [number, number], zoom = 3) {
		map?.flyTo({ center, zoom, duration: 900, essential: true });
	}

	export function resetView() {
		const isMobile = typeof window !== 'undefined' && window.innerWidth < 720;
		map?.flyTo({ center: [0, 16], zoom: isMobile ? -0.3 : 1.3, duration: 700, essential: true });
	}

	export function zoomBy(delta: number) {
		if (!map) return;
		map.zoomTo(map.getZoom() + delta, { duration: 220 });
	}

	export function getMap() {
		return map;
	}
</script>

<div class={`map-canvas ${className}`} bind:this={container}>
	<div class="map-labels" bind:this={labelsEl} aria-hidden="true"></div>
	{#if !ready && !failed}
		<div class="map-loading" role="status" aria-live="polite">
			<span class="dot"></span>
			<span>Desenhando o mundo…</span>
		</div>
	{/if}
	{#if failed}
		<div class="map-failed">
			<p>Não foi possível iniciar o mapa neste navegador.</p>
			<p class="hint">Tente atualizar a página ou usar um navegador com WebGL habilitado.</p>
		</div>
	{/if}
	<div class="map-vignette" aria-hidden="true"></div>
</div>

<style>
	.map-canvas {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: #070b12;
	}
	.map-labels {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
		overflow: hidden;
	}
	.map-labels :global(.map-label) {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: auto;
		background: none;
		border: 0;
		padding: 2px 4px;
		margin: 0;
		color: rgba(233, 239, 247, 0.72);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		white-space: nowrap;
		text-shadow: 0 1px 6px rgba(3, 6, 11, 0.95), 0 0 14px rgba(3, 6, 11, 0.8);
		cursor: pointer;
		line-height: 1;
		opacity: 0.9;
	}
	.map-labels :global(.map-label:hover),
	.map-labels :global(.map-label.is-hovered) {
		color: #e9eff7;
	}
	.map-labels :global(.map-label.is-selected) {
		color: #f0cd8e;
		font-weight: 700;
	}
	.map-labels :global(.map-capital) {
		position: absolute;
		top: 0;
		left: 0;
		color: rgba(233, 239, 247, 0.55);
		font-size: 10px;
		font-weight: 400;
		white-space: nowrap;
		text-shadow: 0 1px 6px rgba(3, 6, 11, 0.95);
		line-height: 1;
		padding-left: 9px;
	}
	.map-labels :global(.map-capital::before) {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: rgba(233, 239, 247, 0.7);
		transform: translateY(-50%);
	}
	.map-labels :global(.map-physical) {
		position: absolute;
		top: 0;
		left: 0;
		color: rgba(185, 164, 122, 0.82);
		font-family: var(--font-mono);
		font-size: 8.5px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		white-space: nowrap;
		line-height: 1;
		text-shadow: 0 1px 8px rgba(3, 6, 11, 0.9);
	}
	.map-loading {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		z-index: 3;
		color: var(--color-mist-400);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		background: #070b12;
	}
	.map-loading .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-gold-400);
		animation: pulse-soft 1.4s ease-in-out infinite;
	}
	.map-failed {
		position: absolute;
		inset: 0;
		z-index: 4;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2rem;
		text-align: center;
		background: #070b12;
		color: var(--color-mist-200);
	}
	.map-failed .hint {
		color: var(--color-mist-400);
		font-size: 0.85rem;
	}
	.map-vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		background: radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(3, 6, 11, 0.55) 100%);
	}
	:global(.maplibregl-canvas) {
		outline: none;
	}
	:global(.maplibregl-ctrl-attrib) {
		display: none;
	}
</style>
