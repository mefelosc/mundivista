<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import type { ResolvedLayer } from '#lib/configurations/map-layers';
	import { organizationById } from '#lib/data/organizations';
	import { retrievedAt } from '#lib/data/countries';
	import { locale } from '#lib/locale.svelte';
	import { localizedLayer } from '#lib/i18n-layers';
	import { localizedOrganization } from '#lib/i18n-data-en';

	interface Props {
		layer: ResolvedLayer;
		bloc?: string | null;
	}
	let { layer, bloc = null }: Props = $props();
	const isEn = $derived(locale.value === 'en');
	const tr = (pt: string, en: string) => (isEn ? en : pt);
	const display = $derived(localizedLayer(layer, locale.value) as typeof layer);

	let collapsed = $state(false);

	const org = $derived(bloc ? organizationById.get(bloc) : null);
	const displayOrg = $derived(org ? localizedOrganization(org, locale.value) : null);
	const gradient = $derived(
		layer.palette ? `linear-gradient(90deg, ${layer.palette.join(', ')})` : ''
	);
</script>

<section class="legend" class:collapsed aria-label={tr('Legenda do mapa', 'Map legend')}>
	<div class="head">
		<div class="titles">
			<span class="eyebrow">{display.index} · {tr('Camada', 'Layer')}</span>
			<strong>{display.label}</strong>
		</div>
		{#if org}
			<span class="bloc-on"><i></i>{displayOrg?.short}</span>
		{/if}
		<button
			type="button"
			class="legend-toggle"
			aria-expanded={!collapsed}
			aria-label={collapsed ? tr('Expandir legenda', 'Expand legend') : tr('Recolher legenda', 'Collapse legend')}
			title={collapsed ? tr('Expandir legenda', 'Expand legend') : tr('Recolher legenda', 'Collapse legend')}
			onclick={() => (collapsed = !collapsed)}
		>
			<Icon name="chevronDown" size={14} />
		</button>
	</div>

	{#if !collapsed}
		<p class="desc">{display.description}</p>

		{#if display.legend.type === 'gradient'}
			<div class="gradient" style:background={gradient}></div>
			<div class="ticks" aria-hidden="true">
				{#each Array.from({ length: 9 }) as _, i (i)}<span></span>{/each}
			</div>
			<div class="scale">
				<span>{display.legend.low}</span>
				<span>{display.legend.high}</span>
			</div>
			<span class="unit">{display.legend.unit}</span>
		{:else if display.legend.type === 'categorical'}
			<ul class="items">
				{#each display.legend.items as item (item.label)}
					<li><i style:background={item.color}></i>{item.label}</li>
				{/each}
			</ul>
		{/if}

		{#if layer.showDisputed}
			<div class="hint-row">
				<span class="hatch" aria-hidden="true"></span>
				{tr('Estatuto disputado, sem atribuição de soberania.', 'Disputed status, without assigning sovereignty.')}
			</div>
		{/if}

		{#if layer.showSubdivisions}
			<div class="hint-row">
				<span class="unit-swatch" aria-hidden="true"></span>
				{tr('Selecione um país para ver suas unidades e estados.', 'Select a country to see its units and states.')}
			</div>
		{/if}

		{#if display.legend.note}
			<p class="note">{display.legend.note}</p>
		{/if}

		<footer>
			<span>Natural Earth 1:50m</span>
			<span>Banco Mundial</span>
			<span>{retrievedAt}</span>
		</footer>
	{/if}
</section>

<style>
	.legend {
		position: fixed;
		left: 0.75rem;
		bottom: 0.75rem;
		z-index: 25;
		width: 19rem;
		padding: 0.7rem 0.72rem 0.6rem;
		background: color-mix(in oklab, var(--surface-2) 96%, transparent);
		border: 1px solid var(--line);
		border-radius: 0.25rem;
		box-shadow: 0 20px 40px -30px rgb(0 0 0 / 0.55);
	}
	.head {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.titles {
		min-width: 0;
		flex: 1;
	}
	.titles .eyebrow {
		display: block;
		font-size: 0.6rem;
	}
	.titles strong {
		display: block;
		margin-top: 0.16rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
		line-height: 1.05;
		color: var(--text-1);
	}
	.legend-toggle {
		display: grid;
		place-items: center;
		width: 1.55rem;
		height: 1.55rem;
		flex-shrink: 0;
		border: 1px solid var(--line);
		border-radius: 0.15rem;
		background: transparent;
		color: var(--text-4);
		transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
	}
	.legend-toggle :global(svg) {
		transition: transform 0.2s var(--ease-out-soft);
	}
	.legend-toggle:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
		background: var(--surface-3);
	}
	.collapsed {
		padding-bottom: 0.7rem;
	}
	.collapsed .legend-toggle :global(svg) {
		transform: rotate(180deg);
	}
	.desc {
		margin: 0.32rem 0 0;
		font-size: 0.72rem;
		line-height: 1.45;
		color: var(--text-3);
	}
	.bloc-on {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		margin-top: 0.1rem;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.08em;
		color: var(--accent-0);
		white-space: nowrap;
	}
	.bloc-on i {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent-1);
	}
	.gradient {
		height: 9px;
		margin-top: 0.65rem;
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
		margin-top: 0.32rem;
		font-size: 0.64rem;
		color: var(--text-3);
	}
	.unit {
		display: block;
		margin-top: 0.16rem;
		text-align: center;
		color: var(--text-4);
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.04em;
	}
	.items {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.3rem 0.55rem;
		list-style: none;
		margin: 0.55rem 0 0;
		padding: 0;
	}
	.items li {
		display: flex;
		align-items: center;
		gap: 0.36rem;
		font-size: 0.72rem;
		color: var(--text-2);
	}
	.items i {
		width: 9px;
		height: 9px;
		border: 1px solid var(--line);
		flex-shrink: 0;
	}
	.hint-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.5rem;
		font-size: 0.64rem;
		line-height: 1.35;
		color: var(--text-3);
	}
	.hatch {
		width: 15px;
		height: 11px;
		border: 1px solid var(--line-strong);
		background: repeating-linear-gradient(
			-45deg,
			var(--text-4) 0 1px,
			transparent 1px 4px
		);
		flex-shrink: 0;
	}
	.unit-swatch {
		width: 15px;
		height: 11px;
		border: 1px solid var(--line-strong);
		background-image:
			linear-gradient(var(--line-strong) 1px, transparent 1px),
			linear-gradient(90deg, var(--line-strong) 1px, transparent 1px);
		background-size: 5px 5px;
		flex-shrink: 0;
	}
	.note {
		margin: 0.5rem 0 0;
		font-size: 0.68rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem 0.55rem;
		margin-top: 0.55rem;
		padding-top: 0.4rem;
		border-top: 1px solid var(--line);
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.03em;
		color: var(--text-4);
	}
	@media (max-width: 900px) {
		.legend {
			display: none;
		}
	}
</style>
