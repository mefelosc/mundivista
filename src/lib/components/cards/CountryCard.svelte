<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import StatRow from './StatRow.svelte';
	import Sparkline from './Sparkline.svelte';
	import LocatorMap from './LocatorMap.svelte';
	import { capitalInPortuguese } from '#lib/data/capitals-pt';
	import {
		indicatorMeta,
		rankOf,
		retrievedAt,
		getCountry,
		worldStats
	} from '#lib/data/countries';
	import { getHistorical } from '#lib/data/historical';
	import { disputedInfo } from '#lib/data/disputed';
	import { organizationsForCountry } from '#lib/data/organizations';
	import { snippetsByCountry } from '#lib/data/snippets';
	import { formatArea, formatIndicatorValue } from '#lib/format';
	import type { Country, IndicatorKey } from '#lib/types';
	import type { ResolvedLayer } from '#lib/configurations/map-layers';

	interface Props {
		country: Country;
		layer: ResolvedLayer;
		onclose: () => void;
		onnavigate: (code: string) => void;
		neighborsHighlighted?: boolean;
		ontoggleneighbors?: () => void;
	}

	let {
		country,
		layer,
		onclose,
		onnavigate,
		neighborsHighlighted = false,
		ontoggleneighbors
	}: Props = $props();

	type TabId = 'overview' | 'demography' | 'economy' | 'environment' | 'geopolitics' | 'history';

	const TABS: { id: TabId; label: string; index: string }[] = [
		{ id: 'overview', label: 'Visão geral', index: '01' },
		{ id: 'demography', label: 'Demografia', index: '02' },
		{ id: 'economy', label: 'Economia', index: '03' },
		{ id: 'environment', label: 'Meio físico', index: '04' },
		{ id: 'geopolitics', label: 'Geopolítica', index: '05' },
		{ id: 'history', label: 'História', index: '06' }
	];

	const TAB_FOR_LAYER: Record<string, TabId> = {
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
	const accent = $derived(layer.palette?.[layer.palette.length - 1] ?? 'var(--accent-1)');

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
		const items: { key: IndicatorKey | 'area' | 'capital'; label: string; value: string; year?: number }[] = [];
		const pop = country.indicators.population;
		if (pop)
			items.push({ key: 'population', label: 'População', value: formatIndicatorValue('population', pop), year: pop.y });
		const gdp = country.indicators.gdpPerCapita;
		if (gdp)
			items.push({ key: 'gdpPerCapita', label: 'PIB per capita', value: formatIndicatorValue('gdpPerCapita', gdp), year: gdp.y });
		items.push({
			key: 'area',
			label: 'Área',
			value: country.areaKm2 ? formatArea(country.areaKm2) : 'Não disponível'
		});
		items.push({ key: 'capital', label: 'Capital', value: capital ?? 'Não disponível' });
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
				comparison,
				series: value?.s ?? null
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
	});

	function fmt(key: IndicatorKey, value: number): string {
		return formatIndicatorValue(key, { v: value, y: 0 });
	}

	async function share() {
		try {
			if (navigator.share) {
				await navigator.share({ title: `${country.name} — Mundivista`, url: shareUrl });
			} else {
				await navigator.clipboard.writeText(shareUrl);
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

	<header>
		<div class="flag-wrap">
			{#if country.iso2}
				<span class={`flag fi fi-${country.iso2}`}></span>
			{:else}
				<span class="flag-fallback">{country.code}</span>
			{/if}
		</div>
		<div class="titles">
			<h2>{country.name}</h2>
			<p>{country.nameEn}{country.type ? ` · ${country.type}` : ''}</p>
		</div>
		<div class="head-actions">
			<button type="button" class="icon-btn" onclick={share} aria-label="Compartilhar país" title="Compartilhar">
				<Icon name={copied ? 'check' : 'link'} size={14} />
			</button>
			<button class="icon-btn" type="button" onclick={onclose} aria-label="Fechar card">
				<Icon name="close" size={15} />
			</button>
		</div>
	</header>

	<div class="meta">
		<span class="pill">{layer.label}</span>
		{#if country.continent}<span>{country.continent}</span>{/if}
		{#if country.subregion}<span class="dim">{country.subregion}</span>{/if}
		<span class="mono">{country.code}</span>
	</div>

	<div class="links">
		<a href={wikipediaUrl} target="_blank" rel="noopener noreferrer">
			<Icon name="book" size={12} /> Wikipédia
		</a>
		<a href={britannicaUrl} target="_blank" rel="noopener noreferrer">
			<Icon name="external" size={12} /> Britannica
		</a>
		<a class="dossier-link" href={dossierUrl}>
			<Icon name="dossier" size={12} /> Abrir dossiê
		</a>
	</div>

	<div class="glance" aria-label="Resumo">
		{#each glance as item (item.key)}
			<div>
				<span class="glance-label">{item.label}</span>
				<strong>{item.value}</strong>
				{#if item.year}<em>{item.year}</em>{/if}
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
				<span>{t.index}</span>{t.label}
			</button>
		{/each}
	</div>

	<div class="body" role="tabpanel" tabindex="0" aria-label={TABS.find((t) => t.id === tab)?.label}>
		{#if tab === 'overview'}
			<LocatorMap {country} {neighbors} />
			<section>
				<h3>Identidade</h3>
				<StatRow label="Capital" value={capital ?? 'Não disponível'} />
				<StatRow label="Continente" value={country.continent ?? 'Não disponível'} />
				<StatRow label="Sub-região" value={country.subregion ?? 'Não disponível'} />
				<StatRow
					label="Área"
					value={country.areaKm2 ? formatArea(country.areaKm2) : 'Não disponível'}
				/>
				<StatRow label="Moeda" value={currency} />
				<StatRow
					label="Idiomas"
					value={country.languages.length ? country.languages.join(', ') : 'Não disponível'}
				/>
				<StatRow label="Membro da ONU" value={country.unMember === null ? 'Não disponível' : country.unMember ? 'Sim' : 'Não'} />
				<StatRow label="Sem litoral" value={country.landlocked === null ? 'Não disponível' : country.landlocked ? 'Sim' : 'Não'} />
				{#if disputed}
					<StatRow label="Estatuto" value={disputed.label} note={disputed.note} />
				{/if}
			</section>
			<section>
				<div class="section-head">
					<h3>Países vizinhos</h3>
					{#if neighbors.length && ontoggleneighbors}
						<button
							type="button"
							class="highlight-toggle"
							class:active={neighborsHighlighted}
							onclick={ontoggleneighbors}
							aria-pressed={neighborsHighlighted}
							title="Destacar os vizinhos na camada do mapa"
						>
							<Icon name={neighborsHighlighted ? 'eyeOff' : 'eye'} size={11} />
							{neighborsHighlighted ? 'Remover destaque' : 'Destacar no mapa'}
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
			<section>
				<h3>Marcos</h3>
				{#if historical?.independence}
					<StatRow
						label="Independência"
						value={String(historical.independence)}
						note={historical.independenceFrom ? `De: ${historical.independenceFrom}` : historical.note}
					/>
				{/if}
				{#if formerNames}
					<StatRow label="Nomes anteriores" value={formerNames} />
				{/if}
				{#if !historical}
					<p class="empty">Sem registro histórico curado para este país.</p>
				{/if}
			</section>
			{#if historicalOrgs.length}
				<section>
					<h3>Federações e blocos históricos</h3>
					<div class="orgs">
						{#each historicalOrgs as org (org.id)}
							<div class="org">
								<span>{org.short}</span>
								<p>{org.name} · {org.founded}–{org.dissolved ?? 'hoje'}</p>
							</div>
						{/each}
					</div>
					<p class="note">Federações históricas usam os polígonos atuais como aproximação; não são fronteiras do período.</p>
				</section>
			{/if}
			{#if historical?.note && !historical.independence}
				<p class="note">{historical.note}</p>
			{/if}
		{:else if tab === 'geopolitics'}
			<section>
				<h3>Organizações</h3>
				{#if currentOrgs.length}
					<div class="orgs">
						{#each currentOrgs as org (org.id)}
							<div class="org">
								<span>{org.short}</span>
								<p>{org.name}{org.since?.[country.code] ? ` · desde ${org.since[country.code]}` : ''}</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="empty">Nenhum bloco curado para este país neste recorte.</p>
				{/if}
			</section>
			<section>
				<h3>Governança e defesa</h3>
				{#each geopoliticsRows as row (row.key)}
					<StatRow
						label={row.label}
						value={row.value}
						year={row.year}
						percentile={row.percentile}
						accent={accent}
					/>
				{/each}
			</section>
		{:else}
			<section>
				<h3>{TABS.find((t) => t.id === tab)?.label}</h3>
				{#each rows as row (row.key)}
					<StatRow
						label={row.label}
						value={row.value}
						year={row.year}
						percentile={row.percentile}
						comparison={row.comparison}
						accent={accent}
					/>
					{#if row.series && row.series.length > 2}
						<Sparkline
							series={row.series}
							label={row.label}
							format={(v) => fmt(row.key, v)}
							delta={indicatorMeta[row.key]?.unit.includes('%') ? 'points' : 'percent'}
						/>
					{/if}
				{/each}
			</section>
		{/if}
	</div>

	<footer>
		<span>Dados: {retrievedAt}</span>
		<a href="/sobre">Fontes e métodos</a>
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
		border-radius: 0.2rem;
		overflow: hidden;
	}
	.handle {
		display: none;
	}
	header {
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
		padding: 0.8rem 0.8rem 0.55rem;
	}
	.flag-wrap {
		flex-shrink: 0;
	}
	.flag {
		display: block;
		width: 2.15rem;
		height: 1.45rem;
		border: 1px solid var(--line-strong);
		background-size: cover;
	}
	.flag-fallback {
		display: grid;
		place-items: center;
		width: 2.15rem;
		height: 1.45rem;
		border: 1px solid var(--line-strong);
		font-family: var(--font-mono);
		font-size: 0.754rem;
		color: var(--text-3);
	}
	.titles {
		min-width: 0;
		flex: 1;
	}
	h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.380rem;
		font-weight: 600;
		line-height: 1.1;
		letter-spacing: -0.01em;
	}
	.titles p {
		margin: 0.18rem 0 0;
		font-size: 0.780rem;
		color: var(--text-4);
	}
	.head-actions {
		display: flex;
		gap: 2px;
	}
	.icon-btn {
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-3);
		border-radius: 0.1rem;
		padding: 0.3rem;
		display: grid;
		place-items: center;
	}
	.icon-btn:hover {
		color: var(--text-1);
		background: var(--surface-3);
		border-color: var(--line);
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0 0.8rem 0.55rem;
		font-size: 0.754rem;
		color: var(--text-3);
		border-bottom: 1px solid var(--line);
	}
	.meta .dim {
		color: var(--text-4);
	}
	.pill {
		border: 1px solid color-mix(in oklab, var(--accent-1) 40%, transparent);
		color: var(--accent-0);
		background: color-mix(in oklab, var(--accent-1) 9%, transparent);
		border-radius: 0.1rem;
		padding: 0.1rem 0.35rem;
		font-family: var(--font-mono);
		font-size: 0.700rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.mono {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.676rem;
		letter-spacing: 0.08em;
	}
	.links {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.45rem 0.8rem;
		border-bottom: 1px solid var(--line);
	}
	.links a {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 1px solid var(--line);
		color: var(--text-3);
		padding: 0.2rem 0.4rem;
		font-size: 0.715rem;
		text-decoration: none;
		transition: all 0.15s ease;
	}
	.links a:hover {
		color: var(--accent-0);
		border-color: color-mix(in oklab, var(--accent-1) 45%, transparent);
		background: color-mix(in oklab, var(--accent-1) 7%, transparent);
	}
	.links .dossier-link {
		margin-left: auto;
	}
	.glance {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		border-bottom: 1px solid var(--line);
	}
	.glance div {
		padding: 0.42rem 0.8rem;
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.glance div:nth-child(2n) {
		border-right: 0;
	}
	.glance div:nth-last-child(-n + 2) {
		border-bottom: 0;
	}
	.glance-label {
		font-family: var(--font-mono);
		font-size: 0.700rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.glance strong {
		font-family: var(--font-display);
		font-size: 1.150rem;
		font-weight: 550;
		color: var(--text-1);
		line-height: 1.1;
	}
	.glance em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.700rem;
		color: var(--text-4);
	}
	.tabs {
		display: flex;
		flex-wrap: wrap;
		border-bottom: 1px solid var(--line);
		background: var(--surface-1);
	}
	.tabs button {
		display: inline-flex;
		align-items: baseline;
		gap: 0.24rem;
		border: 0;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--text-3);
		padding: 0.45rem 0.55rem;
		font-size: 0.780rem;
		white-space: nowrap;
	}
	.tabs button span {
		font-family: var(--font-mono);
		font-size: 0.700rem;
		color: var(--text-4);
	}
	.tabs button:hover {
		color: var(--text-1);
	}
	.tabs button.active {
		color: var(--text-1);
		border-bottom-color: var(--accent-1);
	}
	.tabs button.active span {
		color: var(--accent-1);
	}
	.body {
		flex: 1;
		overflow-y: auto;
		padding: 0.7rem 0.8rem 0.9rem;
	}
	.body :global(.locator) {
		margin-bottom: 0.75rem;
	}
	section {
		margin-bottom: 0.9rem;
	}
	h3 {
		margin: 0 0 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.676rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}
	.section-head h3 {
		margin: 0;
	}
	.highlight-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-3);
		padding: 0.18rem 0.38rem;
		font-family: var(--font-mono);
		font-size: 0.700rem;
		letter-spacing: 0.03em;
	}
	.highlight-toggle:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
	.highlight-toggle.active {
		color: var(--accent-0);
		border-color: color-mix(in oklab, var(--accent-1) 50%, transparent);
		background: color-mix(in oklab, var(--accent-1) 12%, var(--surface-1));
	}
	.orgs {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.3rem;
	}
	.org {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		padding: 0.3rem 0.4rem;
		background: var(--surface-1);
		border: 1px solid var(--line);
	}
	.org span {
		font-family: var(--font-mono);
		font-size: 0.702rem;
		color: var(--accent-0);
		letter-spacing: 0.06em;
		white-space: nowrap;
	}
	.org p {
		margin: 0;
		font-size: 0.754rem;
		color: var(--text-3);
		line-height: 1.35;
	}
	.neighbors {
		display: flex;
		flex-wrap: wrap;
		gap: 0.28rem;
		margin-top: 0.35rem;
	}
	.neighbors button {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-2);
		border-radius: 0.1rem;
		padding: 0.2rem 0.42rem 0.2rem 0.32rem;
		font-size: 0.754rem;
		transition: all 0.15s ease;
	}
	.neighbors button:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
		background: var(--surface-3);
	}
	.mini {
		width: 0.9rem;
		height: 0.64rem;
		background-size: cover;
	}
	.empty {
		margin: 0.3rem 0 0;
		font-size: 0.806rem;
		color: var(--text-4);
	}
	.note {
		margin: 0.35rem 0 0;
		font-size: 0.754rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	.snippet {
		margin-top: 0.4rem;
		padding: 0.65rem;
		border: 1px solid color-mix(in oklab, var(--water-0) 30%, transparent);
		background: color-mix(in oklab, var(--water-0) 7%, transparent);
	}
	.snippet h3 {
		margin: 0.3rem 0 0.32rem;
		font-family: var(--font-display);
		font-size: 1.170rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-transform: none;
		color: var(--text-1);
	}
	.snippet p {
		margin: 0 0 0.4rem;
		font-size: 0.819rem;
		line-height: 1.55;
		color: var(--text-2);
	}
	.snippet a {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.702rem;
		color: var(--water-1);
		text-decoration: none;
	}
	footer {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.42rem 0.8rem;
		border-top: 1px solid var(--line);
		font-family: var(--font-mono);
		font-size: 0.700rem;
		color: var(--text-4);
	}
	footer a {
		color: var(--text-3);
		text-decoration: none;
		white-space: nowrap;
	}
	footer a:hover {
		color: var(--text-1);
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
			height: 56vh;
			max-height: calc(100dvh - var(--header-h) - 8rem);
		}
		.card.dragging {
			transition: none;
		}
		.snap-peek {
			height: 30vh;
		}
		.snap-half {
			height: 56vh;
		}
		.snap-full {
			height: calc(100dvh - var(--header-h) - 8rem);
		}
		.snap-peek .body,
		.snap-peek .glance,
		.snap-peek .tabs {
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
		header {
			padding-top: 0.2rem;
		}
		.links {
			padding-top: 0.35rem;
			padding-bottom: 0.35rem;
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
		.glance strong {
			font-size: 1.144rem;
		}
		.links a {
			font-size: 0.650rem;
		}
	}
</style>
