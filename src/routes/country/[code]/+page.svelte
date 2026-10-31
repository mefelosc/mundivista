<script lang="ts">
	import { onMount } from 'svelte';
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import LocatorMap from '#lib/components/cards/LocatorMap.svelte';
	import StatRow from '#lib/components/cards/StatRow.svelte';
	import {
		countries,
		getCountry,
		indicatorMeta,
		rankOf,
		retrievedAt,
		dependencyLabel,
		sovereignCountry,
		worldStats
	} from '#lib/data/countries';
	import { capitalInPortuguese } from '#lib/data/capitals-pt';
	import { getHistorical, historicalSource } from '#lib/data/historical';
	import { disputedInfo } from '#lib/data/disputed';
	import { organizationsForCountry } from '#lib/data/organizations';
	import { snippetsByCountry } from '#lib/data/snippets';
	import { silhouetteFor } from '#lib/data/silhouettes';
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
	const sovereign = $derived(country ? sovereignCountry(country) : null);
	const dependency = $derived(country ? dependencyLabel(country) : null);
	const silhouette = $derived(country ? silhouetteFor(country.code) : null);

	const glance = $derived.by(() => {
		if (!country) return [];
		const pop = country.indicators.population;
		const popRank = rankOf(country.code, 'population');
		const gdp = country.indicators.gdpPerCapita;
		const gdpRank = rankOf(country.code, 'gdpPerCapita');
		return [
			{
				key: 'population',
				label: 'População',
				value: pop ? formatCompact(pop.v) : '—',
				year: pop?.y ?? null,
				meta: popRank ? `${popRank.rank}º de ${popRank.total}` : 'habitantes'
			},
			{
				key: 'gdp',
				label: 'PIB per capita',
				value: gdp ? formatIndicatorValue('gdpPerCapita', gdp) : '—',
				year: gdp?.y ?? null,
				meta: gdpRank ? `${gdpRank.rank}º de ${gdpRank.total}` : 'US$ correntes'
			},
			{
				key: 'area',
				label: 'Área',
				value: country.areaKm2 ? formatArea(country.areaKm2) : '—',
				year: null,
				meta: 'superfície terrestre'
			},
			{
				key: 'capital',
				label: 'Capital',
				value: capital ?? '—',
				year: null,
				meta: country.unMember ? 'Estado-membro da ONU' : 'Estatuto não membro'
			}
		];
	});

	let compareCode = $state<string | null>(null);
	let copied = $state(false);
	let activeSection = $state('ficha');

	onMount(() => {
		const ids = ['ficha', 'demography', 'economy', 'environment', 'geopolitics', 'history', 'organizations', 'snippets'];
		let frame = 0;

		const update = () => {
			frame = 0;
			const anchor = window.innerHeight * 0.34;
			let current = ids[0];
			let best = Number.POSITIVE_INFINITY;
			for (const id of ids) {
				const element = document.getElementById(id);
				if (!element) continue;
				const top = element.getBoundingClientRect().top;
				if (top <= anchor && anchor - top < best) {
					best = anchor - top;
					current = id;
				}
			}
			activeSection = current;
		};

		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};

		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		return () => {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});

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

	function deltaFor(key: IndicatorKey): 'points' | 'percent' {
		const unit = indicatorMeta[key]?.unit ?? '';
		return unit.includes('%') || unit.includes('escore') || unit.includes('índice')
			? 'points'
			: 'percent';
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
			{#if silhouette}
				<svg class="hero-silhouette" viewBox="0 0 100 100" aria-hidden="true">
					<path d={silhouette} />
				</svg>
			{/if}
			<div class="title-block">
				<div class="flag-row">
					{#if country.iso2}<span class={`fi fi-${country.iso2} hero-flag`}></span>{/if}
					<span class="eyebrow">Dossiê · {country.code}</span>
					{#if dependency ?? country.type}<span class="type">{dependency ?? country.type}</span>{/if}
				</div>
				<h1>{country.name}</h1>
				{#if country.official && country.official !== country.name}
					<p class="official">{country.official}</p>
				{/if}
				<p class="lede">
					{country.continent ?? 'Sem classificação continental'}{country.subregion && country.subregion !== country.continent ? ` · ${country.subregion}` : ''}.
					{country.areaKm2 ? `Área de ${formatArea(country.areaKm2)}.` : ''}
					{#if country.landlocked === true}País sem litoral.{:else if country.landlocked === false}Com saída para o mar.{/if}
				</p>
				<div class="hero-actions">
					<a class="btn btn-accent" href={`/explore?country=${country.code}`}>
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
			</div>

			<aside class="hero-map" aria-label="Localização no mapa">
				<div class="hero-map-head">
					<span class="eyebrow">No mapa</span>
					<span class="coords">{country.latlng ? `${Math.abs(country.latlng[0]).toFixed(1)}°${country.latlng[0] >= 0 ? 'N' : 'S'} · ${Math.abs(country.latlng[1]).toFixed(1)}°${country.latlng[1] >= 0 ? 'L' : 'O'}` : '—'}</span>
				</div>
				<LocatorMap {country} {neighbors} />
				<div class="hero-neighbors">
					{#each neighbors as neighbor (neighbor.code)}
						<a href={`/country/${neighbor.code}`}>
							{#if neighbor.iso2}<span class={`fi fi-${neighbor.iso2} mini`}></span>{/if}
							{neighbor.name}
						</a>
					{:else}
						<p class="empty">Sem fronteiras terrestres.</p>
					{/each}
				</div>
			</aside>
		</header>

		<section class="glance" aria-label="Resumo">
			{#each glance as item (item.key)}
				<div class:capital={item.key === 'capital'}>
					<span class="glance-label">{item.label}</span>
					<strong>{item.value}</strong>
					<span class="glance-meta">
						{#if item.meta}{item.meta}{/if}
						{#if item.year}{#if item.meta} · {/if}{item.year}{/if}
					</span>
				</div>
			{/each}
		</section>

		<nav class="section-nav" aria-label="Seções do dossiê">
			<a href="#ficha" class:active={activeSection === 'ficha'}>Ficha</a>
			<a href="#demography" class:active={activeSection === 'demography'}>Demografia</a>
			<a href="#economy" class:active={activeSection === 'economy'}>Economia</a>
			<a href="#environment" class:active={activeSection === 'environment'}>Meio físico</a>
			<a href="#geopolitics" class:active={activeSection === 'geopolitics'}>Geopolítica</a>
			<a href="#history" class:active={activeSection === 'history'}>História</a>
			{#if currentOrgs.length || historicalOrgs.length}<a href="#organizations" class:active={activeSection === 'organizations'}>Organizações</a>{/if}
			{#if snippets.length}<a href="#snippets" class:active={activeSection === 'snippets'}>Leituras</a>{/if}
		</nav>

		<div class="layout">
			<article class="main-col">
				<section class="block" id="ficha">
					<header class="block-head">
						<span class="index">01</span>
						<h2>Ficha técnica</h2>
					</header>
					<div class="facts-grid">
						<StatRow label="Continente" value={country.continent ?? 'Não disponível'} />
						<StatRow label="Sub-região" value={country.subregion ?? 'Não disponível'} />
						<StatRow label="Moeda" value={country.currency.length ? country.currency.map((c) => `${c.code} · ${c.symbol}`).join(', ') : 'Não disponível'} />
						<StatRow label="Idiomas" value={country.languages.length ? country.languages.join(', ') : 'Não disponível'} />
						<StatRow label="Membro da ONU" value={country.unMember === null ? 'Não disponível' : country.unMember ? 'Sim' : 'Não'} />
						{#if sovereign}
							<StatRow label="Soberania" value={sovereign.name} note={dependency ?? undefined} />
						{/if}
						<StatRow label="Sem litoral" value={country.landlocked === null ? 'Não disponível' : country.landlocked ? 'Sim' : 'Não'} />
						{#if disputed}
							<StatRow label="Estatuto" value={disputed.label} note={disputed.note} />
						{:else if country.type}
							<StatRow label="Estatuto no Natural Earth" value={country.type} />
						{/if}
					</div>
					{#if sovereign}
						<a class="sovereign-link" href={`/country/${sovereign.code}`}>
							Dossiê de {sovereign.name} <Icon name="arrowRight" size={11} />
						</a>
					{/if}
					{#if disputed}
						<a class="disputed-source" href={disputed.source.url} target="_blank" rel="noopener noreferrer">
							Fonte do estatuto: {disputed.source.name} <Icon name="external" size={10} />
						</a>
					{/if}
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
						<div class="metrics-grid">
							{#each group.rows as row (row.key)}
								<StatRow
									variant="metric"
									label={row.label}
									value={row.value}
									year={row.year}
									percentile={row.percentile}
									comparison={row.comparison}
									series={row.series}
									format={(v) => fmt(row.key, v)}
									delta={deltaFor(row.key)}
								/>
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
		max-width: 84rem;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}
	.crumbs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
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
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 24rem;
		align-items: stretch;
		gap: 1.6rem;
		padding: 1.4rem 0 1.5rem;
		border-bottom: 1px solid var(--line-strong);
		overflow: hidden;
	}
	.hero-silhouette {
		position: absolute;
		right: 25rem;
		top: -8%;
		width: 28rem;
		height: 116%;
		fill: color-mix(in oklab, var(--accent-1) 12%, transparent);
		pointer-events: none;
		opacity: 0.7;
	}
	.title-block {
		position: relative;
		z-index: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	.hero-map {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		padding: 0.7rem;
		border: 1px solid var(--line);
		border-radius: 0.25rem;
		background: var(--surface-1);
		box-shadow: 0 18px 44px -36px rgb(0 0 0 / 0.55);
	}
	.hero-map-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.1rem 0.1rem 0.5rem;
		border-bottom: 1px solid var(--line);
	}
	.hero-map-head .eyebrow {
		font-size: 0.72rem;
	}
	.coords {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.03em;
		color: var(--text-4);
		white-space: nowrap;
	}
	.hero-map :global(.locator) {
		border: 0;
		background: transparent;
		margin-top: 0.45rem;
	}
	.hero-map :global(figcaption) {
		display: none;
	}
	.hero-map :global(.locator .frame) {
		border: 1px solid var(--line);
	}
	.flag-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.55rem;
	}
	.hero-flag {
		width: 3.1rem;
		height: 2.05rem;
		border: 1px solid var(--line-strong);
		background-size: cover;
	}
	.type {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
		border: 1px solid var(--line);
		padding: 0.12rem 0.34rem;
	}
	.hero h1 {
		margin: 0.5rem 0 0.15rem;
		font-family: var(--font-display);
		font-size: clamp(2.8rem, 6vw, 5rem);
		font-weight: 600;
		line-height: 0.96;
		letter-spacing: -0.035em;
	}
	.official {
		margin: 0.2rem 0 0;
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.12rem;
		color: var(--text-3);
	}
	.lede {
		max-width: 42rem;
		margin: 0.7rem 0 0;
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--text-3);
	}
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 1rem;
	}
	.hero-actions :global(.btn) {
		justify-content: center;
	}
	.glance {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.glance > div {
		display: flex;
		flex-direction: column;
		gap: 0.12rem;
		min-width: 0;
		padding: 0.8rem 0.9rem;
		background: var(--surface-1);
		border: 1px solid var(--line);
		border-radius: 0.2rem;
	}
	.glance-label {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.glance strong {
		margin-top: 0.12rem;
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 600;
		line-height: 1.05;
		color: var(--text-1);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.glance .capital strong {
		font-size: 1.3rem;
	}
	.glance-meta {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
	}
	.section-nav {
		position: sticky;
		top: var(--header-h);
		z-index: 20;
		display: flex;
		gap: 0.1rem;
		margin: 0.9rem 0 1.4rem;
		padding: 0.2rem 0;
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		background: var(--surface-0);
		overflow-x: auto;
		scrollbar-width: none;
	}
	.section-nav::-webkit-scrollbar {
		display: none;
	}
	.section-nav a {
		flex-shrink: 0;
		padding: 0.55rem 0.68rem;
		border-bottom: 2px solid transparent;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.04em;
		color: var(--text-2);
		text-decoration: none;
		white-space: nowrap;
	}
	.section-nav a:hover {
		color: var(--text-1);
		border-bottom-color: color-mix(in oklab, var(--accent-1) 45%, transparent);
	}
	.section-nav a.active {
		color: var(--text-1);
		border-bottom-color: var(--accent-1);
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 21rem;
		align-items: start;
		gap: 2rem;
	}
	.main-col {
		min-width: 0;
	}
	.block {
		margin-bottom: 1rem;
		padding: 1.2rem 1.35rem 1.3rem;
		background: var(--surface-2);
		border: 1px solid var(--line);
		border-radius: 0.25rem;
		scroll-margin-top: calc(var(--header-h) + 3.6rem);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		animation: dossier-in 0.5s var(--ease-out-soft) both;
	}
	.block:hover {
		border-color: var(--line-strong);
		box-shadow: 0 16px 34px -32px rgb(0 0 0 / 0.45);
	}
	@keyframes dossier-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.block-head {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding-bottom: 0.6rem;
		margin-bottom: 0.9rem;
		border-bottom: 1px solid var(--line);
	}
	.index {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--accent-1);
	}
	.block-head h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.015em;
	}
	.map-link {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.03em;
		color: var(--text-3);
		text-decoration: none;
	}
	.map-link:hover {
		color: var(--accent-0);
	}
	.facts-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem 1.2rem;
	}
	.metrics-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.55rem;
	}
	.sovereign-link {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		margin-top: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.66rem;
		color: var(--accent-0);
		text-decoration: none;
	}
	.sovereign-link:hover {
		text-decoration: underline;
	}
	.disputed-source {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		margin-top: 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.66rem;
		color: var(--text-4);
		text-decoration: none;
	}
	.disputed-source:hover {
		color: var(--text-2);
	}
	.source {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.4rem 0.8rem;
		margin-top: 0.8rem;
		padding-top: 0.55rem;
		border-top: 1px solid var(--line);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		line-height: 1.4;
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
		grid-template-columns: 3.8rem 1fr;
		gap: 0.9rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--line);
	}
	.timeline li:last-child {
		border-bottom: 0;
	}
	.year {
		font-family: var(--font-mono);
		font-size: 0.74rem;
		color: var(--accent-0);
	}
	.timeline strong {
		display: block;
		font-size: 0.82rem;
		font-weight: 600;
	}
	.timeline p {
		margin: 0.18rem 0 0;
		font-size: 0.72rem;
		line-height: 1.5;
		color: var(--text-3);
	}
	.org-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 0.5rem;
	}
	.org {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.65rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 0.15rem;
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
		font-size: 0.7rem;
		color: var(--accent-0);
	}
	.org-head em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
	}
	.org p {
		margin: 0;
		font-size: 0.72rem;
		line-height: 1.35;
	}
	.org small {
		font-size: 0.7rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	.org a {
		margin-top: 0.15rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
		text-decoration: none;
	}
	.snippets {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 0.6rem;
	}
	.snippets article {
		padding: 0.85rem 0.9rem;
		border: 1px solid color-mix(in oklab, var(--clay) 34%, transparent);
		border-radius: 0.15rem;
		background: color-mix(in oklab, var(--clay) 6%, transparent);
	}
	.snippets h3 {
		margin: 0.3rem 0 0.35rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
	}
	.snippets p {
		margin: 0 0 0.4rem;
		font-size: 0.76rem;
		line-height: 1.55;
		color: var(--text-2);
	}
	.snippets a {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.66rem;
		color: var(--accent-0);
		text-decoration: none;
	}
	.side-col {
		position: sticky;
		top: calc(var(--header-h) + 4rem);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-height: calc(100dvh - var(--header-h) - 5rem);
		overflow-y: auto;
		padding-right: 0.15rem;
		scrollbar-width: thin;
	}
	.side-block {
		padding: 0.9rem 0.95rem;
		background: var(--surface-2);
		border: 1px solid var(--line);
		border-radius: 0.25rem;
		scroll-margin-top: calc(var(--header-h) + 3.6rem);
	}
	.side-block .block-head {
		margin-bottom: 0.7rem;
		padding-bottom: 0.5rem;
	}
	.side-block .block-head h2 {
		font-size: 1.06rem;
	}
	.side-block :global(.locator) {
		border: 0;
		background: transparent;
	}
	.side-block :global(.locator figcaption) {
		padding: 0 0 0.4rem;
		border-bottom: 1px solid var(--line);
	}
	.side-block :global(.locator .frame) {
		border: 1px solid var(--line);
	}
	.hero-neighbors {
		display: flex;
		flex-wrap: wrap;
		gap: 0.28rem;
		margin-top: 0.55rem;
	}
	.hero-neighbors a {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-2);
		padding: 0.26rem 0.46rem 0.26rem 0.36rem;
		font-size: 0.72rem;
		text-decoration: none;
	}
	.hero-neighbors a:hover {
		border-color: var(--line-strong);
		color: var(--text-1);
		transform: translateY(-1px);
	}
	.mini {
		width: 1.1rem;
		height: 0.75rem;
		background-size: cover;
	}
	.select-label select {
		width: 100%;
		height: 2.2rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.15rem;
		background: var(--surface-1);
		color: var(--text-1);
		font-size: 0.8rem;
		padding: 0 0.5rem;
	}
	.compare {
		margin-top: 0.7rem;
	}
	.compare-head {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding-bottom: 0.35rem;
		border-bottom: 1px solid var(--line);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
	}
	.compare-row {
		padding: 0.48rem 0;
		border-bottom: 1px solid var(--line);
	}
	.compare-row:last-child {
		border-bottom: 0;
	}
	.compare-label {
		display: block;
		margin-bottom: 0.24rem;
		font-size: 0.7rem;
		color: var(--text-3);
	}
	.bars {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.bar-line {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		height: 6px;
	}
	.bar {
		height: 6px;
		display: block;
		transform-origin: left;
		animation: bar-grow 0.8s var(--ease-out-soft) both;
	}
	@keyframes bar-grow {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}
	.bar.a {
		background: var(--accent-1);
	}
	.bar.b {
		background: var(--clay);
	}
	.bar-line em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
	}
	.compare-values {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.2rem;
		font-family: var(--font-mono);
		font-size: 0.66rem;
		color: var(--text-2);
	}
	.method {
		margin: 0.5rem 0 0;
		font-size: 0.66rem;
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
		padding: 0.34rem 0;
		border-bottom: 1px solid var(--line);
		font-size: 0.7rem;
	}
	.metadata div:last-child {
		border-bottom: 0;
	}
	.metadata dt {
		color: var(--text-4);
	}
	.metadata dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-2);
		text-align: right;
	}
	.sources-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.6rem;
		font-size: 0.7rem;
		color: var(--text-3);
		text-decoration: none;
	}
	.page-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line-strong);
		font-family: var(--font-mono);
		font-size: 0.66rem;
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
		margin: 0;
		font-size: 0.76rem;
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
	@media (max-width: 1100px) {
		.hero {
			grid-template-columns: minmax(0, 1fr) 21rem;
		}
		.hero-silhouette {
			right: 22rem;
		}
		.layout {
			grid-template-columns: minmax(0, 1fr);
			gap: 1.2rem;
		}
		.side-col {
			position: static;
			display: grid;
			grid-template-columns: 1fr 1fr;
			align-items: start;
			max-height: none;
			overflow: visible;
			padding-right: 0;
		}
	}
	@media (max-width: 820px) {
		.hero {
			grid-template-columns: 1fr;
		}
		.hero-map {
			order: 2;
		}
		.hero-silhouette {
			right: -6rem;
			top: -4%;
			width: 22rem;
		}
		.hero-actions {
			width: 100%;
		}
		.hero {
			grid-template-columns: 1fr;
			align-items: start;
			gap: 1rem;
		}
		.hero-actions {
			width: 100%;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.glance {
			grid-template-columns: 1fr 1fr;
		}
		.facts-grid,
		.metrics-grid,
		.snippets,
		.org-grid,
		.side-col {
			grid-template-columns: 1fr;
		}
		.block {
			padding: 0.9rem 0.95rem 1rem;
		}
		.section-nav {
			margin-bottom: 1rem;
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
	@media (max-width: 480px) {
		.glance strong {
			font-size: 1.28rem;
		}
		.glance .capital strong {
			font-size: 1rem;
		}
	}
</style>
