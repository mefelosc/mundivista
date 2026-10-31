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
		activeLayer.blocs
			? organizations.filter((o) => activeLayer.blocs!.includes(o.id))
			: []
	);
</script>

<aside class="rail" aria-label="Camadas do mapa">
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
				<Icon name={layer.icon} size={17} />
				<span>{layer.short}</span>
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
		left: 0.9rem;
		top: 50%;
		transform: translateY(-50%);
		z-index: 30;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		max-width: 8.2rem;
	}
	.layers {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 0.3rem;
		border-radius: 0.75rem;
		background: color-mix(in oklab, #0b1119 82%, transparent);
		border: 1px solid rgba(255, 255, 255, 0.075);
		backdrop-filter: blur(18px);
		box-shadow: 0 18px 40px -20px rgba(0, 0, 0, 0.8);
	}
	.layers button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 0;
		background: transparent;
		color: var(--color-mist-400);
		border-radius: 0.5rem;
		padding: 0.5rem 0.55rem;
		font-size: 0.72rem;
		font-weight: 500;
		text-align: left;
		white-space: nowrap;
		transition: background 0.16s ease, color 0.16s ease;
	}
	.layers button:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-mist-200);
	}
	.layers button.active {
		background: color-mix(in oklab, var(--color-gold-400) 12%, transparent);
		color: var(--color-gold-300);
	}
	.layers button.active :global(svg) {
		color: var(--color-gold-400);
	}
	.blocs {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.55rem;
		border-radius: 0.7rem;
		background: color-mix(in oklab, #0b1119 82%, transparent);
		border: 1px solid rgba(255, 255, 255, 0.075);
		backdrop-filter: blur(18px);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.chips button {
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: transparent;
		color: var(--color-mist-400);
		border-radius: 999px;
		padding: 0.2rem 0.45rem;
		font-family: var(--font-mono);
		font-size: 0.56rem;
		letter-spacing: 0.06em;
		transition: all 0.16s ease;
	}
	.chips button:hover {
		color: var(--color-mist-100);
		border-color: rgba(255, 255, 255, 0.25);
	}
	.chips button.active {
		background: color-mix(in oklab, var(--color-gold-400) 16%, transparent);
		border-color: var(--color-gold-500);
		color: var(--color-gold-300);
	}
	.eyebrow {
		font-size: 0.5rem;
		letter-spacing: 0.16em;
	}
	@media (max-width: 860px) {
		.rail {
			left: 0;
			right: 0;
			top: auto;
			bottom: 0;
			transform: none;
			max-width: none;
			flex-direction: column;
			gap: 0.35rem;
			padding: 0.4rem 0.5rem calc(0.45rem + env(safe-area-inset-bottom));
			background: color-mix(in oklab, #070b12 90%, transparent);
			border-top: 1px solid rgba(255, 255, 255, 0.08);
			backdrop-filter: blur(20px);
		}
		.layers {
			flex-direction: row;
			overflow-x: auto;
			scrollbar-width: none;
			padding: 0.2rem;
			background: transparent;
			border: 0;
			box-shadow: none;
			backdrop-filter: none;
		}
		.layers::-webkit-scrollbar {
			display: none;
		}
		.layers button {
			flex-direction: column;
			gap: 0.2rem;
			font-size: 0.58rem;
			padding: 0.35rem 0.55rem;
			min-width: 3.55rem;
			align-items: center;
		}
		.blocs {
			flex-direction: row;
			align-items: center;
			gap: 0.5rem;
			overflow-x: auto;
			padding: 0.35rem 0.3rem 0;
			border: 0;
			border-top: 1px solid rgba(255, 255, 255, 0.06);
			background: transparent;
			border-radius: 0;
			backdrop-filter: none;
		}
		.blocs .eyebrow {
			display: none;
		}
	}
</style>
