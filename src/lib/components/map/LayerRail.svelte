<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { mapLayers, standardLayer } from '#lib/configurations/map-layers';
	import { organizations } from '#lib/data/organizations';
	import type { LayerId } from '#lib/types';
	import { locale } from '#lib/locale.svelte';
	import { localizedLayer } from '#lib/i18n-layers';
	import { localizedOrganization } from '#lib/i18n-data-en';

	interface Props {
		active: LayerId;
		onchange: (id: LayerId) => void;
		bloc?: string | null;
		onbloc?: (id: string | null) => void;
		compact?: boolean;
	}

	let { active, onchange, bloc = null, onbloc, compact = false }: Props = $props();

	const isEn = $derived(locale.value === 'en');
	const tr = (pt: string, en: string) => (isEn ? en : pt);
	const allLayers = $derived([standardLayer, ...mapLayers]);
	const displayLayers = $derived(allLayers.map((layer) => localizedLayer(layer, locale.value)));
	const activeLayer = $derived(displayLayers.find((l) => l.id === active) ?? displayLayers[0]);
	const displayStandard = $derived(displayLayers[0]);
	const total = String(mapLayers.length).padStart(2, '0');
	const availableBlocs = $derived(
		activeLayer.blocs
			? organizations
					.filter((o) => activeLayer.blocs!.includes(o.id))
					.map((org) => localizedOrganization(org, locale.value))
			: []
	);

	let collapsed = $state(false);
	$effect(() => {
		if (compact) collapsed = true;
	});

	onMount(() => {
		collapsed = compact || localStorage.getItem('mundivista:rail') === 'collapsed';
	});

	function toggleCollapsed() {
		collapsed = !collapsed;
		localStorage.setItem('mundivista:rail', collapsed ? 'collapsed' : 'open');
	}
</script>

