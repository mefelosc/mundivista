<script lang="ts">
	import { onMount } from 'svelte';
	import workerUrl from '#lib/map/worker.ts?worker&url';
	import type {
		ExpressionSpecification,
		GeoJSONSource,
		Map as MlMap,
		MapMouseEvent,
		StyleSpecification
	} from 'maplibre-gl';
	import type { FeatureCollection } from 'geojson';
	import { countries, getCountry } from '#lib/data/countries';
	import { physicalLabels } from '#lib/data/physical-labels';
	import { marineLabels } from '#lib/data/marine-labels';
	import { physicalUrl, worldUrl } from '#lib/data/world';
	import { cityPoints } from '#lib/data/cities';
	import { capitalInPortuguese } from '#lib/data/capitals-pt';
	import { buildChoropleth, withNoData } from '#lib/engines/map-engine/choropleth';
	import {
		createMapStyle,
		EQUAL_EARTH_PROJECTION,
		MAP_LAYER,
		mapPalette,
		type MapProjection
	} from '#lib/engines/map-engine/style';
	import {
		FLAT_ZOOM_OFFSET,
		nearestLng,
		WORLD_COPIES,
		wrapCollection
	} from '#lib/engines/map-engine/wrap';
	import { theme } from '#lib/theme.svelte';
	import { sound } from '#lib/sound.svelte';
	import type { ResolvedLayer } from '#lib/configurations/map-layers';
	import type { SubdivisionCollection } from '#lib/data/subdivisions';

	interface Props {
		layer: ResolvedLayer;
		selected?: string | null;
		highlight?: string[];
		focus?: string[] | null;
		status?: Record<string, 'correct' | 'wrong'>;
		subdivisions?: SubdivisionCollection | null;
		activeSubdivision?: string | null;
		/** Código do país cuja bandeira deve cobrir o território no feedback. */
		flagCountry?: string | null;
		interactive?: boolean;
		showLabels?: boolean;
		projection?: MapProjection;
		terrain?: boolean;
		onselect?: (code: string) => void;
		onhover?: (code: string | null) => void;
		onview?: (view: { lat: number; lng: number; zoom: number }) => void;
		onready?: () => void;
		class?: string;
	}

	let {
		layer,
		selected = null,
		highlight = [],
		focus = null,
		status = {},
		subdivisions = null,
		activeSubdivision = null,
		flagCountry = null,
		interactive = true,
		showLabels = true,
		projection = 'flat',
		terrain = false,
		onselect,
		onhover,
		onview,
		onready,
		class: className = ''
	}: Props = $props();

	let container: HTMLDivElement;
	let labelsEl: HTMLDivElement;
	let map: MlMap | null = null;
	let ready = $state(false);
	let failed = $state(false);
	let hovered = $state<string | null>(null);
	let activeFill: string = MAP_LAYER.fillA;
	let scaleLabel = $state('');
	let scaleWidth = $state(90);
	let flagBounds: { minLng: number; maxLng: number; minLat: number; maxLat: number } | null = null;
	let flagBox = $state<{ left: number; top: number; width: number; height: number; iso2: string } | null>(
		null
	);

	let pitch = $state(0);
	let wrapping = false;

	const EQUAL_EARTH_DEFINITION =
		'+proj=eqearth +lon_0=0 +x_0=0 +y_0=0 +R=6371008.8 +over +units=m +no_defs';
	let equalEarthRegistered = false;

	const projectionLabel = $derived(projection === 'flat' ? '2D · Equal Earth' : 'Globo 3D');

	function registerEqualEarth(
		maplibregl: typeof import('maplibre-gl'),
		proj4: (from: string, to: string) => {
			forward(position: number[]): number[];
			inverse(position: number[]): number[] | null;
		}
	) {
		if (equalEarthRegistered) return;
		const converter = proj4('EPSG:4326', EQUAL_EARTH_DEFINITION);
		const edge = converter.forward([180, 0])[0];
		const poleY = Math.abs(converter.forward([0, 90])[1]);
		// A praça da projeção tem cantos vazios (fora do oval do mundo). Sem
		// isto, o MapLibre tenta inverter esses cantos ao arrastar o mapa e
		// lança "inverse has no answer". Limitamos y aos polos: o ponteiro no
		// vazio vira o polo mais próximo em vez de quebrar o gesto.
		const projection = {
			forward: (position: number[]) => converter.forward(position),
			inverse: (position: number[]) => {
				const y = Math.max(-poleY, Math.min(poleY, position[1]));
				const out = converter.inverse([position[0], y]);
				return out && Number.isFinite(out[0]) && Number.isFinite(out[1]) ? out : [0, 0];
			}
		};
		// A praça da projeção cobre três mundos (-540°..540°). As cópias em
		// ±360° ficam dentro dela e o MapLibre as desenha; a câmera salta 360°
		// no antimeridiano para o pan ser infinito.
		try {
			maplibregl.addProjection({
				name: EQUAL_EARTH_PROJECTION,
				definition: EQUAL_EARTH_DEFINITION,
				projection: projection as never,
				tileMatrixSet: {
					origin: [-edge * WORLD_COPIES, edge],
					extentAtZoom0: edge * 2 * WORLD_COPIES
				}
			});
		} catch (error) {
			// Dois mounts em sequência podem disputar o registro; o segundo já o encontra pronto.
			if (!(error instanceof Error) || !error.message.includes('already exists')) throw error;
		}
		equalEarthRegistered = true;
	}

	let labelEntries: {
		el: HTMLElement;
		kind: 'country' | 'capital' | 'physical' | 'city' | 'marine' | 'unit';
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

	function continentExpression(colors: ResolvedLayer): ExpressionSpecification {
		const tints = colors.tints ?? [];
		const pairs: string[] = [];
		for (const tint of tints) pairs.push(tint.label, tint.color);
		return [
			'match',
			['get', 'continent'],
			...pairs,
			colors.land.fill
		] as unknown as ExpressionSpecification;
	}

	/* ---------- estados de feature: sempre por diferença ---------- */
	const prevSelected = new Set<string>();
	const prevHighlight = new Set<string>();
	const prevFocus = new Set<string>();
	let prevStatus = new Set<string>();
	let focusActive = false;

	function applySelected() {
		if (!map || !ready) return;
		if (selected) {
			map.setFeatureState({ source: 'countries', id: selected }, { selected: true });
		}
		for (const code of prevSelected) {
			if (code !== selected) {
				map.setFeatureState({ source: 'countries', id: code }, { selected: false });
			}
		}
		prevSelected.clear();
		if (selected) prevSelected.add(selected);
	}

	function applyHighlight() {
		if (!map || !ready) return;
		const next = new Set(highlight);
		for (const code of prevHighlight) {
			if (!next.has(code)) map.setFeatureState({ source: 'countries', id: code }, { highlight: false });
		}
		for (const code of next) {
			if (!prevHighlight.has(code)) map.setFeatureState({ source: 'countries', id: code }, { highlight: true });
		}
		prevHighlight.clear();
		for (const code of next) prevHighlight.add(code);
	}

	function applyFocus() {
		if (!map || !ready) return;
		const next = focus ? new Set(focus) : null;
		if (next) {
			// Mudança de rodada, não de hover: vale varrer os 241 territórios uma vez.
			for (const country of countries) {
				const inside = next.has(country.code);
				map.setFeatureState(
					{ source: 'countries', id: country.code },
					{ focus: inside, inFocus: inside }
				);
			}
			prevFocus.clear();
			for (const code of next) prevFocus.add(code);
			focusActive = true;
		} else if (focusActive) {
			for (const country of countries) {
				map.setFeatureState(
					{ source: 'countries', id: country.code },
					{ focus: false, inFocus: true }
				);
			}
			prevFocus.clear();
			focusActive = false;
		}
	}

	function applyStatus() {
		if (!map || !ready) return;
		const next = new Set(Object.keys(status));
		for (const code of prevStatus) {
			if (!next.has(code)) map.setFeatureState({ source: 'countries', id: code }, { status: 'none' });
		}
		for (const [code, value] of Object.entries(status)) {
			map.setFeatureState({ source: 'countries', id: code }, { status: value });
		}
		prevStatus = next;
	}

	function fillExpression(layerConfig: ResolvedLayer): string | ExpressionSpecification {
		if (layerConfig.indicator) {
			const values = countries
				.map((c) => c.indicators[layerConfig.indicator!]?.v)
				.filter((v): v is number => typeof v === 'number');
			const scale = buildChoropleth(layerConfig, values);
			return scale ? withNoData(scale.expression, layerConfig.noData) : layerConfig.noData;
		}
		if (layerConfig.id === 'political') return continentExpression(layerConfig);
		return layerConfig.land.fill;
	}

	function applyLayer(animate = true) {
		if (!map || !ready) return;

		if (layer.indicator) {
			for (const country of countries) {
				const value = country.indicators[layer.indicator];
				map.setFeatureState(
					{ source: 'countries', id: country.code },
					value ? { has: true, value: value.v } : { has: false, value: 0 }
				);
			}
		}

		const expression = fillExpression(layer);
		const target = activeFill === MAP_LAYER.fillA ? MAP_LAYER.fillB : MAP_LAYER.fillA;
		const current = activeFill;
		if (animate) {
			map.setPaintProperty(target, 'fill-color', expression);
			map.setPaintProperty(target, 'fill-opacity', 1);
			map.setPaintProperty(current, 'fill-opacity', 0);
			activeFill = target;
		} else {
			map.setPaintProperty(target, 'fill-opacity', 0);
			map.setPaintProperty(current, 'fill-opacity', 1);
			map.setPaintProperty(current, 'fill-color', expression);
			activeFill = current;
		}

		setVisibility(MAP_LAYER.rivers, !!layer.showPhysical);
		setVisibility(MAP_LAYER.lakes, !!layer.showPhysical);
		setVisibility(MAP_LAYER.coastline, !!layer.showCoastline);
		setVisibility(MAP_LAYER.citiesMajor, !!layer.showCities);
		setVisibility(MAP_LAYER.citiesMinor, !!layer.showCities);
		setVisibility(MAP_LAYER.disputed, !!layer.showDisputed);
		setVisibility(
			MAP_LAYER.subdivisionsFill,
			!!layer.showSubdivisions && !!subdivisions?.features.length
		);
		setVisibility(
			MAP_LAYER.subdivisionsLine,
			!!layer.showSubdivisions && !!subdivisions?.features.length
		);
		setVisibility(
			MAP_LAYER.subdivisionActiveFill,
			!!layer.showSubdivisions && !!subdivisions?.features.length
		);
		setVisibility(
			MAP_LAYER.subdivisionActiveLine,
			!!layer.showSubdivisions && !!subdivisions?.features.length
		);
		updateHillshadeVisibility();
	}

	/* ---------- unidades administrativas do país selecionado ---------- */
	let wrappedSubdivisionsSource: typeof subdivisions = null;
	let wrappedSubdivisions: typeof subdivisions = null;

	function applySubdivisions() {
		if (!map || !ready) return;
		const source = map.getSource('subdivisions') as GeoJSONSource | undefined;
		if (projection === 'flat' && subdivisions?.features.length) {
			if (wrappedSubdivisionsSource !== subdivisions) {
				wrappedSubdivisionsSource = subdivisions;
				wrappedSubdivisions = wrapCollection(subdivisions) as typeof subdivisions;
			}
			source?.setData(wrappedSubdivisions ?? subdivisions);
		} else {
			source?.setData(
				subdivisions ?? ({ type: 'FeatureCollection', features: [] } as never)
			);
		}
		applyActiveSubdivision();

		const visible = !!layer.showSubdivisions && !!subdivisions?.features.length;
		for (const id of [
			MAP_LAYER.subdivisionsFill,
			MAP_LAYER.subdivisionsLine,
			MAP_LAYER.subdivisionActiveFill,
			MAP_LAYER.subdivisionActiveLine
		]) {
			setVisibility(id, visible);
		}
		buildLabels();
		scheduleLabels();
	}

	function applyActiveSubdivision() {
		if (!map || !ready) return;
		const expression: ExpressionSpecification = [
			'==',
			['get', 'id'],
			activeSubdivision ?? '__none__'
		];
		for (const id of [MAP_LAYER.subdivisionActiveFill, MAP_LAYER.subdivisionActiveLine]) {
			if (map.getLayer(id)) map.setFilter(id, expression);
		}
	}

	/* ---------- bandeira do território no feedback ---------- */
	function loadFlagBounds(code: string) {
		if (!map || !ready) return;
		const features = map.queryRenderedFeatures({
			layers: [MAP_LAYER.fillA, MAP_LAYER.fillB],
			filter: ['==', ['get', 'code'], code]
		});
		const centerLng = map.getCenter().lng;
		let best: { minLng: number; maxLng: number; minLat: number; maxLat: number } | null = null;
		let bestDistance = Infinity;

		for (const feature of features) {
			let minLng = Infinity;
			let maxLng = -Infinity;
			let minLat = Infinity;
			let maxLat = -Infinity;
			const visit = (coordinates: unknown) => {
				if (!Array.isArray(coordinates)) return;
				if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
					const lng = coordinates[0] as number;
					const lat = coordinates[1] as number;
					if (lng < minLng) minLng = lng;
					if (lng > maxLng) maxLng = lng;
					if (lat < minLat) minLat = lat;
					if (lat > maxLat) maxLat = lat;
					return;
				}
				for (const child of coordinates) visit(child);
			};
			visit((feature.geometry as unknown as { coordinates?: unknown }).coordinates);
			if (!Number.isFinite(minLng)) continue;
			const distance = Math.abs(nearestLng((minLng + maxLng) / 2, centerLng) - centerLng);
			if (distance < bestDistance) {
				bestDistance = distance;
				const mid = (minLng + maxLng) / 2;
				const shift = nearestLng(mid, centerLng) - mid;
				best = { minLng: minLng + shift, maxLng: maxLng + shift, minLat, maxLat };
			}
		}

		if (!best) {
			flagBounds = null;
			return;
		}
		flagBounds = best;
		updateFlagOverlay();
	}

	function updateFlagOverlay() {
		if (!map || !ready || !flagCountry || !flagBounds) {
			flagBox = null;
			return;
		}
		const country = getCountry(flagCountry);
		if (!country?.iso2) {
			flagBox = null;
			return;
		}
		const nw = map.project([flagBounds.minLng, flagBounds.maxLat]);
		const se = map.project([flagBounds.maxLng, flagBounds.minLat]);
		const width = Math.abs(se.x - nw.x);
		const height = Math.abs(se.y - nw.y);
		if (width < 1 || height < 1) {
			flagBox = null;
			return;
		}
		const pad = 4;
		const minWidth = 34;
		const minHeight = 24;
		const finalWidth = Math.max(width + pad * 2, minWidth);
		const finalHeight = Math.max(height + pad * 2, minHeight);
		const centerX = (nw.x + se.x) / 2;
		const centerY = (nw.y + se.y) / 2;
		flagBox = {
			left: centerX - finalWidth / 2,
			top: centerY - finalHeight / 2,
			width: finalWidth,
			height: finalHeight,
			iso2: country.iso2
		};
	}

	function setVisibility(id: string, visible: boolean) {
		if (!map?.getLayer(id)) return;
		map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
	}

	function updateHillshadeVisibility() {
		const visible = projection === 'globe' && (terrain || layer.id === 'physical');
		setVisibility(MAP_LAYER.hillshade, visible);
	}

	function applyTheme() {
		if (!map || !ready) return;
		const p = mapPalette(theme.resolved);
		const dark = theme.resolved === 'dark';
		map.setPaintProperty(MAP_LAYER.ocean, 'fill-color', p.ocean);
		map.setPaintProperty(MAP_LAYER.graticuleMinor, 'line-color', p.graticule);
		map.setPaintProperty(MAP_LAYER.graticuleMajor, 'line-color', p.graticule);
		map.setPaintProperty(MAP_LAYER.graticuleMinor, 'line-opacity', dark ? 0.05 : 0.07);
		map.setPaintProperty(MAP_LAYER.graticuleMajor, 'line-opacity', dark ? 0.11 : 0.13);
		map.setPaintProperty(MAP_LAYER.border, 'line-color', p.border);
		map.setPaintProperty(MAP_LAYER.selected, 'line-color', p.accent);
		map.setPaintProperty(MAP_LAYER.hover, 'line-color', p.accent);
		map.setPaintProperty(MAP_LAYER.focusLine, 'line-color', p.clay);
		map.setPaintProperty(MAP_LAYER.citiesMajor, 'circle-color', p.accent);
		map.setPaintProperty(MAP_LAYER.citiesMajor, 'circle-stroke-color', p.halo);
		map.setPaintProperty(MAP_LAYER.citiesMinor, 'circle-color', p.clay);
		map.setPaintProperty(MAP_LAYER.citiesMinor, 'circle-stroke-color', p.halo);
		map.setPaintProperty(MAP_LAYER.micro, 'circle-color', p.accent);
		map.setPaintProperty(MAP_LAYER.micro, 'circle-stroke-color', p.halo);
		map.setPaintProperty(MAP_LAYER.hillshade, 'hillshade-exaggeration', dark ? 0.72 : 0.62);
		map.setPaintProperty(MAP_LAYER.hillshade, 'hillshade-shadow-color', dark ? '#050806' : '#3f4c3f');
		map.setPaintProperty(MAP_LAYER.hillshade, 'hillshade-highlight-color', dark ? '#dbe6dc' : '#f8fbf5');
		if (map.getLayer(MAP_LAYER.rivers)) {
			map.setPaintProperty(MAP_LAYER.rivers, 'line-color', p.river);
			map.setPaintProperty(MAP_LAYER.lakes, 'fill-color', p.water);
			map.setPaintProperty(MAP_LAYER.coastline, 'line-color', p.coast);
		}
		if (map.getLayer(MAP_LAYER.subdivisionsLine)) {
			map.setPaintProperty(MAP_LAYER.subdivisionsFill, 'fill-color', p.clay);
			map.setPaintProperty(MAP_LAYER.subdivisionsLine, 'line-color', p.border);
			map.setPaintProperty(MAP_LAYER.subdivisionActiveFill, 'fill-color', p.accent);
			map.setPaintProperty(MAP_LAYER.subdivisionActiveLine, 'line-color', p.accent);
		}
		applyLayer(false);
		ensureHatch(p.border);
		scheduleLabels();
	}

	/* ---------- hachura de territórios com estatuto disputado ---------- */
	function ensureHatch(color: string) {
		if (!map) return;
		const size = 18;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, size, size);
		ctx.strokeStyle = color;
		ctx.globalAlpha = 0.9;
		ctx.lineWidth = 1.1;
		for (let x = -size; x < size * 2; x += 7) {
			ctx.beginPath();
			ctx.moveTo(x, size);
			ctx.lineTo(x + size, 0);
			ctx.stroke();
		}
		const image = ctx.getImageData(0, 0, size, size);
		const data = {
			width: size,
			height: size,
			data: new Uint8Array(image.data)
		};
		if (map.hasImage('disputed-hatch')) map.updateImage('disputed-hatch', data);
		else map.addImage('disputed-hatch', data, { pixelRatio: 2 });
	}

	/* ---------- rótulos DOM ---------- */
	function labelClass(kind: string): string {
		if (kind === 'country') return 'map-label';
		if (kind === 'capital') return 'map-capital';
		if (kind === 'city') return 'map-city';
		if (kind === 'marine') return 'map-marine';
		if (kind === 'unit') return 'map-unit';
		return 'map-physical';
	}

	function buildLabels() {
		if (!labelsEl) return;
		labelsEl.replaceChildren();
		labelEntries = [];

		const make = (text: string, kind: 'country' | 'capital' | 'physical' | 'city' | 'marine' | 'unit') => {
			// Rótulos são apenas pintura: se capturarem o ponteiro, arrastar o
			// mapa a partir de um nome de país deixa de funcionar.
			const el = document.createElement('span');
			el.className = labelClass(kind);
			el.textContent = text;
			el.style.display = 'none';
			labelsEl.appendChild(el);
			return el;
		};

		for (const country of countries) {
			labelEntries.push({
				el: make(country.name, 'country'),
				kind: 'country',
				code: country.code,
				lat: country.label[1],
				lng: country.label[0],
				minZoom:
					country.labelRank <= 1
						? 0
						: country.labelRank === 2
							? 0.7
							: country.labelRank === 3
								? 1.5
								: country.labelRank === 4
									? 2.3
									: 3.2,
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
				minZoom: 3.2,
				priority: 200 + (country.indicators.population?.v ? Math.log10(country.indicators.population.v) : 0),
				text: name
			});
		}

		for (const marine of marineLabels) {
			labelEntries.push({
				el: make(marine.name, 'marine'),
				kind: 'marine',
				lat: marine.lat,
				lng: marine.lng,
				minZoom: marine.minZoom,
				priority: marine.priority,
				text: marine.name
			});
		}

		for (const physical of physicalLabels) {
			labelEntries.push({
				el: make(physical.name, 'physical'),
				kind: 'physical',
				lat: physical.lat,
				lng: physical.lng,
				minZoom: Math.max(physical.minZoom, 3),
				priority: 400,
				text: physical.name
			});
		}

		for (const feature of subdivisions?.features ?? []) {
			const props = feature.properties;
			if (!props.label || !props.name) continue;
			labelEntries.push({
				el: make(props.name, 'unit'),
				kind: 'unit',
				code: props.adm0,
				lat: props.label[1],
				lng: props.label[0],
				minZoom: 4,
				priority: 700,
				text: props.name
			});
		}

		for (const city of cityPoints) {
			if (!city.properties) continue;
			labelEntries.push({
				el: make(city.properties.name, 'city'),
				kind: 'city',
				code: city.properties.code,
				lat: city.geometry.coordinates[1],
				lng: city.geometry.coordinates[0],
				minZoom: city.properties.capital ? 3.4 : 4.1,
				priority: 600 - Math.log10(Math.max(city.properties.pop, 1)) * 20,
				text: city.properties.name
			});
		}

		labelEntries.sort((a, b) => {
			const order = { country: 0, marine: 1, physical: 2, capital: 3, unit: 4, city: 5 };
			if (a.kind !== b.kind) return order[a.kind] - order[b.kind];
			return a.priority - b.priority;
		});
	}

	let frame = 0;

	function scheduleLabels() {
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			updateLabels();
		});
	}

	const MAX_LABELS = 82;

	function updateLabels() {
		if (!map || !labelsEl) return;
		if (!showLabels) {
			for (const entry of labelEntries) entry.el.style.display = 'none';
			return;
		}

		const zoom = map.getZoom() - (projection === 'flat' ? FLAT_ZOOM_OFFSET : 0);
		const width = container.clientWidth;
		const height = container.clientHeight;
		const focusSet = focus ? new Set(focus) : null;
		const placed: { x: number; y: number; w: number; h: number }[] = [];
		let visibleCount = 0;
		const globe = projection === 'globe';
		const centerLng = map.getCenter().lng;
		const capitalLayers = layer.id === 'political' || layer.id === 'geopolitics' || layer.id === 'history';

		for (const entry of labelEntries) {
			if (visibleCount >= MAX_LABELS) {
				entry.el.style.display = 'none';
				continue;
			}
			if (focusSet && entry.kind === 'country' && !focusSet.has(entry.code ?? '')) {
				entry.el.style.display = 'none';
				continue;
			}
			if (entry.kind === 'marine') {
				if (zoom < entry.minZoom) {
					entry.el.style.display = 'none';
					continue;
				}
			}
			if (entry.kind === 'physical') {
				if (!layer.showPhysical || zoom < entry.minZoom) {
					entry.el.style.display = 'none';
					continue;
				}
			}
			if (entry.kind === 'capital') {
				if (!capitalLayers || focusSet || zoom < entry.minZoom) {
					entry.el.style.display = 'none';
					continue;
				}
			}
			if (entry.kind === 'city') {
				if (!layer.showCities || focusSet || zoom < entry.minZoom) {
					entry.el.style.display = 'none';
					continue;
				}
			}
			if (entry.kind === 'unit') {
				if (
					!layer.showSubdivisions ||
					!subdivisions?.features.length ||
					focusSet ||
					entry.code !== selected ||
					zoom < entry.minZoom
				) {
					entry.el.style.display = 'none';
					continue;
				}
			}
			if (entry.kind === 'country' && entry.code !== selected && zoom < entry.minZoom) {
				entry.el.style.display = 'none';
				continue;
			}

			const lng = globe ? entry.lng : nearestLng(entry.lng, centerLng);
			const point = map.project([lng, entry.lat]);
			if (point.x < -60 || point.x > width + 60 || point.y < -30 || point.y > height + 30) {
				entry.el.style.display = 'none';
				continue;
			}
			if (globe) {
				const back = map.unproject([point.x, point.y]);
				const dLng = Math.abs(((back.lng - entry.lng + 540) % 360) - 180);
				const dLat = Math.abs(back.lat - entry.lat);
				if (dLng > 2 || dLat > 2) {
					entry.el.style.display = 'none';
					continue;
				}
			}

			const isSmall =
				entry.kind === 'country' && zoom < 2.2 && (getCountry(entry.code ?? '')?.areaKm2 ?? 0) < 40000;
			if (isSmall && entry.code !== selected) {
				entry.el.style.display = 'none';
				continue;
			}

			const font =
				entry.kind === 'country'
					? '600 10.5px "Instrument Sans Variable", system-ui, sans-serif'
					: entry.kind === 'capital' || entry.kind === 'city'
						? '500 10px "Instrument Sans Variable", system-ui, sans-serif'
						: entry.kind === 'marine'
							? 'italic 500 11px "Newsreader Variable", serif'
							: entry.kind === 'unit'
								? 'italic 400 9.5px "Newsreader Variable", serif'
								: '500 9.5px "Newsreader Variable", serif';
			const textWidth = measure(entry.text.toUpperCase(), font) + entry.text.length * 0.3;
			const boxWidth = textWidth + 8;
			const boxHeight = entry.kind === 'physical' ? 15 : 16;
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
			visibleCount += 1;
			entry.el.style.display = 'block';
			entry.el.style.transform = `translate3d(${Math.round(point.x)}px, ${Math.round(point.y)}px, 0) translate(-50%, -50%)`;
			entry.el.classList.toggle('is-selected', entry.kind === 'country' && entry.code === selected);
			entry.el.classList.toggle('is-hovered', entry.kind === 'country' && entry.code === hovered);
			entry.el.style.zIndex = entry.code === selected ? '5' : '1';
		}
	}

	function updateScale() {
		if (!map) return;
		const center = map.getCenter();
		const zoom = map.getZoom() - (projection === 'flat' ? FLAT_ZOOM_OFFSET : 0);
		// 512 px por mundo no zoom 0; na projeção planar a praça tem três mundos.
		const metersPerPixel =
			(40075016.686 / (512 * Math.pow(2, zoom))) * Math.cos((center.lat * Math.PI) / 180);
		const target = metersPerPixel * 96;
		const pow = Math.pow(10, Math.floor(Math.log10(target)));
		const nice = [1, 2, 5, 10].map((m) => m * pow).find((v) => v >= target * 0.62) ?? pow * 10;
		const px = Math.min(120, Math.max(46, nice / metersPerPixel));
		scaleWidth = Math.round(px);
		scaleLabel = nice >= 1000 ? `${Math.round(nice / 1000)} km` : `${Math.round(nice)} m`;
	}

	let hoverFrame = 0;
	let pendingPoint: { x: number; y: number } | null = null;

	function queryCode(point: { x: number; y: number }, radius = 4): string | null {
		if (!map) return null;
		// Países pequenos: um ponto de acerto no rótulo, com raio generoso.
		const hitRadius = 16;
		const hits = map.queryRenderedFeatures(
			[
				[point.x - hitRadius, point.y - hitRadius],
				[point.x + hitRadius, point.y + hitRadius]
			],
			{ layers: [MAP_LAYER.hits] }
		);
		let best: { code: string; distance: number } | null = null;
		for (const feature of hits) {
			const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
			const projected = map.project(coordinates);
			const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
			if (distance <= hitRadius && (!best || distance < best.distance)) {
				const code = feature.properties?.code as string | undefined;
				if (code) best = { code, distance };
			}
		}
		if (best) return best.code;

		const features = map.queryRenderedFeatures(
			[
				[point.x - radius, point.y - radius],
				[point.x + radius, point.y + radius]
			],
			{ layers: [MAP_LAYER.micro, MAP_LAYER.fillA, MAP_LAYER.fillB] }
		);
		return (features[0]?.properties?.code as string) ?? null;
	}

	function setHovered(code: string | null) {
		if (!map || code === hovered) return;
		if (hovered) map.setFeatureState({ source: 'countries', id: hovered }, { hover: false });
		hovered = code;
		if (code) map.setFeatureState({ source: 'countries', id: code }, { hover: true });
		onhover?.(code);
		map.getCanvas().style.cursor = code ? 'pointer' : '';
		scheduleLabels();
	}

	async function setupMap() {
		if (!container) return;
		try {
			const maplibregl = await import('maplibre-gl');
			maplibregl.setWorkerUrl(workerUrl);
			const isMobile = window.innerWidth < 720;
			const isFlat = projection === 'flat';
			if (isFlat) {
				const proj4 = (await import('proj4')).default;
				if (!container) return;
				registerEqualEarth(maplibregl, proj4);
			}
			if (!container) return;
			const flatZoom =
				Math.max(-0.5, Math.log2(Math.max(320, container.clientWidth) / 512) - 0.04) +
				FLAT_ZOOM_OFFSET;
			// A projeção planar não repete o mundo sozinha: entregamos as cópias
			// já no estilo para o pan leste–oeste ser contínuo desde o primeiro frame.
			const style = createMapStyle(theme.resolved, projection) as StyleSpecification;
			if (isFlat) {
				const world = await fetch(worldUrl).then((res) => res.json());
				(style.sources.countries as { data: unknown }).data = wrapCollection(world);
			}
			if (!container) return;
			map = new maplibregl.Map({
				container,
				style,
				center: isFlat ? [0, 0] : [0, 16],
				zoom: isFlat ? flatZoom : isMobile ? 1.2 : 1.8,
				minZoom: isFlat ? Math.max(-1.2, flatZoom - 0.6) : -0.6,
				maxZoom: isFlat ? 7 + FLAT_ZOOM_OFFSET : 7.4,
				attributionControl: false,
				renderWorldCopies: true,
				dragRotate: false,
				pitchWithRotate: false,
				maxPitch: projection === 'globe' && terrain ? 65 : 0
			});

			map.touchZoomRotate.disableRotation();
			map.keyboard.disableRotation();
			map.getCanvas().setAttribute('aria-label', 'Mapa-múndi interativo');
			map.getCanvas().setAttribute('role', 'application');

			map.on('error', (event) => {
				console.warn('MapLibre:', event.error?.message ?? event.error);
			});

			map.on('load', async () => {
				try {
					const physical = await fetch(physicalUrl).then((res) => res.json());
					if (!map) return;
					const wrap = <T extends FeatureCollection>(collection: T): T =>
						isFlat ? wrapCollection(collection) : collection;
					map.addSource('lakes', { type: 'geojson', data: wrap(physical.lakes) });
					map.addSource('rivers', { type: 'geojson', data: wrap(physical.rivers) });
					map.addSource('coastline', { type: 'geojson', data: wrap(physical.coastline) });
					const p = mapPalette(theme.resolved);
					map.addLayer(
						{
							id: MAP_LAYER.lakes,
							type: 'fill',
							source: 'lakes',
							paint: { 'fill-color': p.water, 'fill-opacity': 0.95 }
						},
						MAP_LAYER.border
					);
					map.addLayer(
						{
							id: MAP_LAYER.rivers,
							type: 'line',
							source: 'rivers',
							paint: {
								'line-color': p.river,
								'line-opacity': 0.72,
								'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.4, 6, 1.7]
							}
						},
						MAP_LAYER.border
					);
					map.addLayer(
						{
							id: MAP_LAYER.coastline,
							type: 'line',
							source: 'coastline',
							paint: {
								'line-color': p.coast,
								'line-opacity': 0.95,
								'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.9, 6, 1.7]
							}
						},
						MAP_LAYER.border
					);
					(map.getSource('cities') as GeoJSONSource | undefined)?.setData(
						isFlat
							? wrapCollection({ type: 'FeatureCollection', features: cityPoints })
							: { type: 'FeatureCollection', features: cityPoints }
					);
					const hits = countries
						.filter((country) => (country.areaKm2 ?? Infinity) < 250_000)
						.map((country) => ({
							type: 'Feature' as const,
							properties: { code: country.code },
							geometry: { type: 'Point' as const, coordinates: country.label }
						}));
					(map.getSource('country-hits') as GeoJSONSource | undefined)?.setData(
						isFlat ? wrapCollection({ type: 'FeatureCollection', features: hits }) : { type: 'FeatureCollection', features: hits }
					);
				} catch (err) {
					console.warn('Não foi possível carregar rios, lagos e cidades', err);
				}

				ensureHatch(mapPalette(theme.resolved).border);
				ready = true;
				applyLayer(false);
				applySelected();
				applyHighlight();
				applyFocus();
				applyStatus();
				applySubdivisions();
				updateScale();
				updateLabels();
				applyTerrain();
				map?.resize();
				onready?.();
			});

			map.on('move', () => {
				if (!map) return;
				scheduleLabels();
				updateFlagOverlay();
				updateScale();
				pitch = map.getPitch();
				if (onview) {
					const center = map.getCenter();
					onview({
						lat: center.lat,
						lng: center.lng,
						zoom: map.getZoom() - (projection === 'flat' ? FLAT_ZOOM_OFFSET : 0)
					});
				}
			});
			map.on('zoom', () => {
				scheduleLabels();
				updateFlagOverlay();
			});
			map.on('resize', () => {
				scheduleLabels();
				updateFlagOverlay();
			});
			map.on('moveend', () => {
				if (!map || projection !== 'flat' || wrapping) return;
				// As fontes têm cópias em ±360°; ao terminar o gesto, reancoramos
				// a câmera no mundo central. O salto de 360° é invisível.
				const center = map.getCenter();
				let next: number | null = null;
				if (center.lng > 180) next = center.lng - 360;
				else if (center.lng < -180) next = center.lng + 360;
				if (next === null) return;
				wrapping = true;
				// Fora do ciclo do gesto: o MapLibre ainda está fechando o
				// drag/inércia quando moveend dispara.
				setTimeout(() => {
					map?.jumpTo({ center: [next, center.lat] });
					requestAnimationFrame(() => (wrapping = false));
				}, 0);
			});

			map.on('mousemove', (event: MapMouseEvent) => {
				if (!interactive || !map) return;
				pendingPoint = { x: event.point.x, y: event.point.y };
				if (hoverFrame) return;
				hoverFrame = requestAnimationFrame(() => {
					hoverFrame = 0;
					if (!pendingPoint) return;
					setHovered(queryCode(pendingPoint));
				});
			});

			map.on('mouseout', () => setHovered(null));

			map.on('click', (event: MapMouseEvent) => {
				if (!interactive || !map) return;
				const code = queryCode({ x: event.point.x, y: event.point.y }, 6);
				if (code) {
					sound.click();
					onselect?.(code);
				}
			});

			resizeObserver = new ResizeObserver(() => {
				map?.resize();
				scheduleLabels();
				updateScale();
			});
			resizeObserver.observe(container);
		} catch (err) {
			console.error(err);
			failed = true;
		}
	}

	function applyTerrain() {
		if (!map) return;
		if (projection === 'flat') {
			map.setTerrain(null);
			map.setMaxPitch(0);
			updateHillshadeVisibility();
			return;
		}
		if (terrain) {
			map.setMaxPitch(65);
			map.setTerrain({ source: 'terrain-dem', exaggeration: 1.6 });
			if (map.getPitch() < 20) map.easeTo({ pitch: 55, duration: 700, essential: true });
		} else {
			map.setTerrain(null);
			map.setMaxPitch(0);
			if (map.getPitch() > 0) map.easeTo({ pitch: 0, duration: 450 });
		}
		updateHillshadeVisibility();
	}

	let resizeObserver: ResizeObserver | null = null;

	onMount(() => {
		setupMap();
		if (typeof document !== 'undefined' && document.fonts) {
			document.fonts.ready.then(() => {
				widthCache.clear();
				scheduleLabels();
			});
		}
		return () => {
			if (frame) cancelAnimationFrame(frame);
			if (hoverFrame) cancelAnimationFrame(hoverFrame);
			resizeObserver?.disconnect();
			map?.remove();
			map = null;
		};
	});

	$effect(() => {
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
		if (!interactive) setHovered(null);
	});

	$effect(() => {
		void ready;
		void layer;
		if (ready) {
			applyLayer();
			scheduleLabels();
		}
	});

	$effect(() => {
		void ready;
		void subdivisions;
		if (ready) applySubdivisions();
	});

	$effect(() => {
		void ready;
		void activeSubdivision;
		if (ready) applyActiveSubdivision();
	});

	$effect(() => {
		void ready;
		void flagCountry;
		if (!ready) return;
		if (!flagCountry) {
			flagBounds = null;
			flagBox = null;
			return;
		}
		loadFlagBounds(flagCountry);
		map?.once('idle', () => {
			if (flagCountry) loadFlagBounds(flagCountry);
		});
	});

	$effect(() => {
		void ready;
		void theme.resolved;
		if (ready) applyTheme();
	});

	$effect(() => {
		void ready;
		void terrain;
		if (ready) applyTerrain();
	});

	export function flyTo(center: [number, number], zoom = 3, duration = 900) {
		map?.flyTo({
			center,
			zoom: zoom + (projection === 'flat' ? FLAT_ZOOM_OFFSET : 0),
			duration,
			essential: true,
			curve: 1.35,
			speed: 0.9
		});
	}

	export function focusCountry(center: [number, number], areaKm2: number | null) {
		if (!map) return;
		const mobile = typeof window !== 'undefined' && window.innerWidth <= 900;
		const area = Math.max(areaKm2 ?? 100_000, 1);
		const zoom =
			Math.min(5.8, Math.max(2.6, 4.8 - Math.log10(area / 50_000) * 0.65)) +
			(projection === 'flat' ? FLAT_ZOOM_OFFSET : 0);
		const padding = mobile
			? { bottom: Math.min(430, Math.round(window.innerHeight * 0.55)) }
			: { right: Math.min(560, Math.round(window.innerWidth * 0.4)) };
		map.flyTo({
			center,
			zoom,
			padding,
			duration: 900,
			essential: true,
			curve: 1.3,
			speed: 0.9
		});
	}

	export function resetView() {
		const isMobile = typeof window !== 'undefined' && window.innerWidth < 720;
		if (projection === 'flat') {
			const flatZoom =
				Math.max(-0.5, Math.log2(Math.max(320, container.clientWidth) / 512) - 0.04) +
				FLAT_ZOOM_OFFSET;
			map?.flyTo({ center: [0, 0], zoom: flatZoom, duration: 700, essential: true });
		} else {
			map?.flyTo({ center: [0, 16], zoom: isMobile ? 1.2 : 1.8, duration: 760, essential: true });
		}
	}

	export function zoomBy(delta: number) {
		if (!map) return;
		map.zoomTo(map.getZoom() + delta, { duration: 240, essential: true });
	}

	export function getMap() {
		return map;
	}

	export function getView() {
		if (!map) return null;
		const center = map.getCenter();
		return {
			lat: center.lat,
			lng: center.lng,
			zoom: map.getZoom() - (projection === 'flat' ? FLAT_ZOOM_OFFSET : 0)
		};
	}
