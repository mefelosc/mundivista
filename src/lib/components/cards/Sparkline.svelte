<script lang="ts">
	import { formatDec } from '#lib/format';

	interface Props {
		series: [number, number][];
		format?: (value: number) => string;
		height?: number;
		label?: string;
		/** 'points' para indicadores já em %, evitando “+170%” sobre uma taxa. */
		delta?: 'percent' | 'points';
	}
	let {
		series,
		format = (v) => formatDec(v, 1),
		height = 38,
		label = 'Série temporal',
		delta: deltaMode = 'percent'
	}: Props = $props();

	const points = $derived.by(() => {
		if (!series?.length) return [];
		const values = series.map(([, v]) => v);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const span = max - min || Math.abs(max) || 1;
		return series.map(([year, value], i) => ({
			year,
			value,
			x: series.length === 1 ? 50 : (i / (series.length - 1)) * 100,
			y: 29 - ((value - min) / span) * 24
		}));
	});

	const line = $derived(points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));
	const area = $derived(
		points.length ? `M0,32 L${points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L')} L100,32 Z` : ''
	);
	const first = $derived(series?.[0]);
	const last = $derived(series?.[series.length - 1]);
	const change = $derived(first && last ? last[1] - first[1] : null);
	const delta = $derived(
		change === null
			? null
			: deltaMode === 'points'
				? change
				: first && first[1] !== 0
					? (change / Math.abs(first[1])) * 100
					: null
	);
	const description = $derived(
		first && last
			? `${label}: de ${format(first[1])} em ${first[0]} para ${format(last[1])} em ${last[0]}.`
			: 'Série indisponível.'
	);
</script>

<div class="spark" style:--h={`${height}px`}>
	<div class="top">
		<span class="years">{first?.[0] ?? '—'}–{last?.[0] ?? '—'}</span>
		{#if delta !== null}
			<span class="delta" class:down={delta < 0}>
				{deltaMode === 'points'
					? `${delta > 0 ? '+' : ''}${format(delta)}`
					: `${delta > 0 ? '+' : ''}${formatDec(delta, 1)}%`}
			</span>
		{/if}
	</div>
	{#if points.length > 1}
		<svg viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={description}>
			<path class="area" d={area} />
			<polyline class="line" points={line} vector-effect="non-scaling-stroke" />
			{#if last}
				<circle class="dot" cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="1.7" vector-effect="non-scaling-stroke" />
			{/if}
		</svg>
		<div class="range">
			<span>{format(Math.min(...series.map(([, v]) => v)))}</span>
			<span>{format(Math.max(...series.map(([, v]) => v)))}</span>
		</div>
	{:else}
		<p class="empty">Série não disponível.</p>
	{/if}
</div>

<style>
	.spark {
		border-top: 1px solid var(--line);
		padding-top: 0.28rem;
		margin-top: 0.35rem;
	}
	.top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.years {
		font-family: var(--font-mono);
		font-size: 0.46rem;
		letter-spacing: 0.06em;
		color: var(--text-4);
	}
	.delta {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--positive);
	}
	.delta.down {
		color: var(--negative);
	}
	svg {
		display: block;
		width: 100%;
		height: var(--h);
		margin-top: 2px;
		overflow: visible;
	}
	.area {
		fill: color-mix(in oklab, var(--accent-1) 16%, transparent);
	}
	.line {
		fill: none;
		stroke: var(--accent-1);
		stroke-width: 1.4;
	}
	.dot {
		fill: var(--accent-0);
	}
	.range {
		display: flex;
		justify-content: space-between;
		font-family: var(--font-mono);
		font-size: 0.45rem;
		color: var(--text-4);
	}
	.empty {
		margin: 0.2rem 0 0;
		font-size: 0.55rem;
		color: var(--text-4);
	}
</style>
