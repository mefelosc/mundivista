<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import StatRow from './StatRow.svelte';
	import IndicatorGroup from './IndicatorGroup.svelte';
	import MetricChart from './MetricChart.svelte';
	import { indicatorIcon } from '#lib/data/indicator-icons';
	import { deltaModeFor } from '#lib/data/indicator-icons';
	import { locale } from '#lib/locale.svelte';
	import {
		indicatorName,
		indicatorUnit,
		localizeContinent,
		localizeDependency,
		localizeLanguage,
		localizeSubregion,
		localizeType
	} from '#lib/i18n-data';
	import {
		localizedDisputed,
		localizedHistorical,
		localizedOrganization,
		localizedSnippet
	} from '#lib/i18n-data-en';
	import { capitalInPortuguese } from '#lib/data/capitals-pt';
	import {
		indicatorMeta,
		rankOf,
		retrievedAt,
		getCountry,
		dependencyLabel,
		sovereignCountry,
		worldStats
	} from '#lib/data/countries';
	import { getHistorical } from '#lib/data/historical';
	import { disputedInfo } from '#lib/data/disputed';
	import { organizationsForCountry } from '#lib/data/organizations';
	import { snippetsByCountry } from '#lib/data/snippets';
	import { formatArea, formatCompact, formatIndicatorValue, formatRank } from '#lib/format';
	import type { SubdivisionCollection, SubdivisionProperties } from '#lib/data/subdivisions';
	import type { Country, IndicatorKey } from '#lib/types';
	import type { ResolvedLayer } from '#lib/configurations/map-layers';

	interface Props {
		country: Country;
		layer: ResolvedLayer;
		onclose: () => void;
		onnavigate: (code: string) => void;
		neighborsHighlighted?: boolean;
		ontoggleneighbors?: () => void;
		subdivisions?: SubdivisionCollection | null;
		subdivisionsLoading?: boolean;
		activeSubdivision?: string | null;
		onunit?: (id: string | null) => void;
		onfly?: (center: [number, number], zoom?: number) => void;
	}

	let {
		country,
		layer,
		onclose,
		onnavigate,
		neighborsHighlighted = false,
		ontoggleneighbors,
		subdivisions = null,
		subdivisionsLoading = false,
		activeSubdivision = null,
		onunit,
		onfly
	}: Props = $props();

	const isEn = $derived(locale.value === 'en');
	const tr = (pt: string, en: string) => (isEn ? en : pt);
	const displayName = $derived(isEn ? country.nameEn : country.name);
	const LAYER_EN: Record<string, string> = {
		standard: 'Standard',
		political: 'Political',
		physical: 'Physical',
		population: 'Population',
		economy: 'Economy',
		geopolitics: 'Geopolitics',
		history: 'History'
	};
	const layerName = $derived(isEn ? (LAYER_EN[layer.id] ?? layer.label) : layer.label);

	type SectionId =
		| 'visao'
		| 'ficha'
		| 'vizinhos'
		| 'demografia'
		| 'economia'
		| 'fisico'
		| 'geopolitica'
		| 'historia';

	const SECTION_COPY = {
		pt: [
			{ id: 'visao', label: 'Visão', title: 'Visão geral', index: '01', icon: 'globe' },
			{ id: 'ficha', label: 'Ficha', title: 'Ficha técnica', index: '02', icon: 'dossier' },
			{ id: 'vizinhos', label: 'Vizinhos', title: 'Países vizinhos', index: '03', icon: 'alliance' },
			{ id: 'demografia', label: 'Demografia', title: 'Demografia', index: '04', icon: 'users' },
			{ id: 'economia', label: 'Economia', title: 'Economia', index: '05', icon: 'coins' },
			{ id: 'fisico', label: 'Físico', title: 'Meio físico', index: '06', icon: 'peak' },
			{ id: 'geopolitica', label: 'Geopolítica', title: 'Geopolítica', index: '07', icon: 'shield' },
			{ id: 'historia', label: 'História', title: 'História', index: '08', icon: 'timeline' }
		],
		en: [
			{ id: 'visao', label: 'Overview', title: 'Overview', index: '01', icon: 'globe' },
			{ id: 'ficha', label: 'Fact sheet', title: 'Fact sheet', index: '02', icon: 'dossier' },
			{ id: 'vizinhos', label: 'Neighbours', title: 'Neighbouring countries', index: '03', icon: 'alliance' },
			{ id: 'demografia', label: 'Demography', title: 'Demography', index: '04', icon: 'users' },
			{ id: 'economia', label: 'Economy', title: 'Economy', index: '05', icon: 'coins' },
			{ id: 'fisico', label: 'Environment', title: 'Physical environment', index: '06', icon: 'peak' },
			{ id: 'geopolitica', label: 'Geopolitics', title: 'Geopolitics', index: '07', icon: 'shield' },
			{ id: 'historia', label: 'History', title: 'History', index: '08', icon: 'timeline' }
		]
	} as const;
	const SECTIONS = $derived(SECTION_COPY[locale.value]);

	const INDICATOR_GROUPS: Record<'demografia' | 'economia' | 'fisico', IndicatorKey[]> = {
		demografia: [
			'population',
			'popDensity',
			'popGrowth',
			'lifeExpectancy',
			'urbanShare',
			'fertility',
			'schoolEnrollment'
		],
		economia: [
			'gdp',
			'gdpPerCapita',
			'gdpGrowth',
			'unemployment',
			'inflation',
			'debtShare',
			'exportsShare',
			'importsShare',
			'industryShare',
			'agriShare',
			'researchShare',
			'tourism',
			'gini'
		],
		fisico: [
			'forestShare',
			'renewableShare',
			'electricityAccess',
			'co2PerCapita',
			'co2Total',
			'energyUse',
			'healthShare',
			'internetShare'
		]
	};

	let copied = $state(false);
	let snap = $state<'peek' | 'half' | 'full'>('half');
	let dragOffset = $state(0);
	let dragging = $state(false);
	let dragStart = 0;
	let sheetEl: HTMLElement | null = null;
	let scrollEl: HTMLElement | null = null;
	let activeSection = $state<SectionId>('visao');
	const UNIT_LIMIT = 18;
	let unitLimit = $state(UNIT_LIMIT);
	let scrollFrame = 0;

	const capital = $derived(
		isEn ? country.capital : capitalInPortuguese(country.code, country.capital)
	);
	const historical = $derived(localizedHistorical(getHistorical(country.code), locale.value));
	const orgs = $derived(
		organizationsForCountry(country.code).map((org) => localizedOrganization(org, locale.value))
	);
	const currentOrgs = $derived(orgs.filter((o) => o.era === 'current'));
	const historicalOrgs = $derived(orgs.filter((o) => o.era === 'historical'));
	const neighbors = $derived(
		country.borders.map((b) => getCountry(b)).filter(Boolean) as Country[]
	);
	const snippet = $derived(
		localizedSnippet(snippetsByCountry.get(country.code)?.[0] ?? null, locale.value)
	);
	const disputed = $derived(localizedDisputed(disputedInfo(country.code), locale.value));
	const sovereign = $derived(sovereignCountry(country));
	const dependency = $derived(localizeDependency(country, locale.value));
	const accent = $derived('var(--accent-1)');

	const units = $derived(subdivisions?.features.map((feature) => feature.properties) ?? []);
	const shownUnits = $derived(units.slice(0, unitLimit));

	const currency = $derived(
		country.currency.length
			? country.currency.map((c) => `${c.code}${c.symbol ? ` · ${c.symbol}` : ''}`).join(', ')
			: 'Não disponível'
	);

	const formerNames = $derived(
		historical?.formerNames?.map((n) => `${n.name}${n.to ? ` (até ${n.to})` : ''}`).join(' → ')
	);

	const wikipediaUrl = $derived(
		`https://pt.wikipedia.org/wiki/${encodeURIComponent(country.name.replaceAll(' ', '_'))}`
	);
	const britannicaUrl = $derived(
		`https://www.britannica.com/search?query=${encodeURIComponent(country.nameEn)}`
	);
	const dossierUrl = $derived(`/country/${country.code}`);
	const shareUrl = $derived(
		typeof location !== 'undefined' ? `${location.origin}${dossierUrl}` : dossierUrl
	);

	const glance = $derived.by(() => {
		const items: {
			key: IndicatorKey | 'area' | 'capital';
			label: string;
			value: string;
			year?: number | null;
			meta?: string | null;
		}[] = [];
		const pop = country.indicators.population;
		const popRank = rankOf(country.code, 'population');
		items.push({
			key: 'population',
			label: isEn ? 'Population' : 'População',
			value: pop ? formatIndicatorValue('population', pop) : '—',
			year: pop?.y,
			meta: popRank ? formatRank(popRank) : null
		});
		const gdp = country.indicators.gdpPerCapita;
		const gdpRank = rankOf(country.code, 'gdpPerCapita');
		items.push({
			key: 'gdpPerCapita',
			label: isEn ? 'GDP per capita' : 'PIB per capita',
			value: gdp ? formatIndicatorValue('gdpPerCapita', gdp) : '—',
			year: gdp?.y,
			meta: gdpRank ? formatRank(gdpRank) : null
		});
		items.push({
			key: 'area',
			label: isEn ? 'Area' : 'Área',
			value: country.areaKm2 ? formatArea(country.areaKm2) : '—',
			meta: isEn ? 'land surface' : 'superfície terrestre'
		});
		items.push({
			key: 'capital',
			label: isEn ? 'Capital' : 'Capital',
			value: capital ?? '—',
			meta: country.unMember
				? isEn
					? 'UN member state'
					: 'Estado-membro da ONU'
				: isEn
					? 'Non-member status'
					: 'Estatuto não membro'
		});
		return items;
	});

	function buildRows(keys: IndicatorKey[]) {
		return keys.map((key) => {
			const value = country.indicators[key];
			const rank = rankOf(country.code, key);
			const stats = worldStats(key);
			const meta = indicatorMeta[key];
			let comparison: string | null = null;
			if (value && stats) {
				const above = value.v >= stats.median;
				const better = meta?.dir === 'lower' ? !above : above;
				const medianText = formatIndicatorValue(key, { v: stats.median, y: value.y });
				comparison = isEn
					? `${better ? 'Better' : 'Worse'} than the median (${medianText})`
					: `${better ? 'Melhor que' : 'Pior que'} a mediana (${medianText})`;
			}
			const unit = indicatorUnit(key, locale.value);
			return {
				key,
				label: indicatorName(key, locale.value),
				value: value ? formatIndicatorValue(key, value) : tr('Não disponível', 'Not available'),
				year: value?.y ?? null,
				unit,
				percentile: rank?.percentile ?? null,
				median: stats?.median ?? null,
				comparison,
				series: value?.s ?? null,
				format: (next: number) => formatIndicatorValue(key, { v: next, y: value?.y ?? 0 }),
				axisFormat: (next: number) => formatCompact(next),
				deltaMode: deltaModeFor(key, unit)
			};
		});
	}

	const SECTION_ICONS: Record<string, string> = {
		visao: 'globe',
		ficha: 'dossier',
		vizinhos: 'alliance',
		demografia: 'users',
		economia: 'coins',
		fisico: 'peak',
		geopolitica: 'shield',
		historia: 'timeline'
	};
	function sectionIcon(id: string): string {
		return SECTION_ICONS[id] ?? 'globe';
	}

	const groupLayer: Record<'demografia' | 'economia' | 'fisico', string> = {
		demografia: 'population',
		economia: 'economy',
		fisico: 'physical'
	};

	const groups = $derived([
		{
			id: 'demografia' as const,
			index: '04',
			title: tr('Demografia', 'Demography'),
			desc: tr('População, saúde, educação e urbanização.', 'Population, health, education and urbanisation.'),
			rows: buildRows(INDICATOR_GROUPS.demografia)
		},
		{
			id: 'economia' as const,
			index: '05',
			title: tr('Economia', 'Economy'),
			desc: tr('Renda, trabalho, comércio e estrutura produtiva.', 'Income, labour, trade and productive structure.'),
			rows: buildRows(INDICATOR_GROUPS.economia)
		},
		{
			id: 'fisico' as const,
			index: '06',
			title: tr('Meio físico', 'Environment'),
			desc: tr('Floresta, energia, emissões e acesso a serviços.', 'Forest, energy, emissions and access to services.'),
			rows: buildRows(INDICATOR_GROUPS.fisico)
		}
	]);

	const geopoliticsRows = $derived.by(() =>
		(['militaryShare', 'govEffectiveness', 'controlCorruption', 'ruleOfLaw'] as IndicatorKey[]).map(
			(key) => {
				const value = country.indicators[key];
				const rank = rankOf(country.code, key);
				return {
					key,
					label: indicatorName(key, locale.value),
					value: value ? formatIndicatorValue(key, value) : tr('Não disponível', 'Not available'),
					year: value?.y ?? null,
					percentile: rank?.percentile ?? null
				};
			}
		)
	);

	$effect(() => {
		const code = country.code;
		void code;
		activeSection = 'visao';
		copied = false;
		dragOffset = 0;
		snap = 'half';
		unitLimit = UNIT_LIMIT;
		requestAnimationFrame(() => scrollEl?.scrollTo({ top: 0 }));
	});

	function share() {
		try {
			if (navigator.share) {
				navigator.share({ title: `${country.name} — Mundivista`, url: shareUrl });
			} else {
				navigator.clipboard.writeText(shareUrl);
				copied = true;
				setTimeout(() => (copied = false), 1800);
			}
		} catch {
			/* usuário cancelou */
		}
	}

	function cycleSnap() {
		snap = snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'peek';
	}

	function onPointerDown(event: PointerEvent) {
		if (typeof window !== 'undefined' && window.innerWidth > 900) return;
		dragging = true;
		dragStart = event.clientY;
		sheetEl?.setPointerCapture(event.pointerId);
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;
		dragOffset = Math.max(-70, Math.min(70, event.clientY - dragStart));
	}

	function onPointerUp() {
		if (!dragging) return;
		dragging = false;
		const delta = dragOffset;
		dragOffset = 0;
		if (delta < -36) {
			snap = snap === 'peek' ? 'half' : 'full';
		} else if (delta > 36) {
			snap = snap === 'full' ? 'half' : 'peek';
		}
	}

	function toggleUnit(unit: SubdivisionProperties) {
		const next = activeSubdivision === unit.id ? null : unit.id;
		onunit?.(next);
		if (next && unit.label) onfly?.(unit.label, 5);
	}

	function jumpTo(id: SectionId) {
		const element = document.getElementById(`card-${id}`);
		if (!element || !scrollEl) return;
		scrollEl.scrollTo({ top: element.offsetTop - 6, behavior: 'smooth' });
		activeSection = id;
	}

	function onScroll() {
		if (scrollFrame) return;
		scrollFrame = requestAnimationFrame(() => {
			scrollFrame = 0;
			if (!scrollEl) return;
			const top = scrollEl.scrollTop + 56;
			let current: SectionId = SECTIONS[0].id;
			for (const section of SECTIONS) {
				const element = document.getElementById(`card-${section.id}`);
				if (element && element.offsetTop <= top) current = section.id;
			}
			activeSection = current;
		});
	}
