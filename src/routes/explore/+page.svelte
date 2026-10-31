<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate, replaceState } from '$app/navigation';
	import MapCanvas from '#lib/components/map/MapCanvas.svelte';
	import LayerRail from '#lib/components/map/LayerRail.svelte';
	import Legend from '#lib/components/map/Legend.svelte';
	import Timeline from '#lib/components/map/Timeline.svelte';
	import CountryCard from '#lib/components/cards/CountryCard.svelte';
	import TopBar from '#lib/components/navigation/TopBar.svelte';
		import Icon from '#lib/components/ui/Icon.svelte';
	import { getLayer } from '#lib/configurations/map-layers';
	import { countries, getCountry, indicatorKeys } from '#lib/data/countries';
	import { organizationById } from '#lib/data/organizations';
	import { formatLatLng } from '#lib/format';
	import { membershipAt } from '#lib/data/timeline';
	import { theme } from '#lib/theme.svelte';
	import { layerById } from '#lib/configurations/map-layers';
	import type { LayerId } from '#lib/types';

	let layerId = $state<LayerId>('political');
	let selected = $state<string | null>(null);
	let bloc = $state<string | null>(null);
	let hovered = $state<string | null>(null);
	let mapRef: MapCanvas | null = null;
	let view = $state({ lat: 0, lng: 0, zoom: 1.3 });
	let projection = $state<'mercator' | 'globe'>('mercator');
	let terrain = $state(false);
	let mobileLegend = $state(false);
	let hintDismissed = $state(false);
	let historyYear = $state<number | null>(null);
	let urlsReady = false;

	const layer = $derived(getLayer(layerId, theme.resolved));
	const country = $derived(getCountry(selected));
	const highlight = $derived(
		bloc
			? (organizationById.get(bloc)?.members ?? [])
			: layerId === 'history' && historyYear
				? membershipAt(historyYear)
				: selected
					? (getCountry(selected)?.borders ?? [])
					: []
	);
	const hoveredName = $derived(hovered ? getCountry(hovered)?.name : null);

	onMount(() => {
		const params = page.url.searchParams;
		const requestedLayer = params.get('layer') as LayerId | null;
		if (requestedLayer && layerById.has(requestedLayer)) layerId = requestedLayer;
		const requestedCountry = params.get('country');
		if (requestedCountry && getCountry(requestedCountry)) selected = requestedCountry;
		if (params.get('globe') === '1') projection = 'globe';
		if (params.get('terrain') === '1') terrain = true;
		const requestedYear = Number(params.get('year'));
		if (requestedYear >= 1945 && requestedYear <= 2026) historyYear = requestedYear;
		if (projection === 'globe') terrain = false;
		urlsReady = true;
	});

	$effect(() => {
		if (!urlsReady) return;
		const params = new URLSearchParams();
		params.set('layer', layerId);
		if (selected) params.set('country', selected);
		if (projection === 'globe') params.set('globe', '1');
		if (terrain) params.set('terrain', '1');
		if (layerId === 'history' && historyYear) params.set('year', String(historyYear));
		const next = params.toString();
		if (page.url.searchParams.toString() === next) return;
		const url = new URL(window.location.href);
		url.search = next;
		replaceState(url, {});
	});

	function applyUrlState(params: URLSearchParams) {
		const requestedLayer = params.get('layer') as LayerId | null;
		if (requestedLayer && layerById.has(requestedLayer) && requestedLayer !== layerId) {
			changeLayer(requestedLayer);
		}
		const requestedCountry = params.get('country');
		if (requestedCountry && getCountry(requestedCountry) && requestedCountry !== selected) {
			select(requestedCountry);
		}
		if (params.get('globe') === '1' && projection !== 'globe') setProjection('globe');
		if (params.get('globe') !== '1' && projection === 'globe') setProjection('mercator');
		if (params.get('terrain') === '1' && !terrain) toggleTerrain();
		if (params.get('terrain') !== '1' && terrain) terrain = false;
		const requestedYear = Number(params.get('year'));
		if (requestedYear >= 1945 && requestedYear <= 2026 && requestedYear !== historyYear) {
			historyYear = requestedYear;
		}
	}

	afterNavigate(({ to }) => {
		if (!to) return;
		applyUrlState(to.url.searchParams);
	});

	function changeLayer(id: LayerId) {
		layerId = id;
		const layerConfig = getLayer(id, theme.resolved);
		if (!layerConfig.blocs?.includes(bloc ?? '')) bloc = null;
		if (id !== 'history') historyYear = null;
		hintDismissed = false;
	}

	function toggleBloc(id: string | null) {
		bloc = id;
		if (id) {
			const org = organizationById.get(id);
			if (org && selected && !org.members.includes(selected)) selected = null;
		}
	}

	function select(code: string) {
		selected = code;
		hintDismissed = true;
		const target = getCountry(code);
		const currentZoom = mapRef?.getMap()?.getZoom() ?? view.zoom;
		if (target?.latlng && currentZoom < 2.9) {
			mapRef?.flyTo([target.latlng[1], target.latlng[0]], 3);
		}
	}

	function closeCard() {
		selected = null;
	}

	function setProjection(next: 'mercator' | 'globe') {
		projection = next;
		if (next === 'globe') terrain = false;
	}

	function toggleTerrain() {
		terrain = !terrain;
		if (terrain && projection === 'globe') projection = 'mercator';
	}

	function onKeydown(event: KeyboardEvent) {
		const tag = (event.target as HTMLElement | null)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || event.metaKey || event.ctrlKey || event.altKey) return;
		if (event.key === 'Escape') {
			if (selected) selected = null;
			return;
		}
		if (event.key === 'g') {
			setProjection(projection === 'globe' ? 'mercator' : 'globe');
		} else if (event.key === 't') {
			toggleTerrain();
		} else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
			const ids = ['political', 'physical', 'population', 'economy', 'geopolitics', 'history'] as LayerId[];
			const index = ids.indexOf(layerId);
			const delta = event.key === 'ArrowRight' ? 1 : -1;
			changeLayer(ids[(index + delta + ids.length) % ids.length]);
			event.preventDefault();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>Explorar — Mundivista</title>
	<meta
		name="description"
		content="Explore o mundo em camadas: fronteiras, relevo, demografia, economia, geopolítica e história."
	/>
