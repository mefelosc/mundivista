<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import { locale } from '#lib/locale.svelte';
	import { countries, indicatorMeta, rankOf } from '#lib/data/countries';
	import { indicatorIcon } from '#lib/data/indicator-icons';
	import { formatCompact, formatIndicatorValue, formatRank } from '#lib/format';
	import MetricChart from './MetricChart.svelte';
	import type { Country, IndicatorKey } from '#lib/types';

	interface Props {
		country: Country;
		compareCountry: Country | null;
		compareCode: string | null;
		onchange: (code: string) => void;
	}
	let { country, compareCountry, compareCode, onchange }: Props = $props();

	const isEn = $derived(locale.value === 'en');
	const tr = (pt: string, en: string) => (isEn ? en : pt);

	const KEYS: IndicatorKey[] = [
		'population',
		'gdpPerCapita',
		'lifeExpectancy',
		'co2PerCapita',
		'unemployment',
		'forestShare'
	];

	let hovered = $state<string | null>(null);

	const metaEn: Record<string, string> = {
		population: 'Population',
		gdpPerCapita: 'GDP per capita',
		lifeExpectancy: 'Life expectancy',
		co2PerCapita: 'CO₂ per capita',
		unemployment: 'Unemployment',
		forestShare: 'Forest area'
	};

	const shortEn: Record<string, string> = {
		population: 'Population',
		gdpPerCapita: 'GDP pc',
		lifeExpectancy: 'Life expectancy',
		co2PerCapita: 'CO₂ pc',
		unemployment: 'Unemployment',
		forestShare: 'Forest'
	};

	const shortPt: Record<string, string> = {
		population: 'População',
		gdpPerCapita: 'PIB pc',
		lifeExpectancy: 'Expectativa',
		co2PerCapita: 'CO₂ pc',
		unemployment: 'Desemprego',
		forestShare: 'Floresta'
	};

	const rows = $derived.by(() => {
		return KEYS.map((key) => {
			const a = country.indicators[key];
			const b = compareCountry?.indicators[key];
			const max = Math.max(a?.v ?? 0, b?.v ?? 0) || 1;
			const meta = indicatorMeta[key];
			return {
				key,
				label: isEn ? (metaEn[key] ?? meta?.name ?? key) : (meta?.name ?? key),
				icon: indicatorIcon(key),
				a,
				b,
				aWidth: a ? Math.max(2, (a.v / max) * 100) : 0,
				bWidth: b ? Math.max(2, (b.v / max) * 100) : 0,
				lowerBetter: meta?.dir === 'lower'
			};
		});
	});

	let trendKey = $state<IndicatorKey>('population');
	let trendMode = $state<'index' | 'values'>('index');
	const trendRow = $derived(rows.find((row) => row.key === trendKey) ?? rows[0]);
	const trendFormat = $derived((value: number) =>
		trendMode === 'index'
			? value.toLocaleString(isEn ? 'en-US' : 'pt-BR', { maximumFractionDigits: 0 })
			: formatIndicatorValue(trendKey, { v: value, y: trendRaw?.a.at(-1)?.[0] ?? 0 })
	);
	const trendRaw = $derived.by(() => {
		const a = country.indicators[trendKey]?.s ?? [];
		const b = compareCountry?.indicators[trendKey]?.s ?? [];
		const years = a
			.map(([year]) => year)
			.filter((year) => (b.length ? b.some(([other]) => other === year) : true))
			.sort((left, right) => left - right);
		const pick = (series: [number, number][]) =>
			years
				.map((year) => series.find(([candidate]) => candidate === year))
				.filter((item): item is [number, number] => Boolean(item));
		return { a: pick(a), b: pick(b) };
	});
	const trend = $derived.by(() => {
		if (trendMode === 'values') return trendRaw;
		const index = (series: [number, number][]) => {
			const first = series[0]?.[1];
			return first ? series.map(([year, value]) => [year, (value / first) * 100] as [number, number]) : series;
		};
		return { a: index(trendRaw.a), b: index(trendRaw.b) };
	});

	function fmt(key: IndicatorKey, value: { v: number; y: number } | undefined): string {
		return value ? formatIndicatorValue(key, value) : '—';
	}

	const countryName = $derived(isEn ? country.nameEn : country.name);
	const otherName = $derived(compareCountry ? (isEn ? compareCountry.nameEn : compareCountry.name) : '—');

	function yearOf(row: (typeof rows)[number]): number | null {
		return row.a?.y ?? row.b?.y ?? null;
	}
</script>