</script>

<aside
	bind:this={sheetEl}
	class="card animate-sheet-in snap-{snap}"
	class:dragging
	style:--drag={`${dragOffset}px`}
	aria-label={isEn ? `Information about ${displayName}` : `Informações sobre ${displayName}`}
>
	<div
		class="handle"
		role="button"
		tabindex="0"
		aria-label={tr('Redimensionar painel', 'Resize panel')}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onclick={cycleSnap}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && cycleSnap()}
	>
		<span></span><span></span><span></span>
	</div>

	<header class="identity">
		{#if country.iso2}
			<span class="flag-glow fi fi-{country.iso2}" aria-hidden="true"></span>
		{/if}
		<div class="flag-wrap">
			{#if country.iso2}
				<span class={`flag fi fi-${country.iso2}`}></span>
			{:else}
				<span class="flag-fallback">{country.code}</span>
			{/if}
		</div>
		<div class="titles">
			<span class="eyebrow">{layerName}{country.continent ? ` · ${localizeContinent(country.continent, locale.value)}` : ''}</span>
			<h2>{displayName}</h2>
			<p class="official">
				{country.nameEn}{country.code ? ` · ${country.code}` : ''}{dependency ? ` · ${dependency}` : ''}
			</p>
			<div class="chips">
				{#if dependency}<span class="chip">{dependency}</span>{/if}
				{#if disputed}<span class="chip accent">{disputed.label}</span>{/if}
				{#if country.type}<span class="chip">{localizeType(country.type, locale.value)}</span>{/if}
			</div>
		</div>
		<div class="head-actions">
			<button
				type="button"
				class="icon-btn"
				onclick={share}
				aria-label={tr('Compartilhar país', 'Share country')}
				title={tr('Compartilhar', 'Share')}
			>
				<Icon name={copied ? 'check' : 'link'} size={15} />
			</button>
			<button class="icon-btn" type="button" onclick={onclose} aria-label={tr('Fechar card', 'Close card')}>
				<Icon name="close" size={16} />
			</button>
		</div>
	</header>

	<div class="key-metrics" aria-label={tr('Resumo', 'Summary')}>
		{#each glance as item (item.key)}
			<div class="key" class:small={item.key === 'capital'}>
				<span class="key-label">{item.label}</span>
				<strong>{item.value}</strong>
				<span class="key-meta">
					{#if item.meta}{item.meta}{/if}
					{#if item.year}{#if item.meta} · {/if}{item.year}{/if}
				</span>
			</div>
		{/each}
	</div>

	<nav class="jump" aria-label={tr('Ir para uma seção do card', 'Go to a card section')}>
		{#each SECTIONS as section (section.id)}
			<button
				type="button"
				class:active={activeSection === section.id}
				onclick={() => jumpTo(section.id)}
			>
				<Icon name={section.icon} size={14} />
				{section.label}
			</button>
		{/each}
	</nav>

	<div class="scroll" bind:this={scrollEl} onscroll={onScroll}>
		<section id="card-visao" class="section">
			<header class="section-head">
				<span class="section-icon"><Icon name="globe" size={16} /></span>
				<span class="index">01</span>
				<div>
					<h3>{tr('Visão geral', 'Overview')}</h3>
					<p>{localizeContinent(country.continent, locale.value) || tr('Território', 'Territory')}{country.subregion ? ` · ${localizeSubregion(country.subregion, locale.value)}` : ''}</p>
				</div>
			</header>
			<p class="card-lede">
				{localizeContinent(country.continent, locale.value) || tr('Território', 'Territory')}{country.subregion && country.subregion !== country.continent ? ` · ${localizeSubregion(country.subregion, locale.value)}` : ''}.
				{country.areaKm2 ? `${tr('Área de', 'Area of')} ${formatArea(country.areaKm2)}.` : ''}
				{#if country.landlocked === true}{tr('Sem litoral.', 'Landlocked.')}{:else if country.landlocked === false}{tr('Com saída para o mar.', 'With sea access.')}{/if}
			</p>
			{#if groups[0]?.rows[0]}
				{@const featured = groups[0].rows[0]}
				<div class="overview-chart">
					<div class="overview-head">
						<span class="overview-icon"><Icon name={indicatorIcon(featured.key)} size={18} /></span>
						<div>
							<span class="overview-label">{featured.label}</span>
							<strong>{featured.value}</strong>
						</div>
						<button type="button" onclick={() => jumpTo('demografia')}>
							{tr('Ver demografia', 'View demography')} <Icon name="arrowRight" size={12} />
						</button>
					</div>
					<MetricChart
						series={featured.series ?? []}
						format={featured.format}
						axisFormat={featured.axisFormat}
						{accent}
						variant="area"
						label={featured.label}
						compact
					/>
				</div>
			{/if}
			{#if snippet}
				<article class="snippet">
					<span class="eyebrow">{tr('Leitura rápida', 'Quick read')}</span>
					<h4>{snippet.title}</h4>
					<p>{snippet.body}</p>
					<a href={snippet.sourceUrl} target="_blank" rel="noopener noreferrer">
						{snippet.source} <Icon name="external" size={11} />
					</a>
				</article>
			{/if}
			{#if disputed}
				<p class="note">
					{disputed.label}. {disputed.note}
					<a href={disputed.source.url} target="_blank" rel="noopener noreferrer">
						{tr('Fonte', 'Source')} <Icon name="external" size={10} />
					</a>
				</p>
			{/if}
		</section>

		<section id="card-ficha" class="section">
			<header class="section-head">
				<span class="section-icon"><Icon name="dossier" size={16} /></span>
				<span class="index">02</span>
				<div>
					<h3>{tr('Ficha técnica', 'Fact sheet')}</h3>
					<p>{tr('Identidade, estatuto e vínculos.', 'Identity, status and ties.')}</p>
				</div>
			</header>
			<div class="facts-grid">
				<StatRow compact label={tr('Nome oficial', 'Official name')} value={country.official ?? country.nameEn} />
				<StatRow compact label={tr('Continente', 'Continent')} value={localizeContinent(country.continent, locale.value) || tr('Não disponível', 'Not available')} />
				<StatRow compact label={tr('Sub-região', 'Subregion')} value={localizeSubregion(country.subregion, locale.value) || tr('Não disponível', 'Not available')} />
				<StatRow compact label={tr('Moeda', 'Currency')} value={currency} />
				<StatRow
					compact
					label={tr('Idiomas', 'Languages')}
					value={country.languages.length ? country.languages.map((lang) => localizeLanguage(lang, locale.value)).join(', ') : tr('Não disponível', 'Not available')}
				/>
				<StatRow
					compact
					label={tr('Membro da ONU', 'UN member')}
					value={country.unMember === null ? tr('Não disponível', 'Not available') : country.unMember ? tr('Sim', 'Yes') : tr('Não', 'No')}
				/>
				<StatRow
					compact
					label={tr('Sem litoral', 'Landlocked')}
					value={country.landlocked === null ? tr('Não disponível', 'Not available') : country.landlocked ? tr('Sim', 'Yes') : tr('Não', 'No')}
				/>
				{#if sovereign}
					<StatRow compact label={tr('Soberania', 'Sovereignty')} value={isEn ? sovereign.nameEn : sovereign.name} note={dependency ?? undefined} />
				{:else}
					<StatRow
						compact
						label={tr('Estatuto', 'Status')}
						value={localizeType(country.type, locale.value) || disputed?.label || tr('Soberano', 'Sovereign')}
					/>
				{/if}
			</div>

			{#if layer.showSubdivisions}
				<div class="units-block">
					<div class="subhead">
						<h4>{tr('Unidades e estados', 'Units and states')}</h4>
						{#if units.length}<em>{units.length}</em>{/if}
					</div>
					{#if subdivisionsLoading}
						<p class="empty">{tr('Carregando unidades administrativas…', 'Loading administrative units…')}</p>
					{:else if units.length}
						<div class="units">
							{#each shownUnits as unit (unit.id)}
								<button
									type="button"
									class:active={activeSubdivision === unit.id}
									onclick={() => toggleUnit(unit)}
									title={`${unit.name} · ${unit.type}${unit.label ? ` · ${tr('centralizar no mapa', 'centre on the map')}` : ''}`}
								>
									<span>{unit.name}</span>
									<em>{unit.type}</em>
								</button>
							{/each}
						</div>
						{#if units.length > UNIT_LIMIT}
							<button
								type="button"
								class="more"
								onclick={() => (unitLimit = unitLimit >= units.length ? UNIT_LIMIT : units.length)}
							>
								{unitLimit >= units.length ? tr('Mostrar menos', 'Show less') : tr('Mostrar todas as', 'Show all') + ' ' + units.length}
							</button>
						{/if}
						<p class="source-note">
							{tr('Natural Earth 1:10m · primeiro nível administrativo. O nível varia por país.', 'Natural Earth 1:10m · first-level administrative units. The level varies by country.')}
						</p>
					{:else}
						<p class="empty">{tr('Sem unidades de primeiro nível na base para este território.', 'No first-level units in the dataset for this territory.')}</p>
					{/if}
				</div>
			{/if}
		</section>

		<section id="card-vizinhos" class="section">
			<header class="section-head">
				<span class="section-icon"><Icon name="alliance" size={16} /></span>
				<span class="index">03</span>
				<div>
					<h3>{tr('Países vizinhos', 'Neighbouring countries')}</h3>
					<p>{neighbors.length ? `${neighbors.length} ${tr('fronteiras terrestres', 'land borders')}` : tr('Sem fronteiras terrestres', 'No land borders')}</p>
				</div>
				{#if neighbors.length && ontoggleneighbors}
					<button
						type="button"
						class="block-action"
						class:active={neighborsHighlighted}
						onclick={ontoggleneighbors}
						aria-pressed={neighborsHighlighted}
					>
						<Icon name={neighborsHighlighted ? 'eyeOff' : 'eye'} size={13} />
						{neighborsHighlighted ? tr('Remover', 'Clear') : tr('Destacar', 'Highlight')}
					</button>
				{/if}
			</header>
			{#if neighbors.length}
				<div class="neighbors">
					{#each neighbors as neighbor (neighbor.code)}
						<button type="button" onclick={() => onnavigate(neighbor.code)}>
							{#if neighbor.iso2}<span class={`fi fi-${neighbor.iso2} mini`}></span>{/if}
							{isEn ? neighbor.nameEn : neighbor.name}
						</button>
					{/each}
				</div>
			{:else}
				<p class="empty">{tr('Sem fronteiras terrestres.', 'No land borders.')}</p>
			{/if}
		</section>

		{#each groups as group (group.id)}
			<section id={`card-${group.id}`} class="section">
				<header class="section-head">
					<span class="section-icon"><Icon name={sectionIcon(group.id)} size={16} /></span>
					<span class="index">{group.index}</span>
					<div>
						<h3>{group.title}</h3>
						<p>{group.desc}</p>
					</div>
					<a class="map-link" href={`/explore?country=${country.code}&layer=${groupLayer[group.id]}`}>
						<Icon name="globe" size={13} /> {tr('Ver no mapa', 'View on map')}
					</a>
				</header>
				<IndicatorGroup rows={group.rows} flag={country.iso2} {accent} compact />
				{#if group.id === 'economia'}
					<a class="extra-link" href={`/country/${country.code}#economy`}>
						<Icon name="coins" size={15} />
						<span>{tr('Maiores empresas e comércio exterior', 'Largest companies and foreign trade')}</span>
						<Icon name="arrowRight" size={14} />
					</a>
				{/if}
			</section>
		{/each}

		<section id="card-geopolitica" class="section">
			<header class="section-head">
				<span class="section-icon"><Icon name="shield" size={16} /></span>
				<span class="index">07</span>
				<div>
					<h3>{tr('Geopolítica', 'Geopolitics')}</h3>
					<p>{tr('Blocos, governança e defesa.', 'Blocs, governance and defence.')}</p>
				</div>
			</header>
			{#if currentOrgs.length}
				<div class="orgs">
					{#each currentOrgs as org (org.id)}
						<div class="org">
							<span>{org.short}</span>
							<p>{org.name}</p>
							{#if org.since?.[country.code]}<em>{tr('desde', 'since')} {org.since[country.code]}</em>{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty">{tr('Nenhum bloco curado para este país neste recorte.', 'No curated bloc for this country in this dataset.')}</p>
			{/if}
			<div class="metrics-grid tight">
				{#each geopoliticsRows as row (row.key)}
					<StatRow
						variant="metric"
						compact
						label={row.label}
						value={row.value}
						year={row.year}
						percentile={row.percentile}
						{accent}
					/>
				{/each}
			</div>
		</section>

		<section id="card-historia" class="section">
			<header class="section-head">
				<span class="section-icon"><Icon name="timeline" size={16} /></span>
				<span class="index">08</span>
				<div>
					<h3>{tr('História', 'History')}</h3>
					<p>{tr('Independência, nomes e blocos.', 'Independence, names and blocs.')}</p>
				</div>
			</header>
			<div class="facts-grid">
				{#if historical?.independence}
					<StatRow
						compact
						label={tr('Independência', 'Independence')}
						value={String(historical.independence)}
						note={historical.independenceFrom
							? `${tr('De', 'From')}: ${historical.independenceFrom}`
							: historical.note}
					/>
				{/if}
				{#if formerNames}
					<StatRow compact label={tr('Nomes anteriores', 'Former names')} value={formerNames} />
				{/if}
			</div>
			{#if historicalOrgs.length}
				<div class="orgs">
					{#each historicalOrgs as org (org.id)}
						<div class="org">
							<span>{org.short}</span>
							<p>{org.name}</p>
							<em>{org.founded}–{org.dissolved ?? (isEn ? 'present' : 'hoje')}</em>
						</div>
					{/each}
				</div>
				<p class="source-note">{tr('Federações históricas usam os polígonos atuais como aproximação.', 'Historical federations use current polygons as an approximation.')}</p>
			{:else if !historical}
				<p class="empty">{tr('Sem registro histórico curado para este país.', 'No curated historical record for this country.')}</p>
			{:else if historical?.note && !historical.independence}
				<p class="note">{historical.note}</p>
			{/if}
		</section>
	</div>

	<footer class="card-foot">
		<div class="foot-meta">
			<span>{tr('Dados', 'Data')}: {retrievedAt}</span>
			<nav aria-label="Links externos">
				<a href={wikipediaUrl} target="_blank" rel="noopener noreferrer" title={tr('Wikipédia', 'Wikipedia')}>
					<Icon name="book" size={13} /><span>{tr('Wikipédia', 'Wikipedia')}</span>
				</a>
				<a href={britannicaUrl} target="_blank" rel="noopener noreferrer" title="Britannica">
					<Icon name="external" size={13} /><span>Britannica</span>
				</a>
			</nav>
		</div>
		<a class="dossier-cta" href={dossierUrl}>
			<Icon name="dossier" size={14} />
			<span>{tr('Dossiê completo', 'Full dossier')}</span>
			<Icon name="arrowRight" size={13} />
		</a>
	</footer>
</aside>
{#if snap === 'full'}
	<button class="scrim" type="button" aria-label="Recolher painel" onclick={() => (snap = 'half')}></button>
{/if}

<style>
	.card {
		background: var(--surface-2);
		border: 1px solid var(--line);
		box-shadow: 0 24px 60px -30px rgb(0 0 0 / 0.6);
		position: fixed;
		top: calc(var(--header-h) + 0.7rem);
		right: 0.75rem;
		bottom: 0.75rem;
		z-index: 35;
		width: var(--sheet-w);
		max-width: calc(100vw - 1.5rem);
		display: flex;
		flex-direction: column;
		border-radius: 0.25rem;
		overflow: hidden;
	}
	.handle {
		display: none;
	}
	.identity {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		padding: 0.8rem 0.9rem 0.65rem;
		overflow: hidden;
	}
	.flag-glow {
		position: absolute;
		top: -48px;
		left: -20px;
		width: 190px;
		height: 130px;
		background-size: cover;
		background-position: center;
		filter: blur(34px) saturate(1.5);
		opacity: 0.24;
		pointer-events: none;
	}
	.flag-wrap {
		position: relative;
		flex-shrink: 0;
	}
	.flag {
		display: block;
		width: 3.4rem;
		height: 2.27rem;
		border: 1px solid var(--line-strong);
		background-size: cover;
		box-shadow: 0 8px 18px -12px rgb(0 0 0 / 0.55);
	}
	.flag-fallback {
		display: grid;
		place-items: center;
		width: 3.4rem;
		height: 2.27rem;
		border: 1px solid var(--line-strong);
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--text-3);
	}
	.titles {
		position: relative;
		min-width: 0;
		flex: 1;
	}
	.titles .eyebrow {
		font-size: 0.72rem;
	}
	h2 {
		margin: 0.16rem 0 0;
		font-family: var(--font-display);
		font-size: 1.8rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.035em;
	}
	.official {
		margin: 0.24rem 0 0;
		font-size: 0.72rem;
		line-height: 1.35;
		color: var(--text-3);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.45rem;
	}
	.chip {
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.12rem 0.42rem;
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.03em;
		color: var(--text-3);
	}
	.chip.accent {
		border-color: color-mix(in oklab, var(--accent-1) 45%, transparent);
		color: var(--accent-0);
	}
	.head-actions {
		display: flex;
		gap: 0.1rem;
		flex-shrink: 0;
	}
	.icon-btn {
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-3);
		border-radius: 0.15rem;
		padding: 0.4rem;
		display: grid;
		place-items: center;
	}
	.icon-btn:hover {
		color: var(--text-1);
		background: var(--surface-3);
		border-color: var(--line);
	}
	.key-metrics {
		display: grid;
		grid-template-columns: 1fr 1fr;
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		background: var(--surface-1);
	}
	.key {
		display: flex;
		flex-direction: column;
		gap: 0.06rem;
		min-width: 0;
		padding: 0.5rem 0.7rem;
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		transition: background 0.18s ease;
	}
	.key:hover {
		background: color-mix(in oklab, var(--accent-1) 5%, var(--surface-1));
	}
	.key:nth-child(2n) {
		border-right: 0;
	}
	.key:nth-last-child(-n + 2) {
		border-bottom: 0;
	}
	.key-label {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.key strong {
		font-family: var(--font-display);
		font-size: clamp(1.1rem, 1.9vw, 1.35rem);
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.02em;
		color: var(--text-1);
		font-variant-numeric: tabular-nums;
	}
	.key.small strong {
		font-size: clamp(0.95rem, 1.6vw, 1.15rem);
	}
	.key-meta {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		line-height: 1.35;
		color: var(--text-4);
	}
	.jump {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem;
		overflow-x: auto;
		padding: 0.3rem 0.55rem;
		border-bottom: 1px solid var(--line);
		background: var(--surface-2);
		scrollbar-width: none;
	}
	.jump::-webkit-scrollbar {
		display: none;
	}
	.jump button {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--text-3);
		padding: 0.35rem 0.55rem;
		font-size: 0.72rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.jump button:hover {
		color: var(--text-1);
	}
	.jump button.active {
		color: var(--accent-0);
		border-color: color-mix(in oklab, var(--accent-1) 45%, transparent);
		background: color-mix(in oklab, var(--accent-1) 12%, var(--surface-2));
	}
	.scroll {
		position: relative;
		flex: 1;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0 0.9rem 0.8rem;
		scrollbar-width: thin;
	}
	.section {
		padding: 0.7rem 0 0.85rem;
		border-bottom: 1px solid var(--line);
		animation: card-section-in 0.45s var(--ease-out-soft) both;
	}
	.section:last-child {
		border-bottom: 0;
	}
	@keyframes card-section-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.section-head {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		margin-bottom: 0.6rem;
	}
	.section-icon {
		display: grid;
		place-items: center;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 0.55rem;
		background: color-mix(in oklab, var(--accent-1) 10%, var(--surface-1));
		color: var(--accent-0);
		flex-shrink: 0;
	}
	.section-head .index {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		color: var(--accent-1);
		padding-top: 0.18rem;
	}
	.section-head h3 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.section-head p {
		margin: 0.08rem 0 0;
		font-size: 0.7rem;
		line-height: 1.4;
		color: var(--text-4);
	}
	.section-head .block-action,
	.section-head .map-link {
		margin-left: auto;
		flex-shrink: 0;
	}
	.facts-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem 0.8rem;
	}
	.metrics-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.45rem;
	}
	.metrics-grid.tight {
		margin-top: 0.55rem;
	}
	.block-action {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 1px solid var(--line);
		border-radius: 0.15rem;
		background: var(--surface-1);
		color: var(--text-3);
		padding: 0.3rem 0.45rem;
		font-size: 0.7rem;
	}
	.block-action:hover,
	.block-action.active {
		color: var(--accent-0);
		border-color: color-mix(in oklab, var(--accent-1) 45%, transparent);
	}
	.map-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		color: var(--text-4);
		text-decoration: none;
	}
	.map-link:hover {
		color: var(--accent-0);
	}
	.neighbors {
		display: flex;
		flex-wrap: wrap;
		gap: 0.28rem;
	}
	.neighbors button {
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
		border: 1px solid var(--line);
		border-radius: 0.18rem;
		background: var(--surface-1);
		color: var(--text-2);
		padding: 0.3rem 0.45rem;
		font-size: 0.72rem;
		transition: border-color 0.16s ease, transform 0.16s ease, background 0.16s ease;
	}
	.neighbors button:hover {
		border-color: var(--line-strong);
		background: var(--surface-3);
		transform: translateY(-1px);
	}
	.mini {
		display: block;
		width: 1.35rem;
		height: 0.9rem;
		border: 1px solid var(--line-strong);
		background-size: cover;
	}
	.overview-chart {
		margin: 0.7rem 0 0.85rem;
		padding: 0.7rem 0.75rem 0.55rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface-1);
	}
	.overview-head {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin-bottom: 0.35rem;
	}
	.overview-icon {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 0.55rem;
		background: color-mix(in oklab, var(--accent-1) 11%, var(--surface-2));
		color: var(--accent-0);
	}
	.overview-head > div {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
		min-width: 0;
	}
	.overview-label {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.overview-head strong {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.03em;
	}
	.overview-head button {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 0;
		background: transparent;
		color: var(--accent-0);
		font-size: 0.72rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.card-lede {
		margin: 0 0 0.65rem;
		font-size: 0.82rem;
		line-height: 1.55;
		color: var(--text-3);
	}
	.snippet {
		padding: 0.9rem 0.95rem;
		border: 1px solid color-mix(in oklab, var(--clay) 32%, transparent);
		border-radius: 0.2rem;
		background:
			linear-gradient(135deg, color-mix(in oklab, var(--clay) 9%, transparent), transparent 60%),
			var(--surface-1);
	}
	.snippet .eyebrow {
		font-size: 0.68rem;
	}
	.snippet h4 {
		margin: 0.28rem 0 0.35rem;
		font-family: var(--font-display);
		font-size: 1.18rem;
		font-weight: 600;
		line-height: 1.15;
	}
	.snippet p {
		margin: 0 0 0.5rem;
		font-size: 0.82rem;
		line-height: 1.55;
		color: var(--text-2);
	}
	.snippet a {
		display: inline-flex;
		align-items: center;
		gap: 0.22rem;
		font-size: 0.72rem;
		color: var(--accent-0);
		text-decoration: none;
	}
	.note {
		margin: 0.65rem 0 0;
		font-size: 0.74rem;
		line-height: 1.5;
		color: var(--text-3);
	}
	.note a {
		color: var(--accent-0);
		text-decoration: none;
	}
	.units-block {
		margin-top: 0.8rem;
		padding-top: 0.7rem;
		border-top: 1px solid var(--line);
	}
	.subhead {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		margin-bottom: 0.45rem;
	}
	.subhead h4 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
	}
	.subhead em {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-style: normal;
		color: var(--text-4);
	}
	.units {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.units button {
		display: inline-flex;
		align-items: baseline;
		gap: 0.28rem;
		border: 1px solid var(--line);
		border-radius: 0.15rem;
		background: var(--surface-1);
		color: var(--text-2);
		padding: 0.25rem 0.4rem;
		font-size: 0.72rem;
	}
	.units button em {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		font-style: normal;
		color: var(--text-4);
	}
	.units button:hover,
	.units button.active {
		color: var(--accent-0);
		border-color: color-mix(in oklab, var(--accent-1) 45%, transparent);
		background: color-mix(in oklab, var(--accent-1) 9%, var(--surface-1));
	}
	.more {
		margin-top: 0.4rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-3);
		padding: 0.28rem 0.45rem;
		font-size: 0.7rem;
	}
	.more:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
	.extra-link {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin-top: 0.65rem;
		padding: 0.65rem 0.7rem;
		border: 1px solid color-mix(in oklab, var(--accent-1) 40%, var(--line));
		border-radius: var(--radius-md);
		background: color-mix(in oklab, var(--accent-1) 7%, var(--surface-1));
		color: var(--accent-0);
		font-size: 0.8rem;
		font-weight: 600;
		text-decoration: none;
	}
	.extra-link span {
		flex: 1;
	}
	.extra-link:hover {
		background: color-mix(in oklab, var(--accent-1) 13%, var(--surface-1));
	}
	.source-note {
		margin: 0.45rem 0 0;
		font-size: 0.7rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	.orgs {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}
	.org {
		display: grid;
		grid-template-columns: 3.2rem 1fr auto;
		align-items: baseline;
		gap: 0.45rem;
		padding: 0.34rem 0.45rem;
		border: 1px solid var(--line);
		border-radius: 0.15rem;
		background: var(--surface-1);
	}
	.org span {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--accent-0);
	}
	.org p {
		margin: 0;
		font-size: 0.74rem;
		color: var(--text-2);
	}
	.org em {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		font-style: normal;
		color: var(--text-4);
	}
	.empty {
		margin: 0.2rem 0 0;
		font-size: 0.76rem;
		color: var(--text-4);
	}
	.card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.55rem 0.8rem;
		border-top: 1px solid var(--line);
		background: var(--surface-1);
	}
	.foot-meta {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--text-4);
	}
	.foot-meta nav {
		display: flex;
		gap: 0.55rem;
	}
	.foot-meta a {
		display: inline-flex;
		align-items: center;
		gap: 0.22rem;
		color: var(--text-3);
		text-decoration: none;
	}
	.foot-meta a:hover {
		color: var(--accent-0);
	}
	.dossier-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid color-mix(in oklab, var(--accent-1) 55%, transparent);
		border-radius: 0.18rem;
		background: color-mix(in oklab, var(--accent-1) 12%, var(--surface-2));
		color: var(--accent-0);
		padding: 0.45rem 0.55rem;
		font-size: 0.72rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
	}
	.dossier-cta:hover {
		background: color-mix(in oklab, var(--accent-1) 20%, var(--surface-2));
	}
	.dossier-cta :global(svg:last-child) {
		transition: transform 0.2s var(--ease-out-soft);
	}
	.dossier-cta:hover :global(svg:last-child) {
		transform: translateX(2px);
	}
	.scrim {
		display: none;
	}
	@media (max-width: 900px) {
		.jump {
			flex-wrap: nowrap;
			overflow-x: auto;
		}
		.card {
			top: auto;
			left: 0.35rem;
			right: 0.35rem;
			bottom: calc(6.6rem + env(safe-area-inset-bottom));
			width: auto;
			max-width: none;
			transform: translateY(var(--drag, 0));
			transition: height 0.26s var(--ease-out-soft), transform 0.18s ease;
			height: 62vh;
			max-height: calc(100dvh - var(--header-h) - 7.4rem);
		}
		.card.dragging {
			transition: none;
		}
		.snap-peek {
			height: 30vh;
		}
		.snap-half {
			height: 62vh;
		}
		.snap-full {
			height: calc(100dvh - var(--header-h) - 7.4rem);
		}
		.snap-peek .key-metrics,
		.snap-peek .jump,
		.snap-peek .scroll {
			display: none;
		}
		.handle {
			display: flex;
			gap: 3px;
			justify-content: center;
			align-items: center;
			height: 15px;
			cursor: grab;
			touch-action: none;
		}
		.handle span {
			width: 14px;
			height: 2px;
			background: var(--line-strong);
		}
		.identity {
			padding-top: 0.35rem;
		}
		.scrim {
			display: block;
			position: fixed;
			inset: var(--header-h) 0 0 0;
			z-index: 34;
			border: 0;
			background: color-mix(in oklab, var(--surface-0) 50%, transparent);
		}
	}
	@media (max-width: 480px) {
		.facts-grid,
		.metrics-grid {
			grid-template-columns: 1fr;
		}
		.foot-meta > span {
			display: none;
		}
		.flag {
			width: 3.5rem;
			height: 2.35rem;
		}
		h2 {
			font-size: 1.7rem;
		}
	}
</style>
