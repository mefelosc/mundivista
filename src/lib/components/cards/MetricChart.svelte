<script lang="ts">
	import { formatCompact } from '#lib/format';

	interface Props {
		series: [number, number][];
		/** Formatação do tooltip/valores. */
		format?: (value: number) => string;
		/** Formatação curta dos eixos. */
		axisFormat?: (value: number) => string;
		accent?: string;
		variant?: 'area' | 'bars' | 'line';
		label?: string;
		compact?: boolean;
		reference?: number | null;
		referenceLabel?: string;
		secondary?: [number, number][] | null;
		secondaryAccent?: string;
		secondaryLabel?: string;
		primaryLabel?: string;
	}

	let {
		series,
		format = (value) => String(value),
		axisFormat = (value) => formatCompact(value),
		accent = 'var(--accent-1)',
		variant = 'area',
		label = 'Série temporal',
		compact = false,
		reference = null,
		referenceLabel = 'mediana mundial',
		secondary = null,
		secondaryAccent = 'var(--accent-2)',
		secondaryLabel = 'Comparação',
		primaryLabel = 'País'
	}: Props = $props();

	let hover = $state<number | null>(null);

	const values = $derived(series.map(([, value]) => value));
	const secondaryValues = $derived(secondary?.map(([, value]) => value) ?? []);
	const allValues = $derived([...values, ...secondaryValues]);
	const n = $derived(series.length);

	const bounds = $derived.by(() => {
		if (!allValues.length) return { lo: 0, hi: 1 };
		let lo = Math.min(...allValues);
		let hi = Math.max(...allValues);
		if (variant === 'bars') {
			lo = Math.min(0, lo);
			hi = Math.max(0, hi);
		}
		if (lo === hi) {
			lo -= 1;
			hi += 1;
		}
		const pad = (hi - lo) * 0.09;
		if (variant === 'bars' && lo >= 0) {
			lo = 0;
			hi += pad;
		} else {
			lo -= pad;
			hi += pad;
		}
		return { lo, hi };
	});

	const span = $derived(bounds.hi - bounds.lo || 1);
	const yPercent = $derived((value: number) => (1 - (value - bounds.lo) / span) * 100);
	const xPercent = $derived((index: number) =>
		n <= 1 ? 50 : (index / (n - 1)) * 100
	);
	const baseline = $derived(yPercent(Math.min(Math.max(0, bounds.lo), bounds.hi)));

	const points = $derived(
		series.map(([year, value], index) => ({
			year,
			value,
			x: xPercent(index),
			y: yPercent(value)
		}))
	);
	const pointsB = $derived(
		(secondary ?? []).map(([year, value], index) => ({
			year,
			value,
			x: xPercent(index),
			y: yPercent(value)
		}))
	);
	const linePathB = $derived(
		pointsB.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')
	);

	const linePath = $derived(
		points
			.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
			.join(' ')
	);
	const areaPath = $derived(
		points.length
			? `${linePath} L${points[points.length - 1].x.toFixed(2)},${baseline.toFixed(2)} L${points[0].x.toFixed(2)},${baseline.toFixed(2)} Z`
			: ''
	);

	const barWidth = $derived(n > 0 ? Math.max(2.2, (100 / n) * 0.6) : 0);
	const barX = $derived((index: number) =>
		n <= 0 ? 0 : ((index + 0.5) / n) * 100 - barWidth / 2
	);

	const yTicks = $derived(
		Array.from({ length: compact ? 3 : 4 }, (_, index) => {
			const value = bounds.lo + (span * index) / (compact ? 2 : 3);
			return { value, y: yPercent(value) };
		}).reverse()
	);

	const xTicks = $derived.by(() => {
		if (!n) return [];
		const indexes =
			n <= 4
				? series.map((_, index) => index)
				: [...new Set([0, Math.floor((n - 1) / 3), Math.floor(((n - 1) * 2) / 3), n - 1])];
		return indexes.map((index) => ({
			year: series[index][0],
			x: xPercent(index)
		}));
	});

	const active = $derived(hover !== null && points[hover] ? points[hover] : null);
	const activeB = $derived(hover !== null && pointsB[hover] ? pointsB[hover] : null);
	const referenceY = $derived(
		reference !== null && reference >= bounds.lo && reference <= bounds.hi ? yPercent(reference) : null
	);

	const description = $derived.by(() => {
		if (!series.length) return `${label}: série indisponível.`;
		const first = series[0];
		const last = series[series.length - 1];
		const base = `${label}: de ${format(first[1])} em ${first[0]} para ${format(last[1])} em ${last[0]}.`;
		const second = secondary && secondary.length
			? ` ${secondaryLabel}: de ${format(secondary[0][1])} em ${secondary[0][0]} para ${format(secondary[secondary.length - 1][1])} em ${secondary[secondary.length - 1][0]}.`
			: '';
		return `${base}${second} Use as setas para percorrer os anos.`;
	});

	function indexFromEvent(event: PointerEvent): number {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
		if (variant === 'bars') return Math.min(n - 1, Math.floor(ratio * n));
		return Math.round(ratio * Math.max(0, n - 1));
	}

	function onMove(event: PointerEvent) {
		if (!n) return;
		hover = indexFromEvent(event);
	}

	function onKey(event: KeyboardEvent) {
		if (!n) return;
		if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
			event.preventDefault();
			const current = hover ?? (event.key === 'ArrowRight' ? -1 : n);
			hover = Math.max(0, Math.min(n - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
		} else if (event.key === 'Escape') {
			hover = null;
		}
	}

	const gid = $derived(`chart-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
</script>

<div class="metric-chart" class:compact style:--accent={accent}>
	{#if n > 1}
		<div class="chart-grid">
			<div class="y-axis" aria-hidden="true">
				{#each yTicks as tick (tick.value)}
					<span style:top={`${tick.y}%`}>{axisFormat(tick.value)}</span>
				{/each}
			</div>

			<div
				class="plot"
				role="slider"
				aria-label={label}
				aria-valuemin="0"
				aria-valuemax={Math.max(0, n - 1)}
				aria-valuenow={hover ?? 0}
				aria-valuetext={active ? `${active.year}: ${primaryLabel} ${format(active.value)}${activeB ? `; ${secondaryLabel} ${format(activeB.value)}` : ''}` : description}
				tabindex="0"
				onpointermove={onMove}
				onpointerleave={() => (hover = null)}
				onkeydown={onKey}
			>
				<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
					<defs>
						<linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color={accent} stop-opacity="0.3" />
							<stop offset="100%" stop-color={accent} stop-opacity="0.02" />
						</linearGradient>
					</defs>

					{#each yTicks as tick (tick.value)}
						<line class="grid" x1="0" x2="100" y1={tick.y} y2={tick.y} vector-effect="non-scaling-stroke" />
					{/each}

					{#if variant === 'bars'}
						{#each points as point, index (point.year)}
							<rect
								class="bar"
								class:active={hover === index}
								x={barX(index)}
								y={Math.min(point.y, baseline)}
								width={barWidth}
								height={Math.max(0.6, Math.abs(baseline - point.y))}
							/>
						{/each}
					{:else}
						<path class="area" d={areaPath} fill={`url(#${gid})`} />
						<path class="line" d={linePath} pathLength="1" vector-effect="non-scaling-stroke" />
						{#if secondary && secondary.length > 1}
							<path class="line secondary" d={linePathB} pathLength="1" vector-effect="non-scaling-stroke" style:stroke={secondaryAccent} />
						{/if}
					{/if}

					{#if referenceY !== null}
						<line class="reference" x1="0" x2="100" y1={referenceY} y2={referenceY} vector-effect="non-scaling-stroke" />
						<text class="reference-label" x="99" y={referenceY - 2} text-anchor="end">{referenceLabel} · {axisFormat(reference ?? 0)}</text>
					{/if}

					{#if active}
						<line class="cursor" x1={active.x} x2={active.x} y1="0" y2="100" vector-effect="non-scaling-stroke" />
					{/if}
				</svg>

				{#if points.length}
					{#if variant !== 'bars'}
						<span class="dot" style:left={`${points[0].x}%`} style:top={`${points[0].y}%`} aria-hidden="true"></span>
						<span class="dot end" style:left={`${points[points.length - 1].x}%`} style:top={`${points[points.length - 1].y}%`} aria-hidden="true"></span>
						{#if pointsB.length}
							<span class="dot end secondary" style:left={`${pointsB[pointsB.length - 1].x}%`} style:top={`${pointsB[pointsB.length - 1].y}%`} style:--dot-accent={secondaryAccent} aria-hidden="true"></span>
						{/if}
					{/if}
					{#if active}
						<span class="dot hover" style:left={`${active.x}%`} style:top={`${active.y}%`} aria-hidden="true"></span>
					{/if}
				{/if}

				{#if active}
					<div
						class="tooltip"
						style:left={`${active.x}%`}
						style:top={`${active.y}%`}
					>
						<strong>{format(active.value)}</strong>
						{#if activeB}
							<strong class="secondary-value" style:color={secondaryAccent}>{format(activeB.value)}</strong>
						{/if}
						<span>{active.year}</span>
					</div>
				{/if}
			</div>

			<div class="x-axis" aria-hidden="true">
				{#each xTicks as tick, index (tick.year)}
					<span
						class:first={index === 0}
						class:last={index === xTicks.length - 1}
						style:left={`${tick.x}%`}>{tick.year}</span
					>
				{/each}
			</div>
		</div>
	{:else}
		<p class="empty">Série histórica não disponível para este indicador.</p>
	{/if}
</div>

<style>
	.metric-chart {
		width: 100%;
		--chart-h: 210px;
		--axis-w: 4.2rem;
	}
	.metric-chart.compact {
		--chart-h: 170px;
		--axis-w: 3.8rem;
	}
	.chart-grid {
		display: grid;
		grid-template-columns: var(--axis-w) minmax(0, 1fr);
		grid-template-rows: var(--chart-h) auto;
		width: 100%;
	}
	.y-axis {
		position: relative;
		height: var(--chart-h);
	}
	.y-axis span {
		position: absolute;
		right: 0.55rem;
		transform: translateY(-50%);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		line-height: 1;
		color: var(--text-4);
		white-space: nowrap;
	}
	.plot {
		position: relative;
		height: var(--chart-h);
		touch-action: pan-y;
		cursor: crosshair;
		outline: none;
	}
	.plot:focus-visible {
		outline: 2px solid var(--accent-1);
		outline-offset: 3px;
		border-radius: 0.5rem;
	}
	.plot svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.grid {
		stroke: var(--line);
		stroke-width: 1;
	}
	.area {
		stroke: none;
	}
	.line.secondary {
		stroke-width: 2.2;
		opacity: 0.9;
	}
	.dot.secondary {
		border-color: var(--dot-accent);
		background: var(--dot-accent);
	}
	.secondary-value {
		font-size: 0.9rem;
	}
	.line {
		fill: none;
		stroke: var(--accent);
		stroke-width: 2.4;
		stroke-linejoin: round;
		stroke-linecap: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: line-draw 0.7s var(--ease-out-soft) forwards;
	}
	@keyframes line-draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	.reference {
		stroke: var(--text-4);
		stroke-width: 1;
		stroke-dasharray: 4 4;
		opacity: 0.65;
	}
	.reference-label {
		font-family: var(--font-mono);
		font-size: 9px;
		fill: var(--text-4);
	}
	.bar {
		fill: color-mix(in oklab, var(--accent) 45%, var(--surface-2));
		transition: fill 0.15s ease;
		transform-origin: bottom;
		animation: bar-grow 0.55s var(--ease-out-soft) both;
	}
	@keyframes bar-grow {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}
	.bar.active {
		fill: var(--accent);
	}
	.cursor {
		stroke: var(--accent);
		stroke-width: 1;
		stroke-dasharray: 3 3;
		opacity: 0.7;
	}
	.dot {
		position: absolute;
		width: 9px;
		height: 9px;
		margin: -4.5px 0 0 -4.5px;
		border-radius: 50%;
		border: 2px solid var(--accent);
		background: var(--surface-1);
		pointer-events: none;
	}
	.dot.end {
		background: var(--accent);
	}
	.dot.hover {
		width: 13px;
		height: 13px;
		margin: -6.5px 0 0 -6.5px;
		background: var(--accent);
		box-shadow: 0 0 0 4px color-mix(in oklab, var(--accent) 18%, transparent);
	}
	.tooltip {
		position: absolute;
		transform: translate(-50%, -125%);
		pointer-events: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.05rem;
		padding: 0.38rem 0.55rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--surface-2);
		box-shadow: var(--shadow-soft);
		z-index: 3;
		white-space: nowrap;
	}
	.tooltip strong {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-1);
		font-variant-numeric: tabular-nums;
	}
	.tooltip span {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-4);
	}
	.x-axis {
		position: relative;
		grid-column: 2;
		height: 1.5rem;
	}
	.x-axis span {
		position: absolute;
		top: 0.3rem;
		transform: translateX(-50%);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-4);
		white-space: nowrap;
	}
	.x-axis span.first {
		transform: none;
	}
	.x-axis span.last {
		transform: translateX(-100%);
	}
	.empty {
		margin: 0.4rem 0;
		padding: 1rem;
		border: 1px dashed var(--line);
		border-radius: var(--radius-md);
		font-size: 0.85rem;
		color: var(--text-4);
		text-align: center;
	}
	@media (max-width: 560px) {
		.metric-chart {
			--chart-h: 170px;
			--axis-w: 3.4rem;
		}
		.metric-chart.compact {
			--chart-h: 145px;
		}
	}
</style>
