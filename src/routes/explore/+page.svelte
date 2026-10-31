<script lang="ts">
	import MapCanvas from '#lib/components/map/MapCanvas.svelte';
	import LayerRail from '#lib/components/map/LayerRail.svelte';
	import Legend from '#lib/components/map/Legend.svelte';
	import CountryCard from '#lib/components/cards/CountryCard.svelte';
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { getLayer } from '#lib/configurations/map-layers';
	import { countries, getCountry } from '#lib/data/countries';
	import { organizationById } from '#lib/data/organizations';
	import { formatLatLng } from '#lib/format';
	import type { LayerId } from '#lib/types';

	let layerId = $state<LayerId>('political');
	let selected = $state<string | null>('BRA');
	let bloc = $state<string | null>(null);
	let hovered = $state<string | null>(null);
	let mapRef: MapCanvas | null = null;
	let view = $state({ lat: 0, lng: 0, zoom: 1.3 });

	const layer = $derived(getLayer(layerId));
	const country = $derived(getCountry(selected));
	const highlight = $derived(bloc ? (organizationById.get(bloc)?.members ?? []) : []);
	const hoveredName = $derived(hovered ? getCountry(hovered)?.name : null);

	function changeLayer(id: LayerId) {
		layerId = id;
		const layerConfig = getLayer(id);
		if (!layerConfig.blocs?.includes(bloc ?? '')) bloc = null;
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
		const target = getCountry(code);
		const currentZoom = mapRef?.getMap()?.getZoom() ?? view.zoom;
		if (target?.latlng && currentZoom < 2.2) {
			mapRef?.flyTo([target.latlng[1], target.latlng[0]], 2.7);
		}
	}

	function closeCard() {
		selected = null;
	}
</script>

<svelte:head>
	<title>Explorar — Mundivista</title>
	<meta
		name="description"
		content="Explore o mundo em camadas: fronteiras, relevo, demografia, economia e geopolítica."
	/>
</svelte:head>

<div class="explore">
	<MapCanvas
		bind:this={mapRef}
		{layer}
		{selected}
		{highlight}
		onselect={select}
		onhover={(code) => (hovered = code)}
		onview={(v) => (view = v)}
	/>

	<TopBar />

	<LayerRail active={layerId} onchange={changeLayer} {bloc} onbloc={toggleBloc} />

	<Legend {layer} {bloc} />

	{#if country}
		<CountryCard
			{country}
			{layer}
			onclose={closeCard}
			onnavigate={select}
		/>
	{/if}

	{#if !country}
		<div class="hint animate-fade-up">
			<span class="eyebrow">Exploração livre</span>
			<p>Clique em um país para abrir o dossiê da camada <strong>{layer.label.toLowerCase()}</strong>.</p>
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

	<div class="statusbar" aria-hidden="true">
		<span>{countries.length} territórios</span>
		<span>·</span>
		<span>20 indicadores</span>
		<span>·</span>
		<span>Natural Earth 1:50m</span>
	</div>
</div>

<style>
	.explore {
		position: fixed;
		inset: 0;
		background: #070b12;
	}
	.hint {
		position: fixed;
		top: calc(var(--header-h) + 1rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 26;
		max-width: 26rem;
		padding: 0.6rem 0.85rem;
		border-radius: 0.6rem;
		background: color-mix(in oklab, #0b1119 82%, transparent);
		border: 1px solid rgba(255, 255, 255, 0.075);
		backdrop-filter: blur(16px);
		text-align: center;
		pointer-events: none;
	}
	.hint p {
		margin: 0.25rem 0 0;
		font-size: 0.7rem;
		color: var(--color-mist-300);
	}
	.hint strong {
		color: var(--color-gold-300);
		font-weight: 500;
	}
	.controls.shifted {
		right: 25.2rem;
	}
	.controls {
		position: fixed;
		right: 0.9rem;
		transition: right 0.28s var(--ease-out-soft);
		bottom: 0.9rem;
		z-index: 30;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.45rem;
	}
	.coord {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-family: var(--font-mono);
		font-size: 0.56rem;
		letter-spacing: 0.04em;
		color: var(--color-mist-500);
		background: color-mix(in oklab, #0b1119 78%, transparent);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 999px;
		padding: 0.22rem 0.55rem;
		backdrop-filter: blur(12px);
	}
	.hovered {
		color: var(--color-gold-300);
	}
	.zoom {
		color: var(--color-mist-400);
	}
	.buttons {
		display: flex;
		flex-direction: row;
		gap: 2px;
		padding: 0.2rem;
		border-radius: 0.5rem;
		background: color-mix(in oklab, #0b1119 84%, transparent);
		border: 1px solid rgba(255, 255, 255, 0.075);
		backdrop-filter: blur(16px);
	}
	.buttons button {
		display: grid;
		place-items: center;
		width: 1.85rem;
		height: 1.85rem;
		border: 0;
		border-radius: 0.35rem;
		background: transparent;
		color: var(--color-mist-300);
		transition: background 0.15s ease, color 0.15s ease;
	}
	.buttons button:hover {
		background: rgba(255, 255, 255, 0.07);
		color: var(--color-mist-100);
	}
	.sources {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.06em;
		color: var(--color-mist-500);
		text-decoration: none;
	}
	.sources:hover {
		color: var(--color-mist-300);
	}
	.statusbar {
		position: fixed;
		left: 50%;
		bottom: 0.95rem;
		transform: translateX(-50%);
		z-index: 24;
		display: none;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.05em;
		color: var(--color-mist-500);
	}
	@media (min-width: 1100px) {
		.statusbar {
			display: flex;
		}
	}
	@media (max-width: 860px) {
		.hint {
			display: none;
		}
		.controls {
			bottom: calc(7.4rem + env(safe-area-inset-bottom));
			right: 0.6rem;
		}
		.statusbar {
			display: none;
		}
	}
</style>
