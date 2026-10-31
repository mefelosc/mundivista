<script lang="ts">
	import type { LayerConfig } from '#lib/configurations/map-layers';
	import { organizationById } from '#lib/data/organizations';
	import { retrievedAt } from '#lib/data/countries';

	interface Props {
		layer: LayerConfig;
		bloc?: string | null;
	}
	let { layer, bloc = null }: Props = $props();

	const org = $derived(bloc ? organizationById.get(bloc) : null);
	const gradient = $derived(
		layer.palette ? `linear-gradient(90deg, ${layer.palette.join(', ')})` : ''
	);
</script>

<div class="legend" aria-label="Legenda do mapa">
	<div class="head">
		<span class="eyebrow">{layer.index} · {layer.label}</span>
		{#if org}
			<span class="bloc-on"><i></i>{org.short}</span>
		{/if}
	</div>

	{#if layer.legend.type === 'gradient'}
		<div class="gradient" style:background={gradient}></div>
		<div class="scale">
			<span>{layer.legend.low}</span>
			<span>{layer.legend.unit}</span>
			<span>{layer.legend.high}</span>
		</div>
	{:else if layer.legend.type === 'categorical'}
		<ul class="items">
			{#each layer.legend.items as item (item.label)}
				<li><i style:background={item.color}></i>{item.label}</li>
			{/each}
		</ul>
	{/if}

	{#if layer.legend.note}
		<p class="note">{layer.legend.note}</p>
	{/if}

	<p class="source">Natural Earth 1:50m · Banco Mundial · atualizado {retrievedAt}</p>
</div>

<style>
	.legend {
		position: fixed;
		left: 0.9rem;
		bottom: 0.9rem;
		z-index: 25;
		width: 15.5rem;
		padding: 0.7rem 0.75rem;
		border-radius: 0.7rem;
		background: color-mix(in oklab, #0b1119 84%, transparent);
		border: 1px solid rgba(255, 255, 255, 0.075);
		backdrop-filter: blur(18px);
		box-shadow: 0 18px 40px -22px rgba(0, 0, 0, 0.85);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.bloc-on {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.56rem;
		letter-spacing: 0.08em;
		color: var(--color-gold-300);
	}
	.bloc-on i {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-gold-400);
	}
	.gradient {
		height: 6px;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}
	.scale {
		display: flex;
		justify-content: space-between;
		gap: 0.4rem;
		margin-top: 0.35rem;
		font-size: 0.58rem;
		color: var(--color-mist-400);
	}
	.scale span:nth-child(2) {
		color: var(--color-mist-500);
		font-family: var(--font-mono);
		font-size: 0.52rem;
		letter-spacing: 0.04em;
	}
	.items {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25rem 0.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.items li {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.6rem;
		color: var(--color-mist-300);
	}
	.items i {
		width: 7px;
		height: 7px;
		border-radius: 2px;
		flex-shrink: 0;
	}
	.note {
		margin: 0.5rem 0 0;
		font-size: 0.58rem;
		line-height: 1.45;
		color: var(--color-mist-500);
	}
	.source {
		margin: 0.55rem 0 0;
		padding-top: 0.45rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.03em;
		color: var(--color-mist-500);
	}
	@media (max-width: 860px) {
		.legend {
			display: none;
		}
	}
</style>
