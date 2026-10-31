<script lang="ts">
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import LocatorMap from '#lib/components/cards/LocatorMap.svelte';
	import StatRow from '#lib/components/cards/StatRow.svelte';
	import Sparkline from '#lib/components/cards/Sparkline.svelte';
	import {
		countries,
		getCountry,
		indicatorMeta,
		rankOf,
		retrievedAt,
		worldStats
	} from '#lib/data/countries';
	import { capitalInPortuguese } from '#lib/data/capitals-pt';
	import { getHistorical, historicalSource } from '#lib/data/historical';
	import { disputedInfo } from '#lib/data/disputed';
	import { organizationsForCountry } from '#lib/data/organizations';
	import { snippetsByCountry } from '#lib/data/snippets';
	import { formatArea, formatCompact, formatIndicatorValue } from '#lib/format';
	import type { Country, IndicatorKey } from '#lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const country = $derived(getCountry(data.code));
	const capital = $derived(country ? capitalInPortuguese(country.code, country.capital) : null);
	const historical = $derived(country ? getHistorical(country.code) : null);
	const orgs = $derived(country ? organizationsForCountry(country.code) : []);
	const currentOrgs = $derived(orgs.filter((o) => o.era === 'current'));
	const historicalOrgs = $derived(orgs.filter((o) => o.era === 'historical'));
	const neighbors = $derived(
		country ? (country.borders.map((b) => getCountry(b)).filter(Boolean) as Country[]) : []
	);
	const snippets = $derived(country ? (snippetsByCountry.get(country.code) ?? []) : []);
	const disputed = $derived(country ? disputedInfo(country.code) : null);

	let compareCode = $state<string | null>(null);
	let copied = $state(false);

	const compareCountry = $derived(getCountry(compareCode));

	const GROUPS: {
		id: string;
		index: string;
		title: string;
		layer: string;
		keys: IndicatorKey[];
	}[] = [
		{
			id: 'demography',
			index: '02',
			title: 'Demografia',
			layer: 'population',
			keys: ['population', 'popDensity', 'popGrowth', 'lifeExpectancy', 'urbanShare', 'fertility', 'schoolEnrollment']
		},
		{
			id: 'economy',
			index: '03',
			title: 'Economia',
			layer: 'economy',
			keys: ['gdp', 'gdpPerCapita', 'gdpGrowth', 'unemployment', 'inflation', 'debtShare', 'exportsShare', 'importsShare', 'industryShare', 'agriShare', 'researchShare', 'tourism', 'gini']
		},
		{
			id: 'environment',
			index: '04',
			title: 'Meio físico e clima',
			layer: 'physical',
			keys: ['forestShare', 'renewableShare', 'electricityAccess', 'co2PerCapita', 'co2Total', 'energyUse', 'healthShare', 'internetShare']
		},
		{
			id: 'geopolitics',
			index: '05',
			title: 'Geopolítica e governança',
			layer: 'geopolitics',
			keys: ['militaryShare', 'govEffectiveness', 'controlCorruption', 'ruleOfLaw']
		}
	];

	function rowsFor(keys: IndicatorKey[], target: Country | null) {
		if (!target) return [];
		return keys.map((key) => {
			const value = target.indicators[key];
			const rank = rankOf(target.code, key);
			const stats = worldStats(key);
			const meta = indicatorMeta[key];
			let comparison: string | null = null;
			if (value && stats) {
				const above = value.v >= stats.median;
				const better = meta?.dir === 'lower' ? !above : above;
				comparison = `${better ? 'Melhor que' : 'Pior que'} a mediana (${formatIndicatorValue(key, { v: stats.median, y: value.y })})`;
			}
			return {
				key,
				label: meta?.name ?? key,
				value: value ? formatIndicatorValue(key, value) : 'Não disponível',
				year: value?.y ?? null,
				percentile: rank?.percentile ?? null,
				rank,
				comparison,
				series: value?.s ?? null
			};
		});
	}

	const groupRows = $derived.by(() =>
		GROUPS.map((group) => ({ ...group, rows: rowsFor(group.keys, country) }))
	);

	const timeline = $derived.by(() => {
		if (!country) return [];
		const events: { year: number; title: string; text: string }[] = [];
		if (historical?.independence) {
			events.push({
				year: historical.independence,
				title: 'Marco de independência / formação',
				text: historical.independenceFrom
					? `De: ${historical.independenceFrom}. ${historical.note ?? ''}`
					: (historical.note ?? '')
			});
		}
		for (const former of historical?.formerNames ?? []) {
			events.push({
				year: former.to ?? former.from ?? historical?.independence ?? 0,
				title: former.name,
				text: [former.from && `de ${former.from}`, former.to && `até ${former.to}`].filter(Boolean).join(' · ')
			});
		}
		for (const org of currentOrgs) {
			const since = org.since?.[country.code];
			if (since) {
				events.push({
					year: since,
					title: `Entrada na ${org.short}`,
					text: `${org.name}. ${org.note}`
				});
			}
		}
		for (const org of historicalOrgs) {
			events.push({
				year: org.founded,
				title: org.short,
				text: `${org.name} · ${org.founded}–${org.dissolved ?? 'hoje'}. ${org.note}`
			});
		}
		return events.filter((e) => e.year > 0).sort((a, b) => a.year - b.year);
	});

	const COMPARE_KEYS: IndicatorKey[] = ['population', 'gdpPerCapita', 'lifeExpectancy', 'co2PerCapita', 'unemployment'];
	const compareRows = $derived.by(() => {
		if (!country) return [];
		return COMPARE_KEYS.map((key) => {
			const a = country.indicators[key];
			const b = compareCountry?.indicators[key];
			const max = Math.max(a?.v ?? 0, b?.v ?? 0) || 1;
			return {
				key,
				label: indicatorMeta[key]?.name ?? key,
				a,
				b,
				aWidth: a ? Math.max(2, (a.v / max) * 100) : 0,
				bWidth: b ? Math.max(2, (b.v / max) * 100) : 0
			};
		});
	});

	const defaultCompare = $derived(country?.borders[0] ?? 'USA');
	$effect(() => {
		if (!compareCode && country) compareCode = defaultCompare;
	});

	async function share() {
		const url = typeof location !== 'undefined' ? location.href : '';
		try {
			if (navigator.share) await navigator.share({ title: `${country?.name} — Mundivista`, url });
			else {
				await navigator.clipboard.writeText(url);
				copied = true;
				setTimeout(() => (copied = false), 1800);
			}
		} catch {
			/* cancelado */
		}
	}

	function fmt(key: IndicatorKey, value: number) {
		return formatIndicatorValue(key, { v: value, y: 0 });
	}

	function wikipediaUrl(target: Country): string {
		return `https://pt.wikipedia.org/wiki/${encodeURIComponent(target.name.replaceAll(' ', '_'))}`;
	}

	function britannicaUrl(target: Country): string {
		return `https://www.britannica.com/search?query=${encodeURIComponent(target.nameEn)}`;
	}
