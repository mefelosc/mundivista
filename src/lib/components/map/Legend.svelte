<script lang="ts">
	import type { ResolvedLayer } from '#lib/configurations/map-layers';
	import { organizationById } from '#lib/data/organizations';
	import { retrievedAt } from '#lib/data/countries';

	interface Props {
		layer: ResolvedLayer;
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
		<div class="ticks" aria-hidden="true">
			{#each Array.from({ length: 9 }) as _, i (i)}<span></span>{/each}
		</div>
		<div class="scale">
			<span>{layer.legend.low}</span>
			<span>{layer.legend.high}</span>
		</div>
		<span class="unit">{layer.legend.unit}</span>
	{:else if layer.legend.type === 'categorical'}
		<ul class="items">
			{#each layer.legend.items as item (item.label)}
				<li><i style:background={item.color}></i>{item.label}</li>
			{/each}
		</ul>
	{/if}

	{#if layer.showDisputed}
		<div class="hatch-note">
			<span class="hatch" aria-hidden="true"></span>
			Estatuto disputado, sem atribuição de soberania.
		</div>
	{/if}

	{#if layer.legend.note}
		<p class="note">{layer.legend.note}</p>
	{/if}

	<footer>
		<span>Natural Earth 1:50m</span>
		<span>Banco Mundial</span>
		<span>{retrievedAt}</span>
	</footer>
</div>

<style>
	.legend {
		position: fixed;
		left: 0.75rem;
		bottom: 0.75rem;
		z-index: 25;
		width: 17rem;
		padding: 0.6rem 0.65rem 0.5rem;
		background: var(--surface-2);
		border: 1px solid var(--line);
		border-radius: 0.2rem;
		box-shadow: 0 18px 36px -28px rgb(0 0 0 / 0.55);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.45rem;
	}
	.head .eyebrow {
		font-size: 0.52rem;
	}
	.bloc-on {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.52rem;
		letter-spacing: 0.08em;
		color: var(--accent-0);
	}
	.bloc-on i {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent-1);
	}
	.gradient {
		height: 8px;
		border: 1px solid var(--line);
	}
	.ticks {
		display: flex;
		justify-content: space-between;
		padding: 0 1px;
		margin-top: 2px;
	}
	.ticks span {
		width: 1px;
		height: 3px;
		background: var(--line-strong);
	}
	.scale {
		display: flex;
		justify-content: space-between;
		gap: 0.4rem;
		margin-top: 0.28rem;
		font-size: 0.56rem;
		color: var(--text-3);
	}
	.unit {
		display: block;
		margin-top: 0.14rem;
		text-align: center;
		color: var(--text-4);
		font-family: var(--font-mono);
		font-size: 0.48rem;
		letter-spacing: 0.04em;
	}
	.items {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.22rem 0.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.items li {
		display: flex;
		align-items: center;
		gap: 0.32rem;
		font-size: 0.58rem;
		color: var(--text-2);
	}
	.items i {
		width: 8px;
		height: 8px;
		border: 1px solid var(--line);
		flex-shrink: 0;
	}
	.hatch-note {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.45rem;
		font-size: 0.55rem;
		color: var(--text-3);
	}
	.hatch {
		width: 14px;
		height: 10px;
		border: 1px solid var(--line-strong);
		background: repeating-linear-gradient(
			-45deg,
			var(--text-4) 0 1px,
			transparent 1px 4px
		);
		flex-shrink: 0;
	}
	.note {
		margin: 0.45rem 0 0;
		font-size: 0.56rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.5rem;
		margin-top: 0.45rem;
		padding-top: 0.35rem;
		border-top: 1px solid var(--line);
		font-family: var(--font-mono);
		font-size: 0.46rem;
		letter-spacing: 0.03em;
		color: var(--text-4);
	}
	@media (max-width: 900px) {
		.legend {
			display: none;
		}
	}
</style>
