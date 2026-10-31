<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import { mapLayers } from '#lib/configurations/map-layers';
	import { organizations } from '#lib/data/organizations';
	import type { LayerId } from '#lib/types';

	interface Props {
		active: LayerId;
		onchange: (id: LayerId) => void;
		bloc?: string | null;
		onbloc?: (id: string | null) => void;
	}

	let { active, onchange, bloc = null, onbloc }: Props = $props();

	const activeLayer = $derived(mapLayers.find((l) => l.id === active) ?? mapLayers[0]);
	const availableBlocs = $derived(
		activeLayer.blocs ? organizations.filter((o) => activeLayer.blocs!.includes(o.id)) : []
	);
</script>

<aside class="rail" aria-label="Camadas do mapa">
	<div class="head">
		<span class="eyebrow">Camadas</span>
		<span class="index">{activeLayer.index}/06</span>
	</div>
	<div class="layers" role="tablist" aria-orientation="vertical">
		{#each mapLayers as layer (layer.id)}
			<button
				type="button"
				role="tab"
				aria-selected={active === layer.id}
				class:active={active === layer.id}
				title={layer.description}
				onclick={() => onchange(layer.id)}
			>
				<span class="num">{layer.index}</span>
				<Icon name={layer.icon} size={16} />
				<span class="label">{layer.short}</span>
			</button>
		{/each}
	</div>

	{#if availableBlocs.length && onbloc}
		<div class="blocs" aria-label="Blocos">
			<span class="eyebrow">Blocos</span>
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
		gap: 0.45rem;
		width: var(--rail-w);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0.15rem;
	}
	.head .eyebrow {
		font-size: 0.52rem;
	}
	.index {
		font-family: var(--font-mono);
		font-size: 0.48rem;
		color: var(--text-4);
	}
	.layers {
		display: flex;
		flex-direction: column;
		padding: 0.18rem;
		background: var(--surface-2);
		border: 1px solid var(--line);
		border-radius: 0.2rem;
		box-shadow: 0 14px 30px -26px rgb(0 0 0 / 0.55);
	}
	.layers button {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.42rem;
		border: 0;
		background: transparent;
		color: var(--text-3);
		border-radius: 0.1rem;
		padding: 0.46rem 0.4rem;
		font-size: 0.71rem;
		font-weight: 500;
		text-align: left;
		white-space: nowrap;
		transition: background 0.16s ease, color 0.16s ease;
	}
	.layers .num {
		font-family: var(--font-mono);
		font-size: 0.46rem;
		color: var(--text-4);
		width: 1rem;
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
	.layers button.active {
		background: color-mix(in oklab, var(--accent-1) 15%, var(--surface-2));
		color: var(--text-1);
		box-shadow: inset 2px 0 0 var(--accent-1);
	}
	.layers button.active .num,
	.layers button.active :global(svg) {
		color: var(--accent-0);
	}
	.blocs {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.55rem 0.5rem;
		background: var(--surface-2);
		border: 1px solid var(--line);
		border-radius: 0.2rem;
	}
	.blocs .eyebrow {
		font-size: 0.48rem;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.22rem;
	}
	.chips button {
		border: 1px solid var(--line);
		background: transparent;
		color: var(--text-3);
		border-radius: 0.1rem;
		padding: 0.18rem 0.34rem;
		font-family: var(--font-mono);
		font-size: 0.53rem;
		letter-spacing: 0.05em;
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
		.rail {
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
		.layers button {
			flex-direction: column;
			gap: 0.18rem;
			font-size: 0.54rem;
			padding: 0.3rem 0.5rem;
			min-width: 3.4rem;
			align-items: center;
			box-shadow: none;
		}
		.layers .num {
			display: none;
		}
		.layers button.active {
			box-shadow: inset 0 -2px 0 var(--accent-1);
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