</script>

<div
	class={`map-canvas ${className}`}
	bind:this={container}
	data-pitch={Math.round(pitch)}
	data-projection={projection}
>
	<div class="map-space" aria-hidden="true"></div>
	<div class="map-labels" bind:this={labelsEl} aria-hidden="true"></div>
	{#if flagBox}
		<span
			class={`territory-flag fi fi-${flagBox.iso2}`}
			style:left={`${flagBox.left}px`}
			style:top={`${flagBox.top}px`}
			style:width={`${flagBox.width}px`}
			style:height={`${flagBox.height}px`}
			aria-hidden="true"
		></span>
	{/if}
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
	<div class="instruments" aria-hidden={!ready}>
		<div class="scale">
			<span class="scale-bar" style:width={`${scaleWidth}px`}></span>
			<span class="scale-label">{scaleLabel}</span>
			<span class="projection">{projectionLabel}</span>
			{#if terrain}
				<span class="attribution">Elevação: AWS Terrain Tiles</span>
			{/if}
		</div>
	</div>
	<div class="map-vignette" aria-hidden="true"></div>
</div>

<style>
	.map-canvas {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: var(--map-void);
		isolation: isolate;
	}
	.map-space {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background-color: var(--map-void);
	}
	.map-canvas[data-projection='flat'] .map-space {
		background-image:
			var(--map-void-wave),
			var(--map-void-wave),
			linear-gradient(var(--map-void-line) 1px, transparent 1px),
			linear-gradient(90deg, var(--map-void-line) 1px, transparent 1px),
			radial-gradient(
				130% 100% at 50% 44%,
				transparent 38%,
				color-mix(in oklab, var(--surface-0) 42%, transparent) 100%
			);
		background-size:
			200px 64px,
			400px 128px,
			52px 52px,
			52px 52px,
			100% 100%;
		background-position:
			0 0,
			100px 32px,
			center,
			center,
			center;
	}
	.map-canvas[data-projection='globe'] .map-space {
		background-color: #050907;
		background-image:
			radial-gradient(1.2px 1.2px at 18% 24%, rgba(240, 248, 242, 0.9) 45%, transparent 100%),
			radial-gradient(1px 1px at 72% 14%, rgba(226, 238, 230, 0.75) 45%, transparent 100%),
			radial-gradient(1.4px 1.4px at 44% 68%, rgba(240, 248, 242, 0.7) 45%, transparent 100%),
			radial-gradient(1px 1px at 88% 62%, rgba(226, 238, 230, 0.8) 45%, transparent 100%),
			radial-gradient(1px 1px at 8% 82%, rgba(226, 238, 230, 0.6) 45%, transparent 100%),
			radial-gradient(1.6px 1.6px at 58% 38%, rgba(240, 248, 242, 0.55) 45%, transparent 100%),
			radial-gradient(
				70% 60% at 66% 26%,
				color-mix(in oklab, var(--accent-1) 14%, transparent),
				transparent 68%
			),
			radial-gradient(90% 80% at 30% 78%, rgba(60, 90, 80, 0.28), transparent 70%);
		background-size:
			260px 260px,
			340px 340px,
			300px 300px,
			420px 420px,
			380px 380px,
			500px 500px,
			100% 100%,
			100% 100%;
		background-position:
			0 0,
			40px 90px,
			160px 20px,
			220px 140px,
			90px 200px,
			300px 60px,
			center,
			center;
	}
	.map-labels {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
		overflow: hidden;
	}
	.territory-flag {
		position: absolute;
		z-index: 3;
		display: block;
		pointer-events: none;
		background-size: cover;
		background-position: center;
		border: 2px solid var(--map-paper);
		border-radius: 2px;
		box-shadow:
			0 0 0 1px color-mix(in oklab, var(--accent-0) 70%, transparent),
			0 14px 34px -18px rgb(0 0 0 / 0.65);
		animation: flag-fit 0.45s var(--ease-out-soft) both;
		opacity: 0.94;
	}
	@keyframes flag-fit {
		from {
			opacity: 0;
			transform: scale(0.72);
		}
		to {
			opacity: 0.94;
			transform: scale(1);
		}
	}
	.map-labels :global(.map-label) {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		background: none;
		border: 0;
		padding: 2px 4px;
		margin: 0;
		color: var(--map-text);
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		white-space: nowrap;
		text-shadow:
			0 0 4px var(--map-paper),
			0 1px 8px var(--map-paper);
		cursor: pointer;
		line-height: 1;
		opacity: 0.88;
	}
	.map-labels :global(.map-label:hover),
	.map-labels :global(.map-label.is-hovered) {
		color: var(--accent-0);
		opacity: 1;
	}
	.map-labels :global(.map-label.is-selected) {
		color: var(--accent-0);
		font-weight: 700;
		opacity: 1;
	}
	.map-labels :global(.map-capital),
	.map-labels :global(.map-city) {
		position: absolute;
		top: 0;
		left: 0;
		color: var(--map-text);
		font-size: 10px;
		font-weight: 500;
		white-space: nowrap;
		text-shadow:
			0 0 4px var(--map-paper),
			0 1px 7px var(--map-paper);
		line-height: 1;
		padding-left: 8px;
		opacity: 0.72;
	}
	.map-labels :global(.map-capital::before) {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--accent-1);
		transform: translateY(-50%);
	}
	.map-labels :global(.map-marine) {
		position: absolute;
		top: 0;
		left: 0;
		color: var(--water-1);
		font-family: var(--font-display);
		font-size: 11px;
		font-style: italic;
		font-weight: 500;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		white-space: nowrap;
		line-height: 1;
		text-shadow:
			0 0 5px var(--map-paper),
			0 1px 8px var(--map-paper);
		opacity: 0.72;
	}
	.map-labels :global(.map-physical) {
		position: absolute;
		top: 0;
		left: 0;
		color: var(--map-text);
		font-family: var(--font-display);
		font-size: 10.5px;
		font-style: italic;
		letter-spacing: 0.03em;
		white-space: nowrap;
		line-height: 1;
		text-shadow:
			0 0 4px var(--map-paper),
			0 1px 8px var(--map-paper);
		opacity: 0.66;
	}
	.map-labels :global(.map-unit) {
		position: absolute;
		top: 0;
		left: 0;
		color: var(--map-text);
		font-family: var(--font-display);
		font-size: 9.5px;
		font-style: italic;
		letter-spacing: 0.02em;
		white-space: nowrap;
		line-height: 1;
		text-shadow:
			0 0 4px var(--map-paper),
			0 1px 8px var(--map-paper);
		opacity: 0.6;
	}
	.map-loading {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		z-index: 3;
		color: var(--text-3);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		background: var(--map-paper);
	}
	.map-loading .dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent-1);
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
		background: var(--map-paper);
		color: var(--text-2);
	}
	.map-failed .hint {
		color: var(--text-3);
		font-size: 0.85rem;
	}
	.instruments {
		position: absolute;
		left: calc(18rem + 1.4rem);
		bottom: 0.8rem;
		z-index: 3;
		display: flex;
		align-items: flex-end;
		gap: 0.7rem;
		color: var(--text-3);
		pointer-events: none;
	}
	.scale {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-bottom: 0.1rem;
		font-family: var(--font-mono);
		font-size: 0.56rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-3);
		text-shadow: 0 1px 4px var(--map-paper);
	}
	.scale-bar {
		display: block;
		height: 6px;
		border: 1px solid var(--text-3);
		border-top: 0;
		opacity: 0.7;
	}
	.projection {
		color: var(--text-4);
		font-size: 0.54rem;
	}
	.attribution {
		color: var(--text-4);
		font-size: 0.48rem;
		letter-spacing: 0.03em;
		text-transform: none;
	}
	.map-vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		box-shadow: inset 0 0 160px color-mix(in oklab, var(--map-paper) 45%, transparent);
	}
	:global(.maplibregl-canvas) {
		outline: none;
	}
	:global(.maplibregl-ctrl-attrib) {
		display: none;
	}
	@media (max-width: 900px) {
		.instruments {
			left: 0.8rem;
			bottom: calc(7.4rem + env(safe-area-inset-bottom));
		}
		.projection {
			display: none;
		}
	}
	@media (min-width: 1400px) {
		.projection {
			display: none;
		}
	}
	@media (max-width: 620px) {
		.scale {
			font-size: 0.45rem;
		}
		.projection {
			display: none;
		}
	}
</style>
