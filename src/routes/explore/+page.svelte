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
	import { loadSubdivisions, type SubdivisionCollection } from '#lib/data/subdivisions';
	import { formatLatLng } from '#lib/format';
	import { membershipAt } from '#lib/data/timeline';
	import { theme } from '#lib/theme.svelte';
	import { layerById } from '#lib/configurations/map-layers';
	import type { LayerId } from '#lib/types';

	let layerId = $state<LayerId>('standard');
	let selected = $state<string | null>(null);
	let bloc = $state<string | null>(null);
	let hovered = $state<string | null>(null);
	let mapRef = $state<MapCanvas | null>(null);
	let view = $state({ lat: 0, lng: 0, zoom: 1.8 });
	let terrain = $state(false);
	let mobileLegend = $state(false);
	let hintDismissed = $state(false);
	let historyYear = $state<number | null>(null);
	let highlightNeighbors = $state(false);
	let projection = $state<'globe' | 'flat'>('flat');
	let subdivisions = $state<SubdivisionCollection | null>(null);
	let subdivisionsLoading = $state(false);
	let activeSubdivision = $state<string | null>(null);
	let urlsReady = false;
	let syncedQuery = '';

	const layer = $derived(getLayer(layerId, theme.resolved));
	const country = $derived(getCountry(selected));
	const highlight = $derived(
		bloc
			? (organizationById.get(bloc)?.members ?? [])
			: layerId === 'history' && historyYear
				? membershipAt(historyYear)
				: selected && highlightNeighbors
					? (getCountry(selected)?.borders ?? [])
					: []
	);
	const hoveredName = $derived(hovered ? getCountry(hovered)?.name : null);
	const layerParam = (params: Pick<URLSearchParams, 'get'>): LayerId => {
		const requested = params.get('layer') as LayerId | null;
		return requested && layerById.has(requested) ? requested : 'standard';
	};
	const projectionParam = (params: Pick<URLSearchParams, 'get'>): 'globe' | 'flat' =>
		params.get('projection') === 'globe' || params.get('view') === '3d' || params.get('globe') === '1'
			? 'globe'
			: 'flat';

	onMount(() => {
		const params = page.url.searchParams;
		layerId = layerParam(params);
		const requestedCountry = params.get('country');
		if (requestedCountry && getCountry(requestedCountry)) selected = requestedCountry;
		projection = projectionParam(params);
		// Links antigos de relevo implicavam globo; mantém o comportamento.
		if (params.get('terrain') === '1' && params.get('projection') !== 'flat' && params.get('view') !== '2d') {
			projection = 'globe';
		}
		terrain = params.get('terrain') === '1' && projection === 'globe';
		const requestedYear = Number(params.get('year'));
		if (requestedYear >= 1945 && requestedYear <= 2026) historyYear = requestedYear;
		hintDismissed = localStorage.getItem('mundivista:hint') === '1';
		urlsReady = true;
	});

	function dismissHint() {
		hintDismissed = true;
		localStorage.setItem('mundivista:hint', '1');
	}

	$effect(() => {
		if (!urlsReady) return;
		const params = new URLSearchParams();
		if (layerId !== 'standard') params.set('layer', layerId);
		if (selected) params.set('country', selected);
		if (terrain) params.set('terrain', '1');
		if (projection === 'globe') params.set('projection', 'globe');
		if (layerId === 'history' && historyYear) params.set('year', String(historyYear));
		const next = params.toString();
		if (next === syncedQuery) return;
		syncedQuery = next;
		const url = new URL(window.location.href);
		url.search = next;
		replaceState(url, {});
	});

	$effect(() => {
		const code = selected;
		if (!code || layerId !== 'political') {
			subdivisions = null;
			subdivisionsLoading = false;
			return;
		}
		subdivisionsLoading = true;
		subdivisions = null;
		let cancelled = false;
		loadSubdivisions(code).then((data) => {
			if (cancelled || selected !== code) return;
			subdivisions = data;
			subdivisionsLoading = false;
		});
		return () => {
			cancelled = true;
		};
	});

	function applyUrlState(params: URLSearchParams) {
		const requestedLayer = layerParam(params);
		if (requestedLayer !== layerId) {
			layerId = requestedLayer;
			const layerConfig = getLayer(requestedLayer, theme.resolved);
			if (!layerConfig.blocs?.includes(bloc ?? '')) bloc = null;
			if (requestedLayer !== 'history') historyYear = null;
			activeSubdivision = null;
		}
		const requestedCountry = params.get('country');
		if (requestedCountry && getCountry(requestedCountry) && requestedCountry !== selected) {
			select(requestedCountry);
		}
		const requestedProjection =
			params.get('terrain') === '1' && params.get('projection') !== 'flat' && params.get('view') !== '2d'
				? 'globe'
				: projectionParam(params);
		if (requestedProjection !== projection) setProjection(requestedProjection);
		const wantsTerrain = params.get('terrain') === '1' && requestedProjection === 'globe';
		if (wantsTerrain !== terrain) terrain = wantsTerrain;
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
		const next = id === layerId && id !== 'standard' ? 'standard' : id;
		layerId = next;
		const layerConfig = getLayer(next, theme.resolved);
		if (!layerConfig.blocs?.includes(bloc ?? '')) bloc = null;
		if (next !== 'history') historyYear = null;
		activeSubdivision = null;
	}

	function toggleBloc(id: string | null) {
		bloc = id;
		if (id) {
			const org = organizationById.get(id);
			if (org && selected && !org.members.includes(selected)) selected = null;
		}
	}

	function select(code: string) {
		if (code !== selected) {
			highlightNeighbors = false;
			activeSubdivision = null;
		}
		selected = code;
		dismissHint();
		const target = getCountry(code);
		if (target?.latlng) {
			mapRef?.focusCountry([target.latlng[1], target.latlng[0]], target.areaKm2);
		}
	}

	function closeCard() {
		selected = null;
		highlightNeighbors = false;
		activeSubdivision = null;
	}

	function setProjection(next: 'globe' | 'flat') {
		projection = next;
		if (next === 'flat') terrain = false;
	}

	function toggleTerrain() {
		if (projection === 'flat') return;
		terrain = !terrain;
	}

	function onKeydown(event: KeyboardEvent) {
		const tag = (event.target as HTMLElement | null)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || event.metaKey || event.ctrlKey || event.altKey) return;
		if (event.key === 'Escape') {
			if (selected) closeCard();
			return;
		}
		if (event.key === 'g') {
			setProjection(projection === 'globe' ? 'flat' : 'globe');
		} else if (event.key === 't') {
			toggleTerrain();
		} else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
			const ids = ['political', 'physical', 'population', 'economy', 'geopolitics', 'history'] as LayerId[];
			if (layerId === 'standard') {
				changeLayer(event.key === 'ArrowRight' ? ids[0] : ids[ids.length - 1]);
			} else {
				const index = ids.indexOf(layerId);
				const delta = event.key === 'ArrowRight' ? 1 : -1;
				changeLayer(ids[(index + delta + ids.length) % ids.length]);
			}
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
	{#key projection}
		<MapCanvas
			bind:this={mapRef}
			{projection}
			{layer}
			{selected}
			{highlight}
			{terrain}
			{subdivisions}
			{activeSubdivision}
			onselect={select}
			onhover={(code) => (hovered = code)}
			onview={(v) => (view = v)}
			onready={() => {
				if (selected) select(selected);
			}}
		/>
	{/key}

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

	{#if country}
		<CountryCard
			{country}
			{layer}
			onclose={closeCard}
			onnavigate={select}
			neighborsHighlighted={highlightNeighbors && !bloc && !(layerId === 'history' && historyYear)}
			ontoggleneighbors={() => {
				if (!highlightNeighbors) {
					bloc = null;
					if (layerId === 'history') historyYear = null;
				}
				highlightNeighbors = !highlightNeighbors;
			}}
			{subdivisions}
			{subdivisionsLoading}
			{activeSubdivision}
			onunit={(id) => (activeSubdivision = id)}
			onfly={(center, zoom) => mapRef?.flyTo(center, zoom ?? 5)}
		/>
	{/if}

	{#if !country && !hintDismissed}
		<div class="hint animate-fade-up">
			<button type="button" class="hint-close" onclick={dismissHint} aria-label="Fechar dica">
				<Icon name="close" size={12} />
			</button>
			<span class="eyebrow">Exploração livre</span>
			<p>Clique em um país para abrir o dossiê. Escolha uma camada no filtro para sobrepor dados ao mapa.</p>
			<p class="keys"><kbd>←</kbd><kbd>→</kbd> camadas · <kbd>g</kbd> 2D/globo · <kbd>t</kbd> relevo · <kbd>⌘K</kbd> busca</p>
		</div>
	{/if}

	<div class="controls" class:shifted={!!country}>
		<div class="hud">
			<div class="readout">
				{#if hoveredName}
					<span class="readout-main hovered">{hoveredName}</span>
				{:else}
					<span class="readout-main">{formatLatLng(view.lat, view.lng)}</span>
				{/if}
				<span class="readout-meta">z{view.zoom.toFixed(1)}</span>
			</div>
			<div class="switch-row">
				<div class="segmented" role="group" aria-label="Projeção do mapa">
					<button
						type="button"
						class:active={projection === 'flat'}
						onclick={() => setProjection('flat')}
						title="Mapa 2D em Equal Earth, com áreas proporcionais (padrão)"
					>
						<Icon name="compass" size={14} /> 2D
					</button>
					<button
						type="button"
						class:active={projection === 'globe'}
						onclick={() => setProjection('globe')}
						title="Globo 3D, com relevo opcional"
					>
						<Icon name="globe3d" size={14} /> Globo
					</button>
				</div>
				<button
					type="button"
					class="terrain-toggle"
					class:active={terrain}
					onclick={toggleTerrain}
					disabled={projection === 'flat'}
					title={projection === 'flat' ? 'Relevo disponível no globo 3D: o DEM é Mercator' : 'Relevo 3D com modelo digital de elevação'}
					aria-pressed={terrain}
				>
					<Icon name="peak" size={14} /> Relevo
				</button>
				<button
					type="button"
					class="terrain-toggle mobile-legend-toggle"
					class:active={mobileLegend}
					onclick={() => (mobileLegend = !mobileLegend)}
					aria-pressed={mobileLegend}
				>
					<Icon name="layers" size={14} /> Legenda
				</button>
			</div>
			<div class="buttons">
				<button type="button" onclick={() => mapRef?.zoomBy(0.6)} aria-label="Aproximar" title="Aproximar">
					<Icon name="plus" size={17} />
				</button>
				<button type="button" onclick={() => mapRef?.zoomBy(-0.6)} aria-label="Afastar" title="Afastar">
					<Icon name="minus" size={17} />
				</button>
				<button type="button" onclick={() => mapRef?.resetView()} aria-label="Voltar ao mundo" title="Voltar ao mundo">
					<Icon name="reset" size={16} />
				</button>
			</div>
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

	<div class="statusbar" class:hidden={layerId === 'history' || !!country} aria-hidden="true">
		<span>{countries.length} territórios</span>
		<span>·</span>
		<span>{indicatorKeys.length} indicadores</span>
		<span>·</span>
		<span>{projection === 'flat' ? '2D · Equal Earth' : 'Globo 3D'}</span>
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
	.hint {
		position: fixed;
		top: calc(var(--header-h) + 0.8rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 27;
		width: min(26rem, calc(100vw - 2rem));
		padding: 0.7rem 2rem 0.75rem 0.85rem;
		background: color-mix(in oklab, var(--surface-2) 96%, transparent);
		border: 1px solid var(--line);
		border-left: 2px solid var(--accent-1);
		border-radius: 0.25rem;
		box-shadow: 0 22px 44px -34px rgb(0 0 0 / 0.6);
		text-align: left;
	}
	.hint-close {
		position: absolute;
		top: 0.35rem;
		right: 0.35rem;
		border: 0;
		background: transparent;
		color: var(--text-4);
		padding: 0.25rem;
		display: grid;
		place-items: center;
	}
	.hint-close:hover {
		color: var(--text-1);
	}
	.hint .eyebrow {
		font-size: 0.54rem;
	}
	.hint p {
		margin: 0.28rem 0 0;
		font-size: 0.8rem;
		color: var(--text-3);
		line-height: 1.5;
	}
	.hint .keys {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.22rem;
		margin-top: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.58rem;
		color: var(--text-4);
	}
	kbd {
		font-family: var(--font-mono);
		border: 1px solid var(--line);
		border-radius: 0.12rem;
		background: var(--surface-1);
		padding: 0.06rem 0.28rem;
		margin-right: 0.08rem;
		font-size: 0.5rem;
		line-height: 1.3;
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
	.hud {
		display: flex;
		flex-direction: column;
		width: 15rem;
		max-width: calc(100vw - 1.5rem);
		background: color-mix(in oklab, var(--surface-2) 96%, transparent);
		border: 1px solid var(--line);
		border-radius: 0.25rem;
		box-shadow: 0 20px 40px -30px rgb(0 0 0 / 0.6);
		overflow: hidden;
	}
	.readout {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		min-height: 1.9rem;
		padding: 0.32rem 0.55rem;
		border-bottom: 1px solid var(--line);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.03em;
		color: var(--text-3);
	}
	.readout-main {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.readout-meta {
		flex-shrink: 0;
		color: var(--text-4);
	}
	.hovered {
		color: var(--accent-0);
	}
	.switch-row {
		display: flex;
		align-items: stretch;
		gap: 0.28rem;
		padding: 0.3rem;
	}
	.segmented {
		display: inline-flex;
		flex: 1;
		min-width: 0;
		border: 1px solid var(--line);
		border-radius: 0.16rem;
		background: var(--surface-1);
		overflow: hidden;
	}
	.segmented button,
	.terrain-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.28rem;
		min-height: 2rem;
		border: 0;
		background: transparent;
		color: var(--text-3);
		padding: 0 0.48rem;
		font-size: 0.74rem;
		font-weight: 500;
		white-space: nowrap;
		transition: background 0.15s ease, color 0.15s ease;
	}
	.segmented button {
		flex: 1;
	}
	.segmented button + button {
		border-left: 1px solid var(--line);
	}
	.terrain-toggle {
		border: 1px solid var(--line);
		border-radius: 0.16rem;
		background: var(--surface-1);
	}
	.segmented button:hover,
	.terrain-toggle:hover:not(:disabled) {
		color: var(--text-1);
	}
	.segmented button.active,
	.terrain-toggle.active {
		background: color-mix(in oklab, var(--accent-1) 17%, var(--surface-2));
		color: var(--accent-2);
	}
	.terrain-toggle:disabled {
		opacity: 0.42;
		cursor: not-allowed;
	}
	.mobile-legend-toggle {
		display: none;
	}
	.buttons {
		display: flex;
		border-top: 1px solid var(--line);
		background: var(--surface-1);
	}
	.buttons button {
		display: grid;
		place-items: center;
		flex: 1;
		height: 2.35rem;
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
		font-size: 0.6rem;
		letter-spacing: 0.05em;
		color: var(--text-4);
		text-decoration: none;
	}
	.sources:hover {
		color: var(--text-2);
	}
	.statusbar {
		position: fixed;
		left: 50%;
		bottom: 0.8rem;
		transform: translateX(-50%);
		z-index: 24;
		display: none;
		align-items: center;
		gap: 0.45rem;
		padding: 0.3rem 0.55rem;
		background: color-mix(in oklab, var(--surface-2) 84%, transparent);
		border: 1px solid var(--line);
		border-radius: 0.2rem;
		font-family: var(--font-mono);
		font-size: 0.6rem;
		letter-spacing: 0.04em;
		color: var(--text-4);
		white-space: nowrap;
	}
	.mobile-legend {
		display: none;
	}
	.statusbar.hidden {
		display: none;
	}
	@media (min-width: 1400px) {
		.statusbar {
			display: flex;
		}
	}
	@media (max-width: 900px) {
		.hint {
			display: none;
		}
		.controls {
			top: calc(var(--header-h) + 0.55rem);
			right: 0.5rem;
			bottom: auto;
		}
		.controls.shifted {
			right: 0.5rem;
		}
		.hud {
			width: auto;
			min-width: 12.5rem;
		}
		.readout {
			display: none;
		}
		.sources {
			display: none;
		}
		.mobile-legend-toggle {
			display: inline-flex;
		}
		.mobile-legend {
			display: block;
			position: fixed;
			top: calc(var(--header-h) + 5.2rem);
			left: 0.4rem;
			right: 0.4rem;
			bottom: auto;
			z-index: 36;
			padding: 0.55rem;
			max-height: calc(100dvh - var(--header-h) - 5.6rem);
			overflow-y: auto;
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
		.mobile-legend :global(.legend .legend-toggle) {
			display: none;
		}
		.legend-close {
			width: 100%;
			border: 1px solid var(--line);
			background: var(--surface-1);
			color: var(--text-3);
			font-size: 0.62rem;
			padding: 0.4rem;
			margin-top: 0.45rem;
		}
		.readout {
			font-size: 0.56rem;
		}
	}
	@media (max-width: 620px) {
		.terrain-toggle {
			padding: 0 0.38rem;
		}
		.segmented button {
			padding: 0 0.38rem;
		}
		.terrain-toggle :global(svg),
		.segmented button :global(svg) {
			margin: 0;
		}
	}
</style>
