<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import { locale } from '#lib/locale.svelte';
	import { countries, indicatorMeta, rankOf } from '#lib/data/countries';
	import { indicatorIcon } from '#lib/data/indicator-icons';
	import { formatCompact, formatIndicatorValue, formatRank } from '#lib/format';
	import type { Country, IndicatorKey, IndicatorValue } from '#lib/types';

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

	const LABELS_EN: Record<string, string> = {
		population: 'Population',
		gdpPerCapita: 'GDP per capita',
		lifeExpectancy: 'Life expectancy',
		co2PerCapita: 'CO₂ per capita',
		unemployment: 'Unemployment',
		forestShare: 'Forest area'
	};

	const SHORT_EN: Record<string, string> = {
		population: 'Population',
		gdpPerCapita: 'GDP pc',
		lifeExpectancy: 'Life',
		co2PerCapita: 'CO₂ pc',
		unemployment: 'Jobs',
		forestShare: 'Forest'
	};

	const SHORT_PT: Record<string, string> = {
		population: 'População',
		gdpPerCapita: 'PIB pc',
		lifeExpectancy: 'Vida',
		co2PerCapita: 'CO₂ pc',
		unemployment: 'Emprego',
		forestShare: 'Floresta'
	};

	let hovered = $state<string | null>(null);

	const countryName = $derived(isEn ? country.nameEn : country.name);
	const otherName = $derived(compareCountry ? (isEn ? compareCountry.nameEn : compareCountry.name) : '—');

	const rows = $derived.by(() => {
		return KEYS.map((key) => {
			const a = country.indicators[key];
			const b = compareCountry?.indicators[key];
			const meta = indicatorMeta[key];
			const max = Math.max(a?.v ?? 0, b?.v ?? 0) || 1;
			return {
				key,
				label: isEn ? (LABELS_EN[key] ?? meta?.name ?? key) : (meta?.name ?? key),
				short: isEn ? (SHORT_EN[key] ?? key) : (SHORT_PT[key] ?? key),
				icon: indicatorIcon(key),
				a,
				b,
				aHeight: a ? Math.max(3, (a.v / max) * 100) : 0,
				bHeight: b ? Math.max(3, (b.v / max) * 100) : 0,
				aLabel: compactValue(key, a),
				bLabel: compactValue(key, b),
				aRank: formatRank(rankOf(country.code, key)),
				bRank: compareCountry ? formatRank(rankOf(compareCountry.code, key)) : '—',
				lowerBetter: meta?.dir === 'lower',
				year: a?.y ?? b?.y ?? null
			};
		});
	});

	function compactValue(key: IndicatorKey, value: IndicatorValue | undefined): string {
		if (!value) return '—';
		if (key === 'gdpPerCapita') return `US$ ${formatCompact(value.v)}`;
		if (key === 'population' || key === 'co2Total') {
			return formatCompact(value.v);
		}
		return formatIndicatorValue(key, value);
	}

	const leadership = $derived.by(() => {
		let a = 0;
		let b = 0;
		for (const row of rows) {
			if (!row.a || !row.b) continue;
			const aBetter = row.lowerBetter ? row.a.v < row.b.v : row.a.v > row.b.v;
			const bBetter = row.lowerBetter ? row.b.v < row.a.v : row.b.v > row.a.v;
			if (aBetter) a += 1;
			else if (bBetter) b += 1;
		}
		return { a, b };
	});
</script>

