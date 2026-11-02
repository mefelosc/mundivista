<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import MetricChart from './MetricChart.svelte';
	import { indicatorIcon, indicatorVariant } from '#lib/data/indicator-icons';
	import { formatCompact } from '#lib/format';
	import { locale } from '#lib/locale.svelte';
	import type { IndicatorKey } from '#lib/types';

	export interface IndicatorRow {
		key: IndicatorKey;
		label: string;
		value: string;
		year: number | null;
		unit: string;
		percentile: number | null;
		comparison: string | null;
		series: [number, number][] | null;
		source?: string | null;
		sourceUrl?: string | null;
		median: number | null;
		format: (value: number) => string;
		axisFormat: (value: number) => string;
		deltaMode: 'points' | 'percent';
	}

	interface Props {
		rows: IndicatorRow[];
		flag?: string | null;
		accent?: string;
		compact?: boolean;
	}

	let { rows, flag = null, accent = 'var(--accent-1)', compact = false }: Props = $props();

	const isEn = $derived(locale.value === 'en');

	type Variant = 'area' | 'bars' | 'line';
	const VARIANTS: { id: Variant; label: string; labelEn: string; icon: string }[] = [
		{ id: 'line', label: 'Linha', labelEn: 'Line', icon: 'timeline' },
		{ id: 'area', label: 'Área', labelEn: 'Area', icon: 'contour' },
		{ id: 'bars', label: 'Barras', labelEn: 'Bars', icon: 'strata' }
	];

	// svelte-ignore state_referenced_locally
	let activeKey = $state<IndicatorKey | null>(rows[0]?.key ?? null);
	// svelte-ignore state_referenced_locally
	let variant = $state<Variant>(rows[0] ? indicatorVariant(rows[0].key) : 'area');

	const active = $derived(rows.find((row) => row.key === activeKey) ?? rows[0]);

	$effect(() => {
		if (!rows.some((row) => row.key === activeKey)) {
			activeKey = rows[0]?.key ?? null;
			if (rows[0]) variant = indicatorVariant(rows[0].key);
		}
	});

	const delta = $derived.by(() => {
		const series = active?.series;
		if (!series || series.length < 2) return null;
		const first = series[0][1];
		const last = series[series.length - 1][1];
		const change = last - first;
		if (active.deltaMode === 'points') return change;
		return first === 0 ? null : (change / Math.abs(first)) * 100;
	});

	function select(row: IndicatorRow) {
		activeKey = row.key;
		variant = indicatorVariant(row.key);
	}

	function deltaText(value: number): string {
		if (active?.deltaMode === 'points') {
			const sign = value > 0 ? '+' : '';
			return `${sign}${formatCompact(Math.abs(value))}${active.unit ? ` ${active.unit}` : ''}`;
		}
		const sign = value > 0 ? '+' : '';
		return `${sign}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
	}
</script>

<div class="indicator-group" style:--accent={accent}>
	{#if active}
		<header class="chart-head">
			<span class="icon-tile"><Icon name={indicatorIcon(active.key)} size={20} /></span>
			<div class="chart-title">
				<span class="label">{active.label}</span>
				<div class="value-line">
					<strong>{active.value}</strong>
					{#if active.year}<span class="year">{active.year}</span>{/if}
					{#if active.source}
						{#if active.sourceUrl}
							<a class="source-tag" href={active.sourceUrl} target="_blank" rel="noopener noreferrer">{active.source}</a>
						{:else}
							<span class="source-tag">{active.source}</span>
						{/if}
					{/if}
					{#if active.percentile !== null}
						<span class="percentile">{isEn ? 'percentile' : 'percentil'} {Math.round(active.percentile * 100)}</span>
					{/if}
				</div>
				{#if delta !== null}
					<span class="delta" class:down={delta < 0}>{deltaText(delta)} {isEn ? 'over the series' : 'na série'}</span>
				{/if}
			</div>
			{#if flag}<span class={`fi fi-${flag} flag`} aria-hidden="true"></span>{/if}
			<div class="variant-toggle" role="group" aria-label="Tipo de gráfico">
				{#each VARIANTS as option (option.id)}
					<button
						type="button"
						class:active={variant === option.id}
						onclick={() => (variant = option.id)}
						title={isEn ? option.labelEn : option.label}
						aria-label={isEn ? option.labelEn : option.label}
						aria-pressed={variant === option.id}
					>
						<Icon name={option.icon} size={13} />
						<span>{isEn ? option.labelEn : option.label}</span>
					</button>
				{/each}
			</div>
		</header>

		{#if active.comparison}
			<p class="comparison">{active.comparison}.</p>
		{/if}

		{#key `${active.key}-${variant}`}
			<MetricChart
				series={active.series ?? []}
				format={active.format}
				axisFormat={active.axisFormat}
				{accent}
				{variant}
				label={active.label}
				reference={active.median}
				referenceLabel={isEn ? 'world median' : 'mediana mundial'}
				{compact}
			/>
		{/key}

		<div class="switcher" role="group" aria-label="Indicador do gráfico">
			{#each rows as row (row.key)}
				<button
					type="button"
					class:active={row.key === activeKey}
					onclick={() => select(row)}
					title={row.label}
				>
					<Icon name={indicatorIcon(row.key)} size={13} />
					<span>{row.label}</span>
				</button>
			{/each}
		</div>

		<div class="metric-list" class:compact>
			{#each rows as row (row.key)}
				<button
					type="button"
					class:active={row.key === activeKey}
					onclick={() => select(row)}
					aria-pressed={row.key === activeKey}
				>
					<span class="metric-icon"><Icon name={indicatorIcon(row.key)} size={15} /></span>
					<span class="metric-body">
						<span class="metric-label">{row.label}</span>
						<span class="metric-value">{row.value}</span>
						{#if !compact && row.source}
							<span class="metric-source">{row.source}</span>
						{/if}
						{#if !compact && row.comparison}
							<span class="metric-comparison">{row.comparison}</span>
						{/if}
					</span>
					<span class="metric-meta">
						{#if row.year}<span>{row.year}</span>{/if}
						{#if row.percentile !== null}<span>{Math.round(row.percentile * 100)}</span>{/if}
					</span>
					{#if row.percentile !== null}
						<span class="meter" aria-hidden="true">
							<span style:width={`${Math.max(3, Math.min(100, row.percentile * 100))}%`}></span>
						</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.indicator-group {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.chart-head {
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
		flex-wrap: wrap;
	}
	.icon-tile {
		display: grid;
		place-items: center;
		width: 2.6rem;
		height: 2.6rem;
		flex-shrink: 0;
		border: 1px solid color-mix(in oklab, var(--accent) 38%, var(--line));
		border-radius: 0.65rem;
		background: color-mix(in oklab, var(--accent) 12%, var(--surface-1));
		color: var(--accent);
	}
	.chart-title {
		display: flex;
		flex-direction: column;
		gap: 0.08rem;
		min-width: 0;
		flex: 1;
	}
	.label {
		font-family: var(--font-mono);
		font-size: 0.74rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.value-line {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.45rem;
	}
	.value-line strong {
		font-family: var(--font-display);
		font-size: 1.9rem;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.04em;
		color: var(--text-1);
		font-variant-numeric: tabular-nums;
	}
	.year,
	.percentile {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-4);
	}
	.source-tag {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.04em;
		color: var(--accent-0);
		text-decoration: none;
		border: 1px solid color-mix(in oklab, var(--accent-0) 35%, var(--line));
		border-radius: var(--radius-pill);
		padding: 0.1rem 0.4rem;
		white-space: nowrap;
	}
	.percentile {
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		padding: 0.16rem 0.45rem;
	}
	.delta {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--positive);
	}
	.delta.down {
		color: var(--negative);
	}
	.flag {
		width: 2.8rem;
		height: 1.9rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.25rem;
		background-size: cover;
	}
	.variant-toggle {
		display: flex;
		gap: 0.15rem;
		padding: 0.18rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--surface-1);
		margin-left: auto;
	}
	.variant-toggle button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 0;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--text-3);
		padding: 0.28rem 0.5rem;
		font-size: 0.7rem;
		font-weight: 600;
	}
	.variant-toggle button span {
		display: inline;
	}
	.variant-toggle button:hover {
		color: var(--text-1);
	}
	.variant-toggle button.active {
		background: color-mix(in oklab, var(--accent) 16%, var(--surface-2));
		color: var(--accent-0);
	}
	.comparison {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.45;
		color: var(--text-3);
	}
	.switcher {
		display: flex;
		gap: 0.25rem;
		overflow-x: auto;
		padding-bottom: 0.15rem;
		scrollbar-width: none;
	}
	.switcher::-webkit-scrollbar {
		display: none;
	}
	.switcher button {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--surface-1);
		color: var(--text-3);
		padding: 0.35rem 0.6rem;
		font-size: 0.72rem;
		font-weight: 600;
	}
	.switcher button:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
	.switcher button.active {
		border-color: color-mix(in oklab, var(--accent) 55%, var(--line));
		background: color-mix(in oklab, var(--accent) 13%, var(--surface-1));
		color: var(--accent-0);
	}
	.metric-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.4rem;
	}
	.metric-list button {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		grid-template-areas:
			'icon body meta'
			'meter meter meter';
		align-items: center;
		gap: 0.35rem 0.5rem;
		padding: 0.55rem 0.6rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface-1);
		color: inherit;
		text-align: left;
		transition: border-color 0.16s ease, transform 0.16s ease, background 0.16s ease;
	}
	.metric-list button:hover {
		border-color: var(--line-strong);
		transform: translateY(-1px);
	}
	.metric-list button.active {
		border-color: color-mix(in oklab, var(--accent) 48%, var(--line));
		background: color-mix(in oklab, var(--accent) 9%, var(--surface-1));
	}
	.metric-icon {
		grid-area: icon;
		display: grid;
		place-items: center;
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 0.45rem;
		background: color-mix(in oklab, var(--accent) 10%, var(--surface-2));
		color: var(--accent);
	}
	.metric-body {
		grid-area: body;
		display: flex;
		flex-direction: column;
		gap: 0.06rem;
		min-width: 0;
	}
	.metric-label {
		font-size: 0.75rem;
		line-height: 1.2;
		color: var(--text-3);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.metric-value {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.02em;
		color: var(--text-1);
		font-variant-numeric: tabular-nums;
	}
	.metric-comparison {
		font-size: 0.7rem;
		line-height: 1.3;
		color: var(--text-4);
	}
	.metric-source {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		line-height: 1.3;
		color: var(--accent-0);
	}
	.metric-meta {
		grid-area: meta;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.1rem;
		font-family: var(--font-mono);
		font-size: 0.66rem;
		color: var(--text-4);
	}
	.meter {
		grid-area: meter;
		display: block;
		height: 3px;
		overflow: hidden;
		border-radius: var(--radius-pill);
		background: var(--line);
	}
	.meter span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
		opacity: 0.85;
	}
	.metric-list.compact {
		grid-template-columns: 1fr 1fr;
	}
	.metric-list.compact .metric-label {
		font-size: 0.72rem;
	}
	.metric-list.compact .metric-value {
		font-size: 0.98rem;
	}
	@media (max-width: 560px) {
		.metric-list,
		.metric-list.compact {
			grid-template-columns: 1fr;
		}
		.value-line strong {
			font-size: 1.65rem;
		}
		.variant-toggle button span {
			display: none;
		}
	}
</style>
