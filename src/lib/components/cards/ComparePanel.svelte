<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import { locale } from '#lib/locale.svelte';
	import { countries, indicatorMeta, rankOf } from '#lib/data/countries';
	import { indicatorIcon } from '#lib/data/indicator-icons';
	import { formatIndicatorValue, formatRank } from '#lib/format';
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

	const RADAR_KEYS = ['population', 'gdpPerCapita', 'lifeExpectancy', 'co2PerCapita', 'unemployment', 'forestShare'] as const;
	const RADAR = 130;
	const CENTER = 180;

	const axes = $derived(
		RADAR_KEYS.map((key, index) => {
			const angle = (Math.PI * 2 * index) / RADAR_KEYS.length - Math.PI / 2;
			const meta = indicatorMeta[key];
			return {
				key,
				label: isEn ? (shortEn[key] ?? key) : (shortPt[key] ?? key),
				angle,
				x: CENTER + Math.cos(angle) * (RADAR + 32),
				y: CENTER + Math.sin(angle) * (RADAR + 32),
				anchor: Math.cos(angle) > 0.3 ? 'start' : Math.cos(angle) < -0.3 ? 'end' : 'middle',
				lowerBetter: meta?.dir === 'lower'
			};
		})
	);

	function score(code: string, key: string): number {
		const percentile = rankOf(code, key as IndicatorKey)?.percentile;
		if (percentile === undefined) return 0;
		const meta = indicatorMeta[key as IndicatorKey];
		return Math.max(0.04, meta?.dir === 'lower' ? 1 - percentile : percentile);
	}

	function polygon(code: string): string {
		return RADAR_KEYS.map((key, index) => {
			const angle = (Math.PI * 2 * index) / RADAR_KEYS.length - Math.PI / 2;
			const radius = score(code, key) * RADAR;
			return `${CENTER + Math.cos(angle) * radius},${CENTER + Math.sin(angle) * radius}`;
		}).join(' ');
	}

	function gridRing(radius: number): string {
		return RADAR_KEYS.map((_, index) => {
			const angle = (Math.PI * 2 * index) / RADAR_KEYS.length - Math.PI / 2;
			return `${CENTER + Math.cos(angle) * radius},${CENTER + Math.sin(angle) * radius}`;
		}).join(' ');
	}

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

			<div class="radar-wrap">
				<div class="radar-head">
					<span class="eyebrow">{tr('Perfil', 'Profile')}</span>
					<p>{tr('Para desemprego e CO₂, o exterior representa melhor desempenho.', 'For unemployment and CO₂, the outer edge means better performance.')}</p>
				</div>
				{#key `${country.code}-${compareCountry.code}`}
					<svg class="radar" viewBox="0 0 360 360" role="img" aria-label={tr(`Comparação de perfil entre ${countryName} e ${otherName}`, `Profile comparison between ${countryName} and ${otherName}`)}>
						{#each [0.25, 0.5, 0.75, 1] as ring (ring)}
							<polygon class="ring" points={gridRing(RADAR * ring)} />
						{/each}
						{#each axes as axis (axis.key)}
							<line class="axis" x1={CENTER} y1={CENTER} x2={CENTER + Math.cos(axis.angle) * RADAR} y2={CENTER + Math.sin(axis.angle) * RADAR} />
							<text class="axis-label" x={axis.x} y={axis.y} text-anchor={axis.anchor} dominant-baseline="middle">{axis.label}</text>
						{/each}
						<polygon class="area b" points={polygon(compareCountry.code)} />
						<polygon class="area a" points={polygon(country.code)} />
					</svg>
				{/key}
				<div class="radar-legend">
					<span class="legend-a"><i></i>{countryName}</span>
					<span class="legend-b"><i></i>{otherName}</span>
				</div>
				<p class="radar-note">{tr('Percentis globais (0–100). Indicadores sem série aparecem no centro.', 'Global percentiles (0–100). Indicators without a series sit at the centre.')}</p>
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
		font-size: 0.64rem;
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
		font-size: 0.62rem;
		color: var(--text-4);
	}
	.radar-wrap {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.35rem;
		padding: 0.7rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}
	.radar-head p {
		margin: 0.15rem 0 0;
		font-size: 0.72rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	.radar {
		display: block;
		width: 100%;
		height: auto;
		max-height: 24rem;
		overflow: visible;
	}
	.ring {
		fill: none;
		stroke: var(--line);
		stroke-width: 1;
	}
	.axis {
		stroke: var(--line);
		stroke-width: 0.8;
	}
	.axis-label {
		font-family: var(--font-mono);
		font-size: 10px;
		fill: var(--text-4);
	}
	.area {
		stroke-width: 2;
		stroke-linejoin: round;
		transform-origin: 180px 180px;
		animation: radar-in 0.6s var(--ease-out-soft) both;
	}
	.area.a {
		fill: color-mix(in oklab, var(--accent-1) 18%, transparent);
		stroke: var(--accent-1);
	}
	.area.b {
		fill: color-mix(in oklab, var(--accent-2) 14%, transparent);
		stroke: var(--accent-2);
		animation-delay: 0.08s;
	}
	@keyframes radar-in {
		from {
			opacity: 0;
			transform: scale(0.82);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	.radar-note {
		margin: 0;
		font-size: 0.66rem;
		line-height: 1.4;
		color: var(--text-4);
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