<section class="compare-panel" aria-label={tr('Comparação entre países', 'Country comparison')}>
	<header class="compare-head">
		<div>
			<span class="eyebrow">{tr('Comparar', 'Compare')}</span>
			<h2>{tr('Dois países, lado a lado', 'Two countries, side by side')}</h2>
			<p>
				{tr(
					'Barras verticais por indicador, normalizadas pelo maior valor do par. O valor absoluto e o ano aparecem sob cada grupo.',
					'Vertical bars per indicator, normalised by the larger value in each pair. The absolute value and year appear below each group.'
				)}
			</p>
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
		<div class="compare-summary">
			<div class="legend">
				<span class="legend-a"><i></i>{countryName}</span>
				<span class="legend-b"><i></i>{otherName}</span>
			</div>
			<p>
				<strong>{countryName}</strong>
				{tr('lidera em', 'leads in')}
				<strong>{leadership.a}</strong>
				{tr('de 6 indicadores', 'of 6 indicators')}
				{#if leadership.b}· <strong>{otherName}</strong> {tr('em', 'in')} <strong>{leadership.b}</strong>{/if}
			</p>
		</div>

		<div class="chart-shell">
			<div class="axis-title">{tr('maior = 100', 'larger = 100')}</div>
			<div class="chart">
				<div class="y-axis" aria-hidden="true">
					<span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
				</div>
				<div class="plot">
					<div class="grid-lines" aria-hidden="true">
						<i></i><i></i><i></i><i></i><i></i>
					</div>
					<div class="groups">
						{#each rows as row (row.key)}
							<div
								class="group"
								class:hovered={hovered === row.key}
								role="group"
								aria-label={tr(
									`${row.label}: ${countryName} ${row.aLabel}, ${otherName} ${row.bLabel}`,
									`${row.label}: ${countryName} ${row.aLabel}, ${otherName} ${row.bLabel}`
								)}
								onpointerenter={() => (hovered = row.key)}
								onpointerleave={() => (hovered = null)}
							>
								<div class="bars">
									<div class="bar-wrap">
										<div class="bar a" style:height={`${row.aHeight}%`}></div>
									</div>
									<div class="bar-wrap">
										<div class="bar b" style:height={`${row.bHeight}%`}></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
			<div class="x-spacer"></div>
			<div class="x-labels">
				{#each rows as row (row.key)}
					<div class="x-label">
						<span class="x-title"><Icon name={row.icon} size={14} />{row.short}</span>
						{#if row.year}<span class="x-year">{row.year}</span>{/if}
						<span class="x-value"><i class="dot a"></i>{row.aLabel}</span>
						<span class="x-value"><i class="dot b"></i>{row.bLabel}</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="compare-notes">
			<span>{tr('Barras normalizadas pelo maior valor do par; os valores absolutos estão sob cada grupo.', 'Bars normalised by the larger value in each pair; absolute values sit below each group.')}</span>
		</div>
	{:else}
		<p class="empty">{tr('Escolha um país para comparar.', 'Choose a country to compare.')}</p>
	{/if}

	<footer class="compare-foot">
		<span>{tr('Fonte: Banco Mundial — observação mais recente disponível.', 'Source: World Bank — latest available observation.')}</span>
		<a href="https://data.worldbank.org" target="_blank" rel="noopener noreferrer">
			data.worldbank.org <Icon name="external" size={10} />
		</a>
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
		max-width: 38rem;
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
	.compare-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0 0.45rem;
	}
	.legend {
		display: flex;
		gap: 0.9rem;
		font-size: 0.8rem;
		color: var(--text-3);
	}
	.legend-a,
	.legend-b {
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
	}
	.legend-a i,
	.legend-b i {
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 50%;
	}
	.legend-a i {
		background: var(--accent-1);
	}
	.legend-b i {
		background: var(--accent-2);
	}
	.compare-summary p {
		margin: 0;
		font-size: 0.82rem;
		color: var(--text-3);
	}
	.compare-summary strong {
		color: var(--text-1);
	}
	.chart-shell {
		padding: 0.6rem 0 0;
	}
	.axis-title {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-4);
		padding-left: 3.5rem;
	}
	.chart {
		display: grid;
		grid-template-columns: 3.5rem minmax(0, 1fr);
		margin-top: 0.25rem;
	}
	.y-axis {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 310px;
		padding: 0 0.55rem 0 0;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		color: var(--text-4);
		text-align: right;
	}
	.plot {
		position: relative;
		height: 310px;
		border-left: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}
	.grid-lines {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: none;
	}
	.grid-lines i {
		display: block;
		height: 1px;
		background: var(--line);
	}
	.groups {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 0.4rem;
		padding: 0 0.4rem;
	}
	.group {
		position: relative;
		display: flex;
		align-items: flex-end;
		height: 100%;
		padding-top: 1.7rem;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		outline: none;
		transition: background 0.16s ease;
	}
	.group.hovered {
		background: color-mix(in oklab, var(--accent-1) 6%, transparent);
	}
	.bars {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 0.35rem;
		width: 100%;
		height: 100%;
	}
	.bar-wrap {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		width: 2.2rem;
		max-width: 40%;
		height: 100%;
	}
	.bar {
		position: relative;
		width: 100%;
		border-radius: 0.35rem 0.35rem 0 0;
		transform-origin: bottom;
		animation: bar-rise 0.55s var(--ease-out-soft) both;
	}
	.bar.a {
		background: linear-gradient(180deg, var(--accent-1), color-mix(in oklab, var(--accent-1) 72%, var(--surface-2)));
	}
	.bar.b {
		background: linear-gradient(180deg, var(--accent-2), color-mix(in oklab, var(--accent-2) 72%, var(--surface-2)));
	}
	@keyframes bar-rise {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}
	.x-spacer {
		height: 0;
	}
	.x-labels {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 0.4rem;
		padding: 0.45rem 0.4rem 0;
	}
	.x-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.16rem;
		text-align: center;
		min-width: 0;
		padding-bottom: 0.2rem;
	}
	.x-title {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.22rem;
		font-size: 0.74rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--text-2);
	}
	.x-year {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		line-height: 1.2;
		color: var(--text-4);
	}
	.x-value {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--text-2);
		white-space: nowrap;
	}
	.compare-notes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding-top: 0.55rem;
		font-size: 0.68rem;
		color: var(--text-4);
	}
	.compare-notes span {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}
	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
	}
	.dot.a {
		background: var(--accent-1);
	}
	.dot.b {
		background: var(--accent-2);
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
		.compare-summary {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.35rem;
		}
		.chart-shell {
			overflow-x: auto;
			padding-bottom: 0.4rem;
		}
		.chart {
			min-width: 620px;
		}
	}
</style>
