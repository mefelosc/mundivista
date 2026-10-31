<script lang="ts">
	import { featureFor, locatorShape, type LocatorShape } from '#lib/data/geometry';
	import type { Country } from '#lib/types';

	interface Props {
		country: Country;
		neighbors?: Country[];
		class?: string;
	}
	let { country, neighbors = [], class: className = '' }: Props = $props();

	let shape = $state<LocatorShape | null>(null);
	let failed = $state(false);

	$effect(() => {
		const targetCode = country.code;
		const neighborCodes = neighbors.map((n) => n.code);
		let cancelled = false;
		shape = null;
		failed = false;

		(async () => {
			try {
				const target = await featureFor(targetCode);
				if (!target || cancelled) {
					if (!target) failed = true;
					return;
				}
				const around = (await Promise.all(neighborCodes.map((code) => featureFor(code)))).filter(
					(f): f is NonNullable<typeof f> => Boolean(f)
				);
				if (cancelled) return;
				shape = locatorShape(target, around);
			} catch {
				if (!cancelled) failed = true;
			}
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

<figure class={`locator ${className}`} aria-label={`Localização de ${country.name}`}>
	<figcaption>
		<span class="eyebrow">Localização</span>
		<span class="coords">
			{country.latlng
				? `${Math.abs(country.latlng[0]).toFixed(1)}°${country.latlng[0] >= 0 ? 'N' : 'S'} ${Math.abs(country.latlng[1]).toFixed(1)}°${country.latlng[1] >= 0 ? 'L' : 'O'}`
				: country.continent ?? ''}
		</span>
	</figcaption>
	<div class="frame">
		{#if shape}
			<svg viewBox="0 0 240 132" role="img" aria-hidden="true">
				<path class="grid" d={shape.grid} />
				<path class="neighbors" d={shape.neighbors} />
				<path class="country" d={shape.country} />
			</svg>
		{:else if failed}
			<p class="failed">Geometria indisponível.</p>
		{:else}
			<div class="skeleton" aria-hidden="true"></div>
		{/if}
		<span class="north" aria-hidden="true">N</span>
	</div>
</figure>

<style>
	.locator {
		margin: 0;
		border: 1px solid var(--line);
		background: var(--surface-1);
	}
	figcaption {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.32rem 0.45rem;
		border-bottom: 1px solid var(--line);
	}
	figcaption .eyebrow {
		font-size: 0.64rem;
	}
	.coords {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--text-4);
	}
	.frame {
		position: relative;
		aspect-ratio: 240 / 132;
		overflow: hidden;
		background:
			radial-gradient(120% 120% at 50% 50%, transparent 40%, color-mix(in oklab, var(--surface-3) 55%, transparent));
	}
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.grid {
		fill: none;
		stroke: var(--line);
		stroke-width: 0.5;
	}
	.neighbors {
		fill: var(--surface-3);
		stroke: var(--line-strong);
		stroke-width: 0.5;
	}
	.country {
		fill: color-mix(in oklab, var(--accent-1) 30%, var(--surface-2));
		stroke: var(--accent-0);
		stroke-width: 1;
	}
	.north {
		position: absolute;
		top: 0.35rem;
		right: 0.45rem;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--text-4);
	}
	.north::before {
		content: '';
		display: block;
		width: 0;
		height: 0;
		margin: 0 auto 0.1rem;
		border-left: 3px solid transparent;
		border-right: 3px solid transparent;
		border-bottom: 6px solid var(--text-4);
	}
	.skeleton {
		position: absolute;
		inset: 15%;
		border: 1px dashed var(--line-strong);
		animation: pulse-soft 1.6s ease-in-out infinite;
	}
	.failed {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		font-size: 0.6rem;
		color: var(--text-4);
	}
</style>
