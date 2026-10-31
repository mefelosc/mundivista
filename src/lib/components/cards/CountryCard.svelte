<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import StatRow from './StatRow.svelte';
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
	import { formatArea, formatIndicatorValue } from '#lib/format';
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

	type TabId = 'overview' | 'demography' | 'economy' | 'environment' | 'geopolitics' | 'history';

	const TABS: { id: TabId; label: string; short: string }[] = [
		{ id: 'overview', label: 'Visão geral', short: 'Geral' },
		{ id: 'demography', label: 'Demografia', short: 'Demografia' },
		{ id: 'economy', label: 'Economia', short: 'Economia' },
		{ id: 'environment', label: 'Meio físico', short: 'Físico' },
		{ id: 'geopolitics', label: 'Geopolítica', short: 'Geopolítica' },
		{ id: 'history', label: 'História', short: 'História' }
	];

	const TAB_FOR_LAYER: Record<string, TabId> = {
		standard: 'overview',
		political: 'overview',
		physical: 'environment',
		population: 'demography',
		economy: 'economy',
		geopolitics: 'geopolitics',
		history: 'history'
	};

	let tab = $state<TabId>('overview');
	let copied = $state(false);
	let snap = $state<'peek' | 'half' | 'full'>('half');
	let dragOffset = $state(0);
	let dragging = $state(false);
	let dragStart = 0;
	let sheetEl: HTMLElement | null = null;
	const UNIT_LIMIT = 18;
	let unitLimit = $state(UNIT_LIMIT);

	const capital = $derived(capitalInPortuguese(country.code, country.capital));
	const historical = $derived(getHistorical(country.code));
	const orgs = $derived(organizationsForCountry(country.code));
	const currentOrgs = $derived(orgs.filter((o) => o.era === 'current'));
	const historicalOrgs = $derived(orgs.filter((o) => o.era === 'historical'));
	const neighbors = $derived(
		country.borders.map((b) => getCountry(b)).filter(Boolean) as Country[]
	);
	const snippet = $derived(snippetsByCountry.get(country.code)?.[0] ?? null);
	const disputed = $derived(disputedInfo(country.code));
	const sovereign = $derived(sovereignCountry(country));
	const dependency = $derived(dependencyLabel(country));
	const accent = $derived(layer.palette?.[layer.palette.length - 1] ?? 'var(--accent-1)');

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
			label: 'População',
			value: pop ? formatIndicatorValue('population', pop) : '—',
			year: pop?.y,
			meta: popRank ? `${popRank.rank}º de ${popRank.total}` : null
		});
		const gdp = country.indicators.gdpPerCapita;
		const gdpRank = rankOf(country.code, 'gdpPerCapita');
		items.push({
			key: 'gdpPerCapita',
			label: 'PIB per capita',
			value: gdp ? formatIndicatorValue('gdpPerCapita', gdp) : '—',
			year: gdp?.y,
			meta: gdpRank ? `${gdpRank.rank}º de ${gdpRank.total}` : null
		});
		items.push({
			key: 'area',
			label: 'Área',
			value: country.areaKm2 ? formatArea(country.areaKm2) : '—',
			meta: 'superfície terrestre'
		});
		items.push({
			key: 'capital',
			label: 'Capital',
			value: capital ?? '—',
			meta: country.unMember ? 'Estado-membro da ONU' : 'Estatuto não membro'
		});
		return items;
	});

	const TAB_INDICATORS: Record<Exclude<TabId, 'overview' | 'history' | 'geopolitics'>, IndicatorKey[]> = {
		demography: ['population', 'popDensity', 'popGrowth', 'lifeExpectancy', 'urbanShare', 'fertility', 'schoolEnrollment'],
		economy: ['gdp', 'gdpPerCapita', 'gdpGrowth', 'unemployment', 'inflation', 'debtShare', 'exportsShare', 'importsShare', 'industryShare', 'agriShare', 'researchShare', 'tourism', 'gini'],
		environment: ['forestShare', 'renewableShare', 'electricityAccess', 'co2PerCapita', 'co2Total', 'energyUse', 'healthShare', 'internetShare']
	};

	const rows = $derived.by(() => {
		if (tab === 'overview' || tab === 'history' || tab === 'geopolitics') return [];
		const keys = TAB_INDICATORS[tab] ?? [];
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
				comparison = `${better ? 'Melhor que' : 'Pior que'} a mediana (${medianText})`;
			}
			return {
				key,
				label: meta?.name ?? key,
				value: value ? formatIndicatorValue(key, value) : 'Não disponível',
				year: value?.y ?? null,
				percentile: rank?.percentile ?? null,
				comparison
			};
		});
	});

	const geopoliticsRows = $derived.by(() => {
		if (tab !== 'geopolitics') return [];
		return (['militaryShare', 'govEffectiveness', 'controlCorruption', 'ruleOfLaw'] as IndicatorKey[]).map(
			(key) => {
				const value = country.indicators[key];
				const rank = rankOf(country.code, key);
				return {
					key,
					label: indicatorMeta[key]?.name ?? key,
					value: value ? formatIndicatorValue(key, value) : 'Não disponível',
					year: value?.y ?? null,
					percentile: rank?.percentile ?? null
				};
			}
		);
	});

	$effect(() => {
		const code = country.code;
		void code;
		tab = TAB_FOR_LAYER[layer.id] ?? 'overview';
		copied = false;
		dragOffset = 0;
		snap = 'half';
		unitLimit = UNIT_LIMIT;
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

	function onTabKey(event: KeyboardEvent, position: number) {
		if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
		event.preventDefault();
		const delta = event.key === 'ArrowRight' ? 1 : -1;
		const next = (position + delta + TABS.length) % TABS.length;
		tab = TABS[next].id;
		const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll('button');
		buttons?.[next]?.focus();
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
</script>

<aside
	bind:this={sheetEl}
	class="card animate-sheet-in snap-{snap}"
	class:dragging
	style:--drag={`${dragOffset}px`}
	aria-label={`Informações sobre ${country.name}`}
>
	<div
		class="handle"
		role="button"
		tabindex="0"
		aria-label="Redimensionar painel"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onclick={cycleSnap}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && cycleSnap()}
	>
		<span></span><span></span><span></span>
	</div>

	<header class="card-head">
		<div class="country-id">
			<div class="flag-wrap">
				{#if country.iso2}
					<span class={`flag fi fi-${country.iso2}`}></span>
				{:else}
					<span class="flag-fallback">{country.code}</span>
				{/if}
			</div>
			<div class="titles">
				<span class="eyebrow">{layer.label}{country.continent ? ` · ${country.continent}` : ''}</span>
				<h2>{country.name}</h2>
				<p>
					{country.nameEn}{dependency ?? country.type ? ` · ${dependency ?? country.type}` : ''} · {country.code}
				</p>
			</div>
		</div>
		<div class="head-actions">
			<button type="button" class="icon-btn" onclick={share} aria-label="Compartilhar país" title="Compartilhar">
				<Icon name={copied ? 'check' : 'link'} size={15} />
			</button>
			<button class="icon-btn" type="button" onclick={onclose} aria-label="Fechar card">
				<Icon name="close" size={16} />
			</button>
		</div>
	</header>

	<div class="key-metrics" aria-label="Resumo">
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

	<div class="tabs" role="tablist" aria-label="Seções do país">
		{#each TABS as t, i (t.id)}
			<button
				type="button"
				role="tab"
				aria-selected={tab === t.id}
				tabindex={tab === t.id ? 0 : -1}
				class:active={tab === t.id}
				onclick={() => (tab = t.id)}
				onkeydown={(event) => onTabKey(event, i)}
			>
				{t.short}
			</button>
		{/each}
	</div>

	<div class="body" role="tabpanel" tabindex="0" aria-label={TABS.find((t) => t.id === tab)?.label}>
		{#key tab}
			<div class="panel-content">
				{#if tab === 'overview'}
					<section class="block">
						<div class="block-head">
							<h3>Identidade</h3>
						</div>
						<div class="facts-grid">
							<StatRow compact label="Nome oficial" value={country.official ?? country.nameEn} />
							<StatRow compact label="Continente" value={country.continent ?? 'Não disponível'} />
							<StatRow compact label="Sub-região" value={country.subregion ?? 'Não disponível'} />
							<StatRow compact label="Moeda" value={currency} />
							<StatRow
								compact
								label="Idiomas"
								value={country.languages.length ? country.languages.join(', ') : 'Não disponível'}
							/>
							<StatRow label="Membro da ONU" compact value={country.unMember === null ? 'Não disponível' : country.unMember ? 'Sim' : 'Não'} />
							<StatRow label="Sem litoral" compact value={country.landlocked === null ? 'Não disponível' : country.landlocked ? 'Sim' : 'Não'} />
							{#if sovereign}
								<StatRow compact label="Soberania" value={sovereign.name} note={dependency ?? undefined} />
							{:else}
								<StatRow compact label="Estatuto" value={country.type ?? disputed?.label ?? 'Soberano'} />
							{/if}
						</div>
						{#if disputed}
							<p class="note">
								{disputed.label}. {disputed.note}
								<a href={disputed.source.url} target="_blank" rel="noopener noreferrer">
									Fonte <Icon name="external" size={10} />
								</a>
							</p>
						{/if}
					</section>

					<section class="block">
						<div class="block-head">
							<h3>Países vizinhos</h3>
							{#if neighbors.length && ontoggleneighbors}
								<button
									type="button"
									class="block-action"
									class:active={neighborsHighlighted}
									onclick={ontoggleneighbors}
									aria-pressed={neighborsHighlighted}
								>
									<Icon name={neighborsHighlighted ? 'eyeOff' : 'eye'} size={12} />
									{neighborsHighlighted ? 'Remover destaque' : 'Destacar'}
								</button>
							{/if}
						</div>
						{#if neighbors.length}
							<div class="neighbors">
								{#each neighbors as neighbor (neighbor.code)}
									<button type="button" onclick={() => onnavigate(neighbor.code)}>
										{#if neighbor.iso2}<span class="fi fi-{neighbor.iso2} mini"></span>{/if}
										{neighbor.name}
									</button>
								{/each}
							</div>
						{:else}
							<p class="empty">Sem fronteiras terrestres.</p>
						{/if}
					</section>

					{#if layer.showSubdivisions}
						<details class="block units-block" open>
							<summary>
								<span>Unidades e estados</span>
								{#if units.length}<em>{units.length}</em>{/if}
								<Icon name="chevronDown" size={14} />
							</summary>
							{#if subdivisionsLoading}
								<p class="empty">Carregando unidades administrativas…</p>
							{:else if units.length}
								<div class="units">
									{#each shownUnits as unit (unit.id)}
										<button
											type="button"
											class:active={activeSubdivision === unit.id}
											onclick={() => toggleUnit(unit)}
											title={`${unit.name} · ${unit.type}${unit.label ? ' · centralizar no mapa' : ''}`}
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
										{unitLimit >= units.length ? 'Mostrar menos' : `Mostrar todas as ${units.length}`}
									</button>
								{/if}
								<p class="source-note">
									Natural Earth 1:10m · primeiro nível administrativo. O nível varia por país.
								</p>
							{:else}
								<p class="empty">Sem unidades de primeiro nível na base para este território.</p>
							{/if}
						</details>
					{/if}

					{#if snippet}
						<section class="snippet">
							<span class="eyebrow">Leitura rápida</span>
							<h3>{snippet.title}</h3>
							<p>{snippet.body}</p>
							<a href={snippet.sourceUrl} target="_blank" rel="noopener noreferrer">
								{snippet.source} <Icon name="external" size={11} />
							</a>
						</section>
					{/if}
				{:else if tab === 'history'}
					<section class="block">
						<div class="block-head"><h3>Marcos</h3></div>
						<div class="facts-grid">
							{#if historical?.independence}
								<StatRow
									compact
									label="Independência"
									value={String(historical.independence)}
									note={historical.independenceFrom ? `De: ${historical.independenceFrom}` : historical.note}
								/>
							{/if}
							{#if formerNames}
								<StatRow compact label="Nomes anteriores" value={formerNames} />
							{/if}
						</div>
						{#if !historical}
							<p class="empty">Sem registro histórico curado para este país.</p>
						{/if}
					</section>
					{#if historicalOrgs.length}
						<section class="block">
							<div class="block-head"><h3>Federações e blocos históricos</h3></div>
							<div class="orgs">
								{#each historicalOrgs as org (org.id)}
									<div class="org">
										<span>{org.short}</span>
										<p>{org.name}</p>
										<em>{org.founded}–{org.dissolved ?? 'hoje'}</em>
									</div>
								{/each}
							</div>
							<p class="source-note">Federações históricas usam os polígonos atuais como aproximação.</p>
						</section>
					{/if}
					{#if historical?.note && !historical.independence}
						<p class="note">{historical.note}</p>
					{/if}
				{:else if tab === 'geopolitics'}
					<section class="block">
						<div class="block-head"><h3>Organizações</h3></div>
						{#if currentOrgs.length}
							<div class="orgs">
								{#each currentOrgs as org (org.id)}
									<div class="org">
										<span>{org.short}</span>
										<p>{org.name}</p>
										{#if org.since?.[country.code]}<em>desde {org.since[country.code]}</em>{/if}
									</div>
								{/each}
							</div>
						{:else}
							<p class="empty">Nenhum bloco curado para este país neste recorte.</p>
						{/if}
					</section>
					<section class="block">
						<div class="block-head"><h3>Governança e defesa</h3></div>
						<div class="metrics-grid">
							{#each geopoliticsRows as row (row.key)}
								<StatRow
									variant="metric"
									compact
									label={row.label}
									value={row.value}
									year={row.year}
									percentile={row.percentile}
									accent={accent}
								/>
							{/each}
						</div>
					</section>
				{:else}
					<div class="metrics-grid">
						{#each rows as row (row.key)}
							<StatRow
								variant="metric"
								compact
								label={row.label}
								value={row.value}
								year={row.year}
								percentile={row.percentile}
								comparison={row.comparison}
								accent={accent}
							/>
						{/each}
					</div>
					<p class="dossier-hint">
						<a href={dossierUrl}>
							Ver séries, comparações e método no dossiê <Icon name="arrowRight" size={12} />
						</a>
					</p>
				{/if}
			</div>
		{/key}
	</div>

	<footer class="card-foot">
		<span>Dados: {retrievedAt}</span>
		<nav aria-label="Links do país">
			<a href={wikipediaUrl} target="_blank" rel="noopener noreferrer" title="Wikipédia">
				<Icon name="book" size={12} /><span>Wikipédia</span>
			</a>
			<a href={britannicaUrl} target="_blank" rel="noopener noreferrer" title="Britannica">
				<Icon name="external" size={12} /><span>Britannica</span>
			</a>
			<a class="dossier-link" href={dossierUrl}>
				<Icon name="dossier" size={12} /><span>Dossiê</span>
			</a>
		</nav>
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
	.card-head {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.9rem 1rem 0.75rem;
	}
	.country-id {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		min-width: 0;
		flex: 1;
	}
	.flag-wrap {
		flex-shrink: 0;
	}
	.flag {
		display: block;
		width: 3.1rem;
		height: 2.05rem;
		border: 1px solid var(--line-strong);
		background-size: cover;
	}
	.flag-fallback {
		display: grid;
		place-items: center;
		width: 3.1rem;
		height: 2.05rem;
		border: 1px solid var(--line-strong);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--text-3);
	}
	.titles {
		min-width: 0;
	}
	.titles .eyebrow {
		font-size: 0.64rem;
	}
	h2 {
		margin: 0.16rem 0 0;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.015em;
	}
	.titles p {
		margin: 0.2rem 0 0;
		font-size: 0.68rem;
		line-height: 1.35;
		color: var(--text-4);
	}
	.head-actions {
		display: flex;
		gap: 0.15rem;
		flex-shrink: 0;
	}
	.icon-btn {
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-3);
		border-radius: 0.15rem;
		padding: 0.35rem;
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
		gap: 0.1rem;
		min-width: 0;
		padding: 0.62rem 1rem;
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}
	.key:nth-child(2n) {
		border-right: 0;
	}
	.key:nth-last-child(-n + 2) {
		border-bottom: 0;
	}
	.key-label {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.key strong {
		margin-top: 0.1rem;
		font-family: var(--font-display);
		font-size: 1.28rem;
		font-weight: 600;
		line-height: 1.05;
		color: var(--text-1);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.key.small strong {
		font-size: 1.05rem;
	}
	.key-meta {
		min-height: 0.8rem;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--text-4);
	}
	.tabs {
		display: flex;
		gap: 0.1rem;
		padding: 0 0.6rem;
		border-bottom: 1px solid var(--line);
		background: var(--surface-1);
		overflow-x: auto;
		scrollbar-width: none;
	}
	.tabs::-webkit-scrollbar {
		display: none;
	}
	.tabs button {
		flex-shrink: 0;
		border: 0;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--text-3);
		padding: 0.58rem 0.55rem 0.5rem;
		font-size: 0.78rem;
		font-weight: 500;
		white-space: nowrap;
	}
	.tabs button:hover {
		color: var(--text-1);
	}
	.tabs button.active {
		color: var(--text-1);
		border-bottom-color: var(--accent-1);
	}
	.body {
		flex: 1;
		overflow-y: auto;
		padding: 0.9rem 1rem 1.1rem;
	}
	.panel-content {
		animation: fade-up 0.28s var(--ease-out-soft) both;
	}
	.block {
		margin-bottom: 1.25rem;
	}
	.block:last-child {
		margin-bottom: 0;
	}
	.block-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.6rem;
	}
	h3 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.06rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--text-1);
	}
	.block-action {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-3);
		padding: 0.24rem 0.42rem;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.03em;
	}
	.block-action:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
	.block-action.active {
		color: var(--accent-0);
		border-color: color-mix(in oklab, var(--accent-1) 50%, transparent);
		background: color-mix(in oklab, var(--accent-1) 12%, var(--surface-1));
	}
	.facts-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem 1rem;
	}
	.metrics-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.45rem;
	}
	.neighbors {
		display: flex;
		flex-wrap: wrap;
		gap: 0.28rem;
	}
	.neighbors button {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-2);
		padding: 0.26rem 0.46rem 0.26rem 0.36rem;
		font-size: 0.7rem;
		transition: border-color 0.15s ease, background 0.15s ease;
	}
	.neighbors button:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
		background: var(--surface-3);
	}
	.mini {
		width: 1.15rem;
		height: 0.78rem;
		background-size: cover;
	}
	.units-block {
		border-top: 1px solid var(--line);
		padding-top: 0.7rem;
	}
	.units-block summary {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		cursor: pointer;
		list-style: none;
		font-family: var(--font-display);
		font-size: 1.06rem;
		font-weight: 600;
		color: var(--text-1);
	}
	.units-block summary::-webkit-details-marker {
		display: none;
	}
	.units-block summary em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--text-4);
	}
	.units-block summary :global(svg) {
		margin-left: auto;
		color: var(--text-4);
		transition: transform 0.2s var(--ease-out-soft);
	}
	.units-block[open] summary :global(svg) {
		transform: rotate(180deg);
	}
	.units-block[open] summary {
		margin-bottom: 0.55rem;
	}
	.units {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.24rem;
	}
	.units button {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.06rem;
		min-width: 0;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-2);
		padding: 0.3rem 0.42rem;
		text-align: left;
		transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
	}
	.units button:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
		background: var(--surface-3);
	}
	.units button.active {
		color: var(--accent-0);
		border-color: color-mix(in oklab, var(--accent-1) 55%, transparent);
		background: color-mix(in oklab, var(--accent-1) 12%, var(--surface-1));
	}
	.units button span {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.7rem;
		line-height: 1.25;
	}
	.units button em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.more {
		margin-top: 0.35rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-3);
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.03em;
		padding: 0.3rem 0.45rem;
	}
	.more:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
	.source-note,
	.note {
		margin: 0.45rem 0 0;
		font-size: 0.6rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	.note a {
		color: var(--accent-0);
		text-decoration: none;
		white-space: nowrap;
	}
	.orgs {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.org {
		display: grid;
		grid-template-columns: 3.2rem 1fr auto;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.42rem 0.5rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
	}
	.org span {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--accent-0);
		letter-spacing: 0.05em;
	}
	.org p {
		margin: 0;
		font-size: 0.7rem;
		line-height: 1.35;
		color: var(--text-2);
	}
	.org em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--text-4);
		white-space: nowrap;
	}
	.snippet {
		padding: 0.85rem 0.9rem;
		border: 1px solid color-mix(in oklab, var(--clay) 32%, transparent);
		border-radius: 0.2rem;
		background: color-mix(in oklab, var(--clay) 6%, transparent);
	}
	.snippet h3 {
		margin: 0.25rem 0 0.35rem;
		font-size: 1.12rem;
	}
	.snippet p {
		margin: 0 0 0.45rem;
		font-size: 0.76rem;
		line-height: 1.55;
		color: var(--text-2);
	}
	.snippet a {
		display: inline-flex;
		align-items: center;
		gap: 0.22rem;
		font-size: 0.64rem;
		color: var(--accent-0);
		text-decoration: none;
	}
	.dossier-hint {
		margin: 0.6rem 0 0;
	}
	.dossier-hint a {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--accent-0);
		text-decoration: none;
	}
	.empty {
		margin: 0.2rem 0 0;
		font-size: 0.72rem;
		color: var(--text-4);
	}
	.card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		padding: 0.5rem 1rem;
		border-top: 1px solid var(--line);
		background: var(--surface-1);
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--text-4);
	}
	.card-foot nav {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}
	.card-foot a {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--text-3);
		text-decoration: none;
	}
	.card-foot a:hover {
		color: var(--accent-0);
	}
	.card-foot .dossier-link {
		color: var(--accent-0);
	}
	.scrim {
		display: none;
	}
	@media (max-width: 900px) {
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
		.snap-peek .tabs,
		.snap-peek .body {
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
		.card-head {
			padding-top: 0.25rem;
		}
		.key strong {
			font-size: 1.16rem;
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
		.card-foot > span {
			display: none;
		}
		.card-foot {
			justify-content: flex-end;
		}
	}
</style>