</svelte:head>

<div class="explore" id="conteudo">
	<MapCanvas
		bind:this={mapRef}
		{layer}
		{selected}
		{highlight}
		{projection}
		{terrain}
		onselect={select}
		onhover={(code) => (hovered = code)}
		onview={(v) => (view = v)}
		onready={() => {
			if (selected) select(selected);
		}}
	/>

	<TopBar />

	<LayerRail active={layerId} onchange={changeLayer} {bloc} onbloc={toggleBloc} />

	<Legend {layer} {bloc} />

	{#if layerId === 'history'}
		<Timeline
			year={historyYear}
			onchange={(year) => (historyYear = year)}
			onfly={(center, zoom) => mapRef?.flyTo(center, zoom)}
		/>
	{/if}

	<div class="layer-caption">
		<span class="eyebrow">{layer.index} · Camada</span>
		<strong>{layer.label}</strong>
		<p>{layer.description}</p>
	</div>

	{#if country}
		<CountryCard {country} {layer} onclose={closeCard} onnavigate={select} />
	{/if}

	{#if !country && !hintDismissed}
		<div class="hint animate-fade-up">
			<button type="button" class="hint-close" onclick={() => (hintDismissed = true)} aria-label="Fechar dica">
				<Icon name="close" size={12} />
			</button>
			<span class="eyebrow">Exploração livre</span>
			<p>Clique em um país para abrir o dossiê da camada <strong>{layer.label.toLowerCase()}</strong>.</p>
			<p class="keys"><kbd>←</kbd><kbd>→</kbd> camadas · <kbd>g</kbd> globo · <kbd>t</kbd> relevo · <kbd>⌘K</kbd> busca</p>
		</div>
	{/if}

	<div class="controls" class:shifted={!!country}>
		<div class="coord">
			{#if hoveredName}
				<span class="hovered">{hoveredName}</span>
			{:else}
				<span>{formatLatLng(view.lat, view.lng)}</span>
			{/if}
			<span class="zoom">z{view.zoom.toFixed(1)}</span>
		</div>
		<div class="switch-row">
			<div class="segmented" role="group" aria-label="Projeção do mapa">
				<button
					type="button"
					class:active={projection === 'mercator'}
					onclick={() => setProjection('mercator')}
					title="Projeção Mercator"
				>
					<Icon name="compass" size={13} /> 2D
				</button>
				<button
					type="button"
					class:active={projection === 'globe'}
					onclick={() => setProjection('globe')}
					title="Globo 3D"
				>
					<Icon name="globe3d" size={13} /> Globo
				</button>
			</div>
			<button
				type="button"
				class="terrain-toggle"
				class:active={terrain}
				onclick={toggleTerrain}
				title="Relevo 3D com modelo digital de elevação"
				aria-pressed={terrain}
			>
				<Icon name="peak" size={13} /> Relevo
			</button>
			<button
				type="button"
				class="terrain-toggle mobile-legend-toggle"
				class:active={mobileLegend}
				onclick={() => (mobileLegend = !mobileLegend)}
				aria-pressed={mobileLegend}
			>
				<Icon name="layers" size={13} /> Legenda
			</button>
		</div>
		<div class="buttons">
			<button type="button" onclick={() => mapRef?.zoomBy(0.6)} aria-label="Aproximar">
				<Icon name="plus" size={16} />
			</button>
			<button type="button" onclick={() => mapRef?.zoomBy(-0.6)} aria-label="Afastar">
				<Icon name="minus" size={16} />
			</button>
			<button type="button" onclick={() => mapRef?.resetView()} aria-label="Voltar ao mundo">
				<Icon name="reset" size={15} />
			</button>
		</div>
		<a class="sources" href="/sobre">Fontes e métodos</a>
	</div>

	{#if mobileLegend}
		<div class="mobile-legend panel">
			<Legend {layer} {bloc} />
			<button type="button" class="legend-close" onclick={() => (mobileLegend = false)}>
				Fechar legenda
			</button>
		</div>
	{/if}

	<div class="statusbar" class:hidden={layerId === 'history'} aria-hidden="true">
		<span>{countries.length} territórios</span>
		<span>·</span>
		<span>{indicatorKeys.length} indicadores</span>
		<span>·</span>
		<span>{projection === 'globe' ? 'Globo' : 'Mercator'}</span>
		<span>·</span>
		<span>Natural Earth 1:50m</span>
		{#if terrain}
			<span>·</span>
			<span>Elevação: AWS Terrain Tiles</span>
		{/if}
	</div>

</div>

<style>
	.explore {
		position: fixed;
		inset: 0;
		background: var(--map-paper);
	}
	.layer-caption {
		position: fixed;
		top: calc(var(--header-h) + 0.85rem);
		left: 0.75rem;
		z-index: 26;
		width: 15.5rem;
		padding: 0.5rem 0.6rem;
		background: color-mix(in oklab, var(--surface-2) 94%, transparent);
		border: 1px solid var(--line);
		pointer-events: none;
	}
	.layer-caption .eyebrow {
		font-size: 0.46rem;
	}
	.layer-caption strong {
		display: block;
		margin-top: 0.22rem;
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-1);
	}
	.layer-caption p {
		margin: 0.12rem 0 0;
		font-size: 0.6rem;
		line-height: 1.4;
		color: var(--text-3);
	}
	.hint {
		position: fixed;
		top: calc(var(--header-h) + 0.85rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 27;
		max-width: 24rem;
		padding: 0.55rem 1.8rem 0.55rem 0.7rem;
		background: var(--surface-2);
		border: 1px solid var(--line);
		text-align: left;
	}
	.hint-close {
		position: absolute;
		top: 0.3rem;
		right: 0.3rem;
		border: 0;
		background: transparent;
		color: var(--text-4);
		padding: 0.2rem;
		display: grid;
		place-items: center;
	}
	.hint-close:hover {
		color: var(--text-1);
	}
	.hint p {
		margin: 0.2rem 0 0;
		font-size: 0.66rem;
		color: var(--text-3);
		line-height: 1.45;
	}
	.hint strong {
		color: var(--accent-0);
		font-weight: 550;
	}
	.hint .keys {
		margin-top: 0.35rem;
		font-family: var(--font-mono);
		font-size: 0.48rem;
		color: var(--text-4);
	}
	kbd {
		font-family: var(--font-mono);
		border: 1px solid var(--line);
		padding: 0 0.18rem;
		margin-right: 0.1rem;
		font-size: 0.46rem;
	}
	.controls {
		position: fixed;
		right: 0.75rem;
		bottom: 0.75rem;
		z-index: 30;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.4rem;
		transition: right var(--motion-panel) var(--ease-out-soft);
	}
	.controls.shifted {
		right: calc(var(--sheet-w) + 1.35rem);
	}
	.coord {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.52rem;
		letter-spacing: 0.04em;
		color: var(--text-3);
		background: color-mix(in oklab, var(--surface-2) 90%, transparent);
		border: 1px solid var(--line);
		padding: 0.2rem 0.45rem;
	}
	.hovered {
		color: var(--accent-0);
	}
	.zoom {
		color: var(--text-4);
	}
	.switch-row {
		display: flex;
		align-items: stretch;
		gap: 0.3rem;
	}
	.segmented {
		display: inline-flex;
		border: 1px solid var(--line);
		background: var(--surface-2);
	}
	.segmented button,
	.terrain-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		border: 0;
		background: transparent;
		color: var(--text-3);
		padding: 0.35rem 0.5rem;
		font-size: 0.6rem;
		transition: background 0.15s ease, color 0.15s ease;
	}
	.segmented button + button {
		border-left: 1px solid var(--line);
	}
	.terrain-toggle {
		border: 1px solid var(--line);
		background: var(--surface-2);
	}
	.segmented button:hover,
	.terrain-toggle:hover {
		color: var(--text-1);
	}
	.segmented button.active,
	.terrain-toggle.active {
		background: color-mix(in oklab, var(--accent-1) 16%, var(--surface-2));
		color: var(--accent-2);
	}
	.mobile-legend-toggle {
		display: none;
	}
	.buttons {
		display: flex;
		gap: 1px;
		border: 1px solid var(--line);
		background: var(--surface-2);
	}
	.buttons button {
		display: grid;
		place-items: center;
		width: 1.8rem;
		height: 1.8rem;
		border: 0;
		background: transparent;
		color: var(--text-3);
		transition: background 0.15s ease, color 0.15s ease;
	}
	.buttons button + button {
		border-left: 1px solid var(--line);
	}
	.buttons button:hover {
		background: var(--surface-3);
		color: var(--text-1);
	}
	.sources {
		font-family: var(--font-mono);
		font-size: 0.48rem;
		letter-spacing: 0.06em;
		color: var(--text-4);
		text-decoration: none;
	}
	.sources:hover {
		color: var(--text-2);
	}
	.statusbar {
		position: fixed;
		left: 50%;
		bottom: 0.9rem;
		transform: translateX(-50%);
		z-index: 24;
		display: none;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.46rem;
		letter-spacing: 0.05em;
		color: var(--text-4);
	}
	.mobile-legend {
		display: none;
	}
	.statusbar.hidden {
		display: none;
	}
	@media (min-width: 1200px) {
		.statusbar {
			display: flex;
		}
	}
	@media (max-width: 900px) {
		.layer-caption,
		.hint {
			display: none;
		}
		.controls {
			bottom: calc(7.5rem + env(safe-area-inset-bottom));
			right: 0.5rem;
		}
		.controls.shifted {
			right: 0.5rem;
		}
		.mobile-legend-toggle {
			display: inline-flex;
		}
		.mobile-legend {
			display: block;
			position: fixed;
			left: 0.4rem;
			right: 0.4rem;
			bottom: calc(7.5rem + env(safe-area-inset-bottom));
			z-index: 33;
			padding: 0.5rem;
		}
		.mobile-legend :global(.legend) {
			display: block;
			position: static;
			width: auto;
			border: 0;
			box-shadow: none;
			background: transparent;
			padding: 0;
		}
		.legend-close {
			width: 100%;
			border: 1px solid var(--line);
			background: var(--surface-1);
			color: var(--text-3);
			font-size: 0.6rem;
			padding: 0.35rem;
			margin-top: 0.35rem;
		}
		.coord {
			font-size: 0.48rem;
		}
	}
	@media (max-width: 620px) {
		.terrain-toggle {
			padding: 0.35rem 0.42rem;
		}
		.terrain-toggle :global(svg) {
			margin: 0;
		}
	}
</style>