<aside class="rail" class:collapsed aria-label={tr('Camadas do mapa', 'Map layers')}>
	<div class="head">
		{#if !collapsed}
			<span class="eyebrow">{tr('Camadas', 'Layers')}</span>
			<span class="index">{activeLayer.index}/{total}</span>
		{/if}
		<button
			type="button"
			class="rail-toggle"
			aria-expanded={!collapsed}
			aria-label={collapsed ? tr('Expandir camadas', 'Expand layers') : tr('Recolher camadas', 'Collapse layers')}
			title={collapsed ? tr('Expandir camadas', 'Expand layers') : tr('Recolher camadas', 'Collapse layers')}
			onclick={toggleCollapsed}
		>
			<Icon name="chevronRight" size={14} />
		</button>
	</div>
	<div class="layers" role="tablist" aria-orientation="vertical">
		<button
			type="button"
			role="tab"
			aria-selected={active === standardLayer.id}
			class:active={active === standardLayer.id}
			class="base"
			title={`${displayStandard.label} · ${displayStandard.description}`}
			onclick={() => onchange(standardLayer.id)}
		>
			<span class="num">{displayStandard.index}</span>
			<Icon name={displayStandard.icon} size={17} />
			<span class="label">{displayStandard.short}</span>
		</button>
		<span class="divider" aria-hidden="true"></span>
		{#each displayLayers.slice(1) as layer (layer.id)}
			<button
				type="button"
				role="tab"
				aria-selected={active === layer.id}
				class:active={active === layer.id}
				title={`${layer.label} · ${layer.description}${active === layer.id ? tr(' · clique de novo para voltar ao mapa padrão', ' · click again to return to the standard map') : ''}`}
				onclick={() => onchange(layer.id)}
			>
				<span class="num">{layer.index}</span>
				<Icon name={layer.icon} size={17} />
				<span class="label">{layer.short}</span>
			</button>
		{/each}
	</div>

	{#if availableBlocs.length && onbloc && !collapsed}
		<div class="blocs" aria-label={tr('Blocos', 'Blocs')}>
			<span class="eyebrow">{tr('Blocos', 'Blocs')}</span>
			<div class="chips">
				{#each availableBlocs as org (org.id)}
					<button
						type="button"
						class:active={bloc === org.id}
						onclick={() => onbloc(bloc === org.id ? null : org.id)}
						title={org.note}
					>
						{org.short}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</aside>

<style>
	.rail {
		position: fixed;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		z-index: 30;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		width: var(--rail-w);
		transition: width 0.2s var(--ease-out-soft);
	}
	.rail.collapsed {
		width: 3.15rem;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.3rem;
		min-height: 1.5rem;
		padding: 0 0.1rem 0 0.2rem;
	}
	.head .eyebrow {
		font-size: 0.74rem;
	}
	.index {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
	}
	.rail-toggle {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		border: 1px solid var(--line);
		border-radius: 0.15rem;
		background: var(--surface-2);
		color: var(--text-3);
		transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
	}
	.rail-toggle :global(svg) {
		transition: transform 0.2s var(--ease-out-soft);
	}
	.rail-toggle:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
		background: var(--surface-3);
	}
	.collapsed .rail-toggle :global(svg) {
		transform: rotate(180deg);
	}
	.collapsed .rail-toggle {
		margin: 0 auto;
	}
	.layers {
		display: flex;
		flex-direction: column;
		padding: 0.22rem;
		background: color-mix(in oklab, var(--surface-2) 95%, transparent);
		border: 1px solid var(--line);
		border-radius: 0.25rem;
		box-shadow: 0 16px 34px -28px rgb(0 0 0 / 0.55);
	}
	.layers button {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 2.7rem;
		border: 0;
		background: transparent;
		color: var(--text-3);
		border-radius: var(--radius-sm);
		padding: 0.55rem 0.55rem;
		font-size: 0.92rem;
		font-weight: 500;
		text-align: left;
		white-space: nowrap;
		transition: background 0.16s ease, color 0.16s ease;
	}
	.layers .num {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
		width: 1.1rem;
		flex-shrink: 0;
	}
	.layers :global(svg) {
		flex-shrink: 0;
	}
	.layers .label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.layers button:hover {
		background: var(--surface-3);
		color: var(--text-1);
	}
	.layers .divider {
		height: 1px;
		margin: 0.25rem 0.35rem;
		background: var(--line);
	}
	.layers button.active {
		background: color-mix(in oklab, var(--accent-1) 14%, var(--surface-2));
		color: var(--text-1);
		box-shadow: inset 3px 0 0 var(--accent-1);
	}
	.layers button.active .num,
	.layers button.active :global(svg) {
		color: var(--accent-0);
	}
	.collapsed .layers button {
		justify-content: center;
		gap: 0;
		padding: 0.5rem 0.3rem;
	}
	.collapsed .num,
	.collapsed .label,
	.collapsed .divider {
		display: none;
	}
	.collapsed .layers button.active {
		box-shadow: inset 0 -3px 0 var(--accent-1);
	}
	.blocs {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.6rem 0.55rem;
		background: var(--surface-2);
		border: 1px solid var(--line);
		border-radius: 0.25rem;
	}
	.blocs .eyebrow {
		font-size: 0.72rem;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.chips button {
		border: 1px solid var(--line);
		background: transparent;
		color: var(--text-3);
		border-radius: var(--radius-pill);
		padding: 0.28rem 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.04em;
		transition: all 0.15s ease;
	}
	.chips button:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
	.chips button.active {
		background: color-mix(in oklab, var(--accent-1) 18%, transparent);
		border-color: color-mix(in oklab, var(--accent-1) 55%, transparent);
		color: var(--accent-0);
	}
	@media (max-width: 900px) {
		.rail,
		.rail.collapsed {
			left: 0;
			right: 0;
			top: auto;
			bottom: 0;
			transform: none;
			width: auto;
			gap: 0;
			padding: 0.35rem 0.4rem calc(0.35rem + env(safe-area-inset-bottom));
			background: color-mix(in oklab, var(--surface-0) 96%, transparent);
			border-top: 1px solid var(--line);
		}
		.head {
			display: none;
		}
		.layers {
			flex-direction: row;
			overflow-x: auto;
			scrollbar-width: none;
			padding: 0;
			background: transparent;
			border: 0;
			box-shadow: none;
		}
		.layers::-webkit-scrollbar {
			display: none;
		}
		.layers button,
		.collapsed .layers button {
			flex-direction: column;
			gap: 0.2rem;
			min-height: auto;
			font-size: 0.64rem;
			padding: 0.32rem 0.5rem;
			min-width: 3.6rem;
			align-items: center;
			box-shadow: none;
		}
		.layers .num,
		.collapsed .num {
			display: none;
		}
		.collapsed .label {
			display: block;
		}
		.layers button.active,
		.collapsed .layers button.active {
			box-shadow: inset 0 -2px 0 var(--accent-1);
		}
		.layers .divider {
			display: block;
			width: 1px;
			height: auto;
			align-self: stretch;
			margin: 0.2rem 0.1rem;
		}
		.blocs {
			flex-direction: row;
			align-items: center;
			gap: 0.4rem;
			overflow-x: auto;
			padding: 0.3rem 0.2rem 0;
			border: 0;
			border-top: 1px solid var(--line);
			background: transparent;
			border-radius: 0;
		}
		.blocs .eyebrow {
			display: none;
		}
	}
</style>
