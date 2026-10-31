<script lang="ts">
	import { formatDec } from '#lib/format';

	interface Props {
		series: [number, number][];
		format?: (value: number) => string;
		height?: number;
		label?: string;
		/** 'points' para indicadores já em %, evitando “+170%” sobre uma taxa. */
		delta?: 'percent' | 'points';
		/** Versão compacta para cards: esconde mín./máx. */
		compact?: boolean;
	}
	let {
		series,
		format = (v) => formatDec(v, 1),
		height = 52,
		label = 'Série temporal',
		delta: deltaMode = 'percent',
		compact = false
	}: Props = $props();

	let hover = $state<number | null>(null);

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
			y: 34 - ((value - min) / span) * 27
		}));
	});

	const line = $derived(points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));
	const area = $derived(
		points.length
			? `M0,36 L${points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L')} L100,36 Z`
			: ''
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
	const active = $derived(hover !== null ? points[hover] : null);

	function onMove(event: PointerEvent) {
		if (!points.length) return;
		const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
		hover = Math.round(ratio * (points.length - 1));
	}
</script>

<div class="spark" class:compact style:--h={`${height}px`}>
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
		<div class="chart">
			<svg
				viewBox="0 0 100 36"
				preserveAspectRatio="none"
				role="img"
				aria-label={description}
				onpointermove={onMove}
				onpointerleave={() => (hover = null)}
			>
				<line class="grid" x1="0" y1="9" x2="100" y2="9" />
				<line class="grid" x1="0" y1="18" x2="100" y2="18" />
				<line class="grid" x1="0" y1="27" x2="100" y2="27" />
				<path class="area" d={area} />
				<polyline class="line" points={line} pathLength="1" vector-effect="non-scaling-stroke" />
				{#if last}
					<circle class="dot" cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="1.6" vector-effect="non-scaling-stroke" />
				{/if}
				{#if active}
					<line class="cursor" x1={active.x} y1="0" x2={active.x} y2="36" vector-effect="non-scaling-stroke" />
					<circle class="hover-dot" cx={active.x} cy={active.y} r="2.2" vector-effect="non-scaling-stroke" />
				{/if}
			</svg>
			{#if active}
				<div
					class="tooltip"
					style:left={`${Math.min(88, Math.max(12, active.x))}%`}
					style:top={`${Math.max(0, (active.y / 36) * 100 - 18)}%`}
				>
					<strong>{format(active.value)}</strong>
					<span>{active.year}</span>
				</div>
			{/if}
		</div>
	{:else}
		<p class="empty">Série não disponível.</p>
	{/if}
</div>

<style>
	.spark {
		border-top: 1px solid var(--line);
		padding-top: 0.35rem;
		margin-top: 0.4rem;
	}
	.spark.compact {
		padding-top: 0.25rem;
		margin-top: 0.3rem;
	}
	.spark.compact .years,
	.spark.compact .delta {
		font-size: 0.6rem;
	}
	.top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.years {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		color: var(--text-4);
	}
	.delta {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--positive);
	}
	.delta.down {
		color: var(--negative);
	}
	.chart {
		position: relative;
		margin-top: 3px;
	}
	svg {
		display: block;
		width: 100%;
		height: var(--h);
		overflow: visible;
		touch-action: pan-y;
	}
	.grid {
		stroke: var(--line);
		stroke-width: 0.4;
		stroke-dasharray: 1.5 2.5;
	}
	.area {
		fill: color-mix(in oklab, var(--accent-1) 20%, transparent);
		animation: spark-fade 0.7s var(--ease-out-soft) both;
	}
	.line {
		fill: none;
		stroke: var(--accent-1);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: spark-draw 0.9s var(--ease-out-soft) 0.08s forwards;
	}
	.dot {
		fill: var(--accent-0);
	}
	.cursor {
		stroke: var(--line-emphasis);
		stroke-width: 0.6;
		stroke-dasharray: 2 2;
	}
	.hover-dot {
		fill: var(--surface-2);
		stroke: var(--accent-0);
		stroke-width: 1.2;
	}
	.tooltip {
		position: absolute;
		transform: translate(-50%, -100%);
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		padding: 0.18rem 0.35rem;
		pointer-events: none;
		white-space: nowrap;
		z-index: 2;
	}
	.tooltip strong {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		font-weight: 500;
		color: var(--text-1);
	}
	.tooltip span {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		color: var(--text-4);
	}
	.empty {
		margin: 0.2rem 0 0;
		font-size: 0.66rem;
		color: var(--text-4);
	}
	@keyframes spark-draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes spark-fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.line {
			stroke-dashoffset: 0;
		}
	}
</style>