</script>

<svelte:head>
	<title>{country ? `${country.name} — Dossiê — Mundivista` : 'Dossiê — Mundivista'}</title>
	<meta
		name="description"
		content={country
			? `Dossiê de ${country.name}: demografia, economia, meio físico, geopolítica, história e fontes.`
			: 'Dossiê de país'}
	/>
</svelte:head>

<TopBar />

{#if !country}
	<main id="conteudo" class="missing">
		<h1>País não encontrado</h1>
		<p>O código informado não corresponde a um território no atlas.</p>
		<a class="btn btn-accent" href="/explore">Voltar ao mapa</a>
	</main>
{:else}
	<main id="conteudo">
		<nav class="crumbs" aria-label="Trilha">
			<a href="/explore">Explorar</a>
			<span>/</span>
			{#if country.continent}<span>{country.continent}</span><span>/</span>{/if}
			<span>{country.name}</span>
		</nav>

		<header class="hero">
			<div class="title-block">
				<div class="flag-row">
					{#if country.iso2}<span class={`fi fi-${country.iso2} hero-flag`}></span>{/if}
					<span class="eyebrow">Dossiê · {country.code}</span>
					{#if country.type}<span class="type">{country.type}</span>{/if}
				</div>
				<h1>{country.name}</h1>
				<p class="official">{country.official ?? country.nameEn}</p>
				<p class="lede">
					{country.continent ?? 'Sem classificação continental'}{country.subregion ? ` · ${country.subregion}` : ''}.
					{country.areaKm2 ? `Área de ${formatArea(country.areaKm2)}.` : ''}
					{#if country.landlocked === true}País sem litoral.{:else if country.landlocked === false}Com saída para o mar.{/if}
				</p>
			</div>
			<div class="hero-actions">
				<a class="btn" href={`/explore?country=${country.code}`}>
					<Icon name="globe" size={14} /> Ver no mapa
				</a>
				<a class="btn" href={wikipediaUrl(country)} target="_blank" rel="noopener noreferrer">
					<Icon name="book" size={14} /> Wikipédia
				</a>
				<a class="btn" href={britannicaUrl(country)} target="_blank" rel="noopener noreferrer">
					<Icon name="external" size={14} /> Britannica
				</a>
				<button class="btn" type="button" onclick={share}>
					<Icon name={copied ? 'check' : 'link'} size={14} /> {copied ? 'Link copiado' : 'Compartilhar'}
				</button>
			</div>
		</header>

		<section class="glance" aria-label="Resumo">
			<div>
				<span class="glance-label">População</span>
				<strong>{country.indicators.population ? formatCompact(country.indicators.population.v) : '—'}</strong>
				<em>{country.indicators.population?.y ?? 'não disponível'}</em>
				{#if rankOf(country.code, 'population')}
					<span class="rank">{rankOf(country.code, 'population')!.rank}º de {rankOf(country.code, 'population')!.total}</span>
				{/if}
			</div>
			<div>
				<span class="glance-label">PIB per capita</span>
				<strong>{country.indicators.gdpPerCapita ? fmt('gdpPerCapita', country.indicators.gdpPerCapita.v) : '—'}</strong>
				<em>{country.indicators.gdpPerCapita?.y ?? 'não disponível'}</em>
				{#if rankOf(country.code, 'gdpPerCapita')}
					<span class="rank">{rankOf(country.code, 'gdpPerCapita')!.rank}º de {rankOf(country.code, 'gdpPerCapita')!.total}</span>
				{/if}
			</div>
			<div>
				<span class="glance-label">Área</span>
				<strong>{country.areaKm2 ? formatArea(country.areaKm2) : '—'}</strong>
				<em>superfície terrestre</em>
			</div>
			<div>
				<span class="glance-label">Capital</span>
				<strong class="capital">{capital ?? '—'}</strong>
				<em>{country.unMember ? 'Estado-membro da ONU' : 'Estatuto não membro'}</em>
			</div>
		</section>

		<div class="layout">
			<article class="main-col">
				<section class="block">
					<header class="block-head">
						<span class="index">01</span>
						<h2>Ficha técnica</h2>
					</header>
					<div class="facts">
						<StatRow label="Nome oficial (EN)" value={country.official ?? 'Não disponível'} />
						<StatRow label="Nome em inglês" value={country.nameEn} />
						<StatRow label="Continente" value={country.continent ?? 'Não disponível'} />
						<StatRow label="Sub-região" value={country.subregion ?? 'Não disponível'} />
						<StatRow label="Moeda" value={country.currency.length ? country.currency.map((c) => `${c.code} · ${c.symbol}`).join(', ') : 'Não disponível'} />
						<StatRow label="Idiomas" value={country.languages.length ? country.languages.join(', ') : 'Não disponível'} />
						<StatRow label="Membro da ONU" value={country.unMember === null ? 'Não disponível' : country.unMember ? 'Sim' : 'Não'} />
						<StatRow label="Sem litoral" value={country.landlocked === null ? 'Não disponível' : country.landlocked ? 'Sim' : 'Não'} />
						{#if disputed}
							<StatRow label="Estatuto" value={disputed.label} note={disputed.note} />
						{:else if country.status}
							<StatRow label="Estatuto no Natural Earth" value={country.status} />
						{/if}
						{#if disputed}
							<a class="disputed-source" href={disputed.source.url} target="_blank" rel="noopener noreferrer">
								Fonte do estatuto: {disputed.source.name} <Icon name="external" size={10} />
							</a>
						{/if}
					</div>
				</section>

				{#each groupRows as group (group.id)}
					<section class="block" id={group.id}>
						<header class="block-head">
							<span class="index">{group.index}</span>
							<h2>{group.title}</h2>
							<a class="map-link" href={`/explore?country=${country.code}&layer=${group.layer}`}>
								Ver no mapa <Icon name="arrowUpRight" size={12} />
							</a>
						</header>
						<div class="stats">
							{#each group.rows as row (row.key)}
								<div class="stat-wrap">
									<StatRow
										label={row.label}
										value={row.value}
										year={row.year}
										percentile={row.percentile}
										comparison={row.comparison}
									/>
									{#if row.series && row.series.length > 2}
										<Sparkline
											series={row.series}
											label={row.label}
											format={(v) => fmt(row.key, v)}
											delta={indicatorMeta[row.key]?.unit.includes('%') ? 'points' : 'percent'}
										/>
									{/if}
								</div>
							{/each}
						</div>
						<footer class="source">
							<span>Fonte: Banco Mundial — {group.rows.length} indicadores, observação mais recente entre 2016 e 2025.</span>
							<a href="https://data.worldbank.org" target="_blank" rel="noopener noreferrer">data.worldbank.org <Icon name="external" size={10} /></a>
						</footer>
					</section>
				{/each}

				<section class="block" id="history">
					<header class="block-head">
						<span class="index">06</span>
						<h2>História</h2>
						<a class="map-link" href={`/explore?country=${country.code}&layer=history`}>
							Ver no mapa <Icon name="arrowUpRight" size={12} />
						</a>
					</header>
					{#if timeline.length}
						<ol class="timeline">
							{#each timeline as event (event.year + event.title)}
								<li>
									<span class="year">{event.year}</span>
									<div>
										<strong>{event.title}</strong>
										{#if event.text}<p>{event.text}</p>{/if}
									</div>
								</li>
							{/each}
						</ol>
					{:else}
						<p class="empty">Sem marcos históricos curados para este país.</p>
					{/if}
					<footer class="source">
						<span>{historicalSource.name} — {historicalSource.note}</span>
						<a href={historicalSource.url} target="_blank" rel="noopener noreferrer">Britannica <Icon name="external" size={10} /></a>
					</footer>
				</section>

				{#if currentOrgs.length || historicalOrgs.length}
					<section class="block" id="organizations">
						<header class="block-head">
							<span class="index">07</span>
							<h2>Organizações</h2>
						</header>
						<div class="org-grid">
							{#each currentOrgs as org (org.id)}
								<div class="org">
									<div class="org-head"><span>{org.short}</span><em>{org.since?.[country.code] ?? org.founded}</em></div>
									<p>{org.name}</p>
									<small>{org.note}</small>
									<a href={org.source.url} target="_blank" rel="noopener noreferrer">{org.source.name}</a>
								</div>
							{/each}
							{#each historicalOrgs as org (org.id)}
								<div class="org historical">
									<div class="org-head"><span>{org.short}</span><em>{org.founded}–{org.dissolved ?? 'hoje'}</em></div>
									<p>{org.name}</p>
									<small>{org.note}</small>
									<a href={org.source.url} target="_blank" rel="noopener noreferrer">{org.source.name}</a>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				{#if snippets.length}
					<section class="block" id="snippets">
						<header class="block-head">
							<span class="index">08</span>
							<h2>Leituras rápidas</h2>
						</header>
						<div class="snippets">
							{#each snippets as snippet (snippet.id)}
								<article>
									<span class="eyebrow">{snippet.category}</span>
									<h3>{snippet.title}</h3>
									<p>{snippet.body}</p>
									<a href={snippet.sourceUrl} target="_blank" rel="noopener noreferrer">
										{snippet.source}{snippet.year ? ` · ${snippet.year}` : ''} <Icon name="external" size={10} />
									</a>
								</article>
							{/each}
						</div>
					</section>
				{/if}
			</article>

			<aside class="side-col">
				<section class="side-block">
					<header class="block-head">
						<span class="index">A</span>
						<h2>No mapa</h2>
					</header>
					<LocatorMap {country} {neighbors} />
					<div class="neighbors">
						{#each neighbors as neighbor (neighbor.code)}
							<a href={`/country/${neighbor.code}`}>
								{#if neighbor.iso2}<span class={`fi fi-${neighbor.iso2} mini`}></span>{/if}
								{neighbor.name}
							</a>
						{:else}
							<p class="empty">Sem fronteiras terrestres.</p>
						{/each}
					</div>
				</section>

				<section class="side-block">
					<header class="block-head">
						<span class="index">B</span>
						<h2>Comparar</h2>
					</header>
					<label class="select-label">
						<span class="sr-only">País de comparação</span>
						<select bind:value={compareCode}>
							{#each countries as option (option.code)}
								<option value={option.code}>{option.name}</option>
							{/each}
						</select>
					</label>
					{#if compareCountry}
						<div class="compare">
							<div class="compare-head">
								<span>{country.name}</span>
								<span>{compareCountry.name}</span>
							</div>
							{#each compareRows as row (row.key)}
								<div class="compare-row">
									<span class="compare-label">{row.label}</span>
									<div class="bars">
										<div class="bar-line">
											<span class="bar a" style:width={`${row.aWidth}%`}></span>
											<em>{row.a ? row.a.y : '—'}</em>
										</div>
										<div class="bar-line">
											<span class="bar b" style:width={`${row.bWidth}%`}></span>
											<em>{row.b ? row.b.y : '—'}</em>
										</div>
									</div>
									<div class="compare-values">
										<span>{row.a ? fmt(row.key, row.a.v) : '—'}</span>
										<span>{row.b ? fmt(row.key, row.b.v) : '—'}</span>
									</div>
								</div>
							{/each}
						</div>
						<p class="method">Barras normalizadas pelo maior valor do par. Anos diferentes são mostrados em cada linha. Comparações entre anos não equivalem a séries ajustadas.</p>
					{/if}
				</section>

				<section class="side-block">
					<header class="block-head">
						<span class="index">C</span>
						<h2>Metadados</h2>
					</header>
					<dl class="metadata">
						<div><dt>Código</dt><dd>{country.code} · {country.iso3}</dd></div>
						<div><dt>Fonte de fatos</dt><dd>{country.factSource ?? 'Natural Earth'}</dd></div>
						<div><dt>Extração</dt><dd>{retrievedAt}</dd></div>
						<div><dt>Fronteiras</dt><dd>Natural Earth 1:50m</dd></div>
						<div><dt>Indicadores</dt><dd>World Bank, 20+ séries</dd></div>
					</dl>
					<a class="sources-link" href="/sobre">Fontes, licenças e limitações <Icon name="arrowRight" size={12} /></a>
				</section>
			</aside>
		</div>

		<footer class="page-footer">
			<a href="/explore">← Voltar ao mapa</a>
			<span>{countries.length} territórios · atualizado em {retrievedAt}</span>
			<a href="/play">Jogar com o mapa →</a>
		</footer>
	</main>
{/if}

<style>
	main {
		min-height: 100dvh;
		padding: calc(var(--header-h) + 1.6rem) clamp(1rem, 4vw, 3rem) 3rem;
		max-width: 82rem;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}
	.crumbs {
		display: flex;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.715rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.crumbs a {
		color: var(--text-3);
		text-decoration: none;
	}
	.crumbs a:hover {
		color: var(--accent-0);
	}
	.hero {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 2rem;
		padding: 1.4rem 0 1.3rem;
		border-bottom: 1px solid var(--line-strong);
	}
	.flag-row {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}
	.hero-flag {
		width: 1.8rem;
		height: 1.2rem;
		border: 1px solid var(--line-strong);
		background-size: cover;
	}
	.type {
		font-family: var(--font-mono);
		font-size: 0.650rem;
		color: var(--text-4);
		border: 1px solid var(--line);
		padding: 0.1rem 0.3rem;
	}
	h1 {
		margin: 0.5rem 0 0.1rem;
		font-family: var(--font-display);
		font-size: clamp(2.6rem, 6vw, 4.8rem);
		font-weight: 600;
		line-height: 0.98;
		letter-spacing: -0.03em;
	}
	.official {
		margin: 0.2rem 0 0;
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.150rem;
		color: var(--text-3);
	}
	.lede {
		max-width: 40rem;
		margin: 0.7rem 0 0;
		font-size: 1.040rem;
		line-height: 1.6;
		color: var(--text-3);
	}
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		justify-content: flex-end;
	}
	.glance {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border-bottom: 1px solid var(--line-strong);
	}
	.glance > div {
		display: flex;
		flex-direction: column;
		gap: 0.08rem;
		padding: 0.75rem 0.9rem;
		border-right: 1px solid var(--line);
	}
	.glance > div:last-child {
		border-right: 0;
	}
	.glance-label {
		font-family: var(--font-mono);
		font-size: 0.700rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.glance strong {
		font-family: var(--font-display);
		font-size: 1.600rem;
		font-weight: 550;
		line-height: 1.1;
	}
	.glance strong.capital {
		font-size: 1.150rem;
	}
	.glance em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.700rem;
		color: var(--text-4);
	}
	.rank {
		font-family: var(--font-mono);
		font-size: 0.700rem;
		color: var(--accent-0);
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1.55fr) minmax(18.5rem, 0.85fr);
		gap: 2.4rem;
		padding-top: 1.5rem;
	}
	.block {
		margin-bottom: 2.2rem;
		scroll-margin-top: calc(var(--header-h) + 1rem);
	}
	.block-head {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding-bottom: 0.45rem;
		margin-bottom: 0.7rem;
		border-bottom: 1px solid var(--line-strong);
	}
	.index {
		font-family: var(--font-mono);
		font-size: 0.715rem;
		color: var(--accent-1);
	}
	.block-head h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.450rem;
		font-weight: 600;
	}
	.map-link {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.650rem;
		letter-spacing: 0.04em;
		color: var(--text-3);
		text-decoration: none;
	}
	.map-link:hover {
		color: var(--accent-0);
	}
	.stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0 1.6rem;
	}
	.facts {
		columns: 1;
	}
	.facts :global(.stat) {
		break-inside: avoid;
	}
	.disputed-source {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		margin-top: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.700rem;
		color: var(--text-4);
		text-decoration: none;
	}
	.disputed-source:hover {
		color: var(--text-2);
	}
	.source {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.8rem;
		margin-top: 0.6rem;
		padding-top: 0.4rem;
		border-top: 1px solid var(--line);
		font-family: var(--font-mono);
		font-size: 0.700rem;
		color: var(--text-4);
	}
	.source a {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		color: var(--text-3);
		text-decoration: none;
		white-space: nowrap;
	}
	.timeline {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.timeline li {
		display: grid;
		grid-template-columns: 3.6rem 1fr;
		gap: 0.8rem;
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--line);
	}
	.timeline li:last-child {
		border-bottom: 0;
	}
	.year {
		font-family: var(--font-mono);
		font-size: 0.936rem;
		color: var(--accent-0);
	}
	.timeline strong {
		display: block;
		font-size: 0.988rem;
		font-weight: 600;
	}
	.timeline p {
		margin: 0.18rem 0 0;
		font-size: 0.832rem;
		line-height: 1.5;
		color: var(--text-3);
	}
	.side-block {
		margin-bottom: 1.8rem;
	}
	.org-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	.org {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.55rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
	}
	.org.historical {
		border-style: dashed;
	}
	.org-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.4rem;
	}
	.org-head span {
		font-family: var(--font-mono);
		font-size: 0.780rem;
		color: var(--accent-0);
	}
	.org-head em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.700rem;
		color: var(--text-4);
	}
	.org p {
		margin: 0;
		font-size: 0.858rem;
	}
	.org small {
		font-size: 0.728rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	.org a {
		margin-top: 0.2rem;
		font-family: var(--font-mono);
		font-size: 0.700rem;
		color: var(--text-4);
		text-decoration: none;
	}
	.snippets {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}
	.snippets article {
		padding: 0.7rem;
		border: 1px solid color-mix(in oklab, var(--water-0) 32%, transparent);
		background: color-mix(in oklab, var(--water-0) 6%, transparent);
	}
	.snippets h3 {
		margin: 0.28rem 0 0.3rem;
		font-family: var(--font-display);
		font-size: 1.196rem;
		font-weight: 600;
	}
	.snippets p {
		margin: 0 0 0.35rem;
		font-size: 0.806rem;
		line-height: 1.55;
		color: var(--text-2);
	}
	.snippets a {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.650rem;
		color: var(--water-1);
		text-decoration: none;
	}
	.neighbors {
		display: flex;
		flex-wrap: wrap;
		gap: 0.28rem;
		margin-top: 0.5rem;
	}
	.neighbors a {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-2);
		padding: 0.22rem 0.42rem 0.22rem 0.32rem;
		font-size: 0.754rem;
		text-decoration: none;
	}
	.neighbors a:hover {
		border-color: var(--line-strong);
		color: var(--text-1);
	}
	.mini {
		width: 0.85rem;
		height: 0.6rem;
		background-size: cover;
	}
	.select-label select {
		width: 100%;
		border: 1px solid var(--line-strong);
		background: var(--surface-1);
		color: var(--text-1);
		font-size: 0.910rem;
		padding: 0.38rem 0.45rem;
	}
	.compare {
		margin-top: 0.6rem;
	}
	.compare-head {
		display: flex;
		justify-content: space-between;
		font-family: var(--font-mono);
		font-size: 0.650rem;
		color: var(--text-4);
		padding-bottom: 0.3rem;
		border-bottom: 1px solid var(--line);
	}
	.compare-row {
		padding: 0.4rem 0;
		border-bottom: 1px solid var(--line);
	}
	.compare-label {
		display: block;
		font-size: 0.728rem;
		color: var(--text-3);
		margin-bottom: 0.2rem;
	}
	.bars {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.bar-line {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		height: 5px;
	}
	.bar {
		height: 5px;
		display: block;
	}
	.bar.a {
		background: var(--accent-1);
	}
	.bar.b {
		background: var(--water-0);
	}
	.bar-line em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.700rem;
		color: var(--text-4);
	}
	.compare-values {
		display: flex;
		justify-content: space-between;
		font-family: var(--font-mono);
		font-size: 0.676rem;
		color: var(--text-2);
		margin-top: 0.18rem;
	}
	.method {
		margin: 0.45rem 0 0;
		font-size: 0.650rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	.metadata {
		margin: 0;
		display: flex;
		flex-direction: column;
	}
	.metadata div {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.32rem 0;
		border-bottom: 1px solid var(--line);
		font-size: 0.728rem;
	}
	.metadata dt {
		color: var(--text-4);
	}
	.metadata dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.650rem;
		color: var(--text-2);
		text-align: right;
	}
	.sources-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.55rem;
		font-size: 0.728rem;
		color: var(--text-3);
		text-decoration: none;
	}
	.page-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line-strong);
		font-family: var(--font-mono);
		font-size: 0.676rem;
		color: var(--text-4);
	}
	.page-footer a {
		color: var(--text-3);
		text-decoration: none;
	}
	.page-footer a:hover {
		color: var(--accent-0);
	}
	.empty {
		font-size: 0.858rem;
		color: var(--text-4);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.missing {
		padding-top: calc(var(--header-h) + 4rem);
		text-align: center;
	}
	@media (max-width: 1000px) {
		.layout {
			grid-template-columns: 1fr;
			gap: 1.4rem;
		}
		.side-col {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1.4rem;
			align-items: start;
		}
	}
	@media (max-width: 760px) {
		.hero {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		.hero-actions {
			justify-content: flex-start;
		}
		.glance {
			grid-template-columns: 1fr 1fr;
		}
		.glance > div:nth-child(2) {
			border-right: 0;
		}
		.glance > div:nth-child(-n + 2) {
			border-bottom: 1px solid var(--line);
		}
		.stats,
		.snippets,
		.org-grid,
		.side-col,
		.facts {
			grid-template-columns: 1fr;
			columns: 1;
		}
		.source {
			flex-direction: column;
			gap: 0.25rem;
		}
		.page-footer {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