<section class="compare-panel" aria-label={tr('Comparação entre países', 'Country comparison')}>
	<header class="compare-head">
		<div>
			<span class="eyebrow">{tr('Comparar', 'Compare')}</span>
			<h2>{tr('Dois países, lado a lado', 'Two countries, side by side')}</h2>
			<p>{tr('Percentis globais, valores brutos e a diferença em cada indicador.', 'Global percentiles, raw values and the gap in each indicator.')}</p>
		</div>
		<div class="compare-actions">
			<div class="compare-flags">
				<span class={`fi fi-${country.iso2}`} aria-hidden="true"></span>
				<span class={`fi fi-${compareCountry?.iso2 ?? 'un'}`} aria-hidden="true"></span>
			</div>
			<label class="select">
				<span class="sr-only">{tr('País de comparação', 'Comparison country')}</span>
				<select value={compareCode ?? ''} onchange={(event) => onchange(event.currentTarget.value)}>
					{#each countries as option (option.code)}
						<option value={option.code}>{isEn ? option.nameEn : option.name}</option>
					{/each}
				</select>
			</label>
		</div>
	</header>

	{#if compareCountry}
		<div class="compare-grid">
			<div class="bars">
				<div class="bars-legend">
					<span class="legend-a"><i></i>{countryName}</span>
					<span class="legend-b"><i></i>{otherName}</span>
				</div>
				{#each rows as row (row.key)}
					<div
						role="group"
						class="compare-row"
						class:hovered={hovered === row.key}
						onpointerenter={() => (hovered = row.key)}
						onpointerleave={() => (hovered = null)}
					>
						<div class="row-head">
							<span class="row-label"><Icon name={row.icon} size={15} />{row.label}</span>
							<span class="row-meta">
								{row.lowerBetter ? tr('menor é melhor', 'lower is better') : tr('maior é melhor', 'higher is better')}
								{#if yearOf(row)}<em>{yearOf(row)}</em>{/if}
							</span>
						</div>
						<div class="bar-line">
							<span class="bar a" style:width={`${row.aWidth}%`}></span>
							<strong>{fmt(row.key, row.a)}</strong>
						</div>
						<div class="bar-line">
							<span class="bar b" style:width={`${row.bWidth}%`}></span>
							<strong>{fmt(row.key, row.b)}</strong>
						</div>
						<div class="row-foot">
							<span>{formatRank(rankOf(country.code, row.key))}</span>
							<span>{compareCountry ? formatRank(rankOf(compareCountry.code, row.key)) : '—'}</span>
						</div>
					</div>
				{/each}
			</div>

			<div class="trend-wrap">
				<div class="trend-head">
					<div class="trend-title">
						<span class="eyebrow">{tr('Evolução', 'Trend')}</span>
						<span class="trend-mode-note">{trendMode === 'index' ? tr('início = 100', 'first year = 100') : tr('valores absolutos', 'absolute values')}</span>
					</div>
					<div class="trend-chips" role="group" aria-label={tr('Indicador da comparação', 'Comparison indicator')}>
						{#each rows as row (row.key)}
							<button
								type="button"
								class:active={trendKey === row.key}
								onclick={() => (trendKey = row.key)}
							>
								<Icon name={row.icon} size={13} />
								{row.label}
							</button>
						{/each}
					</div>
					<div class="trend-mode" role="group" aria-label={tr('Modo do gráfico', 'Chart mode')}>
						<button type="button" class:active={trendMode === 'index'} onclick={() => (trendMode = 'index')}>{tr('Índice', 'Index')}</button>
						<button type="button" class:active={trendMode === 'values'} onclick={() => (trendMode = 'values')}>{tr('Valores', 'Values')}</button>
					</div>
				</div>
				<MetricChart
					series={trend.a}
					secondary={trend.b.length ? trend.b : null}
					accent="var(--accent-1)"
					secondaryAccent="var(--accent-2)"
					primaryLabel={countryName}
					secondaryLabel={otherName}
					label={trendRow?.label ?? 'Indicador'}
					format={trendFormat}
					axisFormat={(value) => formatCompact(value)}
				/>
				<div class="radar-legend">
					<span class="legend-a"><i></i>{countryName}</span>
					<span class="legend-b"><i></i>{otherName}</span>
				</div>
			</div>
		</div>
	{:else}
		<p class="empty">{tr('Escolha um país para comparar.', 'Choose a country to compare.')}</p>
	{/if}

	<footer class="compare-foot">
		<span>{tr('Fonte: Banco Mundial — observação mais recente disponível.', 'Source: World Bank — latest available observation.')}</span>
		<a href="https://data.worldbank.org" target="_blank" rel="noopener noreferrer">data.worldbank.org <Icon name="external" size={10} /></a>
	</footer>
</section>

<style>
	.compare-panel {
		padding: 1.1rem 1.2rem 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background:
			linear-gradient(135deg, color-mix(in oklab, var(--accent-1) 5%, transparent), transparent 55%),
			var(--surface-1);
		box-shadow: var(--shadow-soft);
		scroll-margin-top: calc(var(--header-h) + 4.2rem);
	}
	.compare-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.8rem;
		border-bottom: 1px solid var(--line);
	}
	.compare-head h2 {
		margin: 0.22rem 0 0.2rem;
		font-family: var(--font-display);
		font-size: clamp(1.5rem, 3vw, 2rem);
		font-weight: 700;
		letter-spacing: -0.04em;
	}
	.compare-head p {
		margin: 0;
		max-width: 34rem;
		font-size: 0.86rem;
		line-height: 1.5;
		color: var(--text-3);
	}
	.compare-actions {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-shrink: 0;
	}
	.compare-flags {
		display: flex;
	}
	.compare-flags .fi {
		width: 2.6rem;
		height: 1.8rem;
		border: 1px solid var(--line-strong);
		background-size: cover;
	}
	.compare-flags .fi + .fi {
		margin-left: -0.55rem;
	}
	.select select {
		height: 2.7rem;
		min-width: 12rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-pill);
		background: var(--surface-2);
		color: var(--text-1);
		font-size: 0.9rem;
		padding: 0 0.8rem;
	}
	.compare-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: 1.2rem;
		padding-top: 0.9rem;
	}
	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.bars-legend,
	.radar-legend {
		display: flex;
		gap: 0.8rem;
		font-size: 0.76rem;
		color: var(--text-3);
	}
	.legend-a,
	.legend-b {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}
	.legend-a i,
	.legend-b i {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
	}
	.legend-a i {
		background: var(--accent-1);
	}
	.legend-b i {
		background: var(--accent-2);
	}
	.compare-row {
		padding: 0.55rem 0.5rem 0.45rem;
		border-radius: var(--radius-md);
		transition: background 0.18s ease;
	}
	.compare-row.hovered {
		background: color-mix(in oklab, var(--accent-1) 7%, transparent);
	}
	.row-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.row-label {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-2);
	}
	.row-meta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
	}
	.row-meta em {
		font-style: normal;
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.08rem 0.35rem;
	}
	.bar-line {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.3rem;
	}
	.bar {
		display: block;
		height: 0.55rem;
		min-width: 2px;
		border-radius: 999px;
		transition: width 0.65s var(--ease-out-soft);
	}
	.bar.a {
		background: var(--accent-1);
	}
	.bar.b {
		background: var(--accent-2);
		opacity: 0.85;
	}
	.bar-line strong {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-2);
		font-variant-numeric: tabular-nums;
	}
	.row-foot {
		display: flex;
		justify-content: space-between;
		margin-top: 0.18rem;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		color: var(--text-4);
	}
	.trend-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.7rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}
	.trend-head {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.trend-title {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.trend-mode-note {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		color: var(--text-4);
	}
	.trend-mode {
		display: inline-flex;
		align-self: flex-start;
		gap: 0.15rem;
		padding: 0.15rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--surface-1);
	}
	.trend-mode button {
		border: 0;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--text-3);
		padding: 0.24rem 0.55rem;
		font-size: 0.7rem;
		font-weight: 600;
	}
	.trend-mode button.active {
		background: color-mix(in oklab, var(--accent-1) 15%, var(--surface-2));
		color: var(--accent-0);
	}
	.trend-chips {
		display: flex;
		gap: 0.25rem;
		overflow-x: auto;
		padding-bottom: 0.15rem;
		scrollbar-width: none;
	}
	.trend-chips::-webkit-scrollbar {
		display: none;
	}
	.trend-chips button {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		flex-shrink: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--surface-1);
		color: var(--text-3);
		padding: 0.3rem 0.55rem;
		font-size: 0.72rem;
		font-weight: 600;
	}
	.trend-chips button:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
	.trend-chips button.active {
		border-color: color-mix(in oklab, var(--accent-1) 55%, var(--line));
		background: color-mix(in oklab, var(--accent-1) 13%, var(--surface-1));
		color: var(--accent-0);
	}
	.compare-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		margin-top: 0.8rem;
		padding-top: 0.6rem;
		border-top: 1px solid var(--line);
		font-size: 0.68rem;
		color: var(--text-4);
	}
	.compare-foot a {
		color: var(--text-3);
		text-decoration: underline;
		text-underline-offset: 2px;
		white-space: nowrap;
	}
	.empty {
		padding: 1rem 0;
		font-size: 0.9rem;
		color: var(--text-4);
	}
	@media (max-width: 900px) {
		.compare-grid {
			grid-template-columns: 1fr;
		}
		.compare-head {
			flex-direction: column;
		}
		.compare-actions {
			width: 100%;
			justify-content: space-between;
		}
		.select {
			flex: 1;
		}
		.select select {
			width: 100%;
		}
	}
</style>
