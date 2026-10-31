<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import StatRow from './StatRow.svelte';
	import { capitalInPortuguese } from '#lib/data/capitals-pt';
	import { indicatorMeta, rankOf, retrievedAt, getCountry } from '#lib/data/countries';
	import { getHistorical } from '#lib/data/historical';
	import { organizationsForCountry } from '#lib/data/organizations';
	import { snippetsByCountry } from '#lib/data/snippets';
	import { formatArea, formatIndicatorValue } from '#lib/format';
	import type { Country, IndicatorKey } from '#lib/types';
	import type { LayerConfig } from '#lib/configurations/map-layers';

	interface Props {
		country: Country;
		layer: LayerConfig;
		onclose: () => void;
		onnavigate: (code: string) => void;
	}

	let { country, layer, onclose, onnavigate }: Props = $props();

	const capital = $derived(capitalInPortuguese(country.code, country.capital));
	const historical = $derived(getHistorical(country.code));
	const orgs = $derived(organizationsForCountry(country.code));
	const currentOrgs = $derived(orgs.filter((o) => o.era === 'current'));
	const historicalOrgs = $derived(orgs.filter((o) => o.era === 'historical'));
	const neighbors = $derived(country.borders.map((b) => getCountry(b)).filter(Boolean) as Country[]);
	const snippet = $derived(snippetsByCountry.get(country.code)?.[0] ?? null);
	const accent = $derived(layer.palette?.[layer.palette.length - 1] ?? 'var(--color-gold-400)');

	const indicatorRows = $derived.by(() => {
		const keys: IndicatorKey[] =
			layer.id === 'population'
				? ['population', 'popDensity', 'popGrowth', 'lifeExpectancy', 'urbanShare', 'fertility']
				: layer.id === 'economy'
					? ['gdp', 'gdpPerCapita', 'gdpGrowth', 'exportsShare', 'importsShare', 'industryShare', 'agriShare', 'researchShare']
					: layer.id === 'physical'
						? ['forestShare', 'renewableShare', 'electricityAccess', 'co2PerCapita']
						: [];
		return keys.map((key) => {
			const value = country.indicators[key];
			const rank = rankOf(country.code, key);
			return {
				key,
				label: indicatorMeta[key].name,
				value: value ? formatIndicatorValue(key, value) : 'Não disponível',
				year: value?.y ?? null,
				percentile: rank?.percentile ?? null
			};
		});
	});

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
</script>

<aside class="card animate-sheet-in" aria-label={`Informações sobre ${country.name}`}>
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
		<button class="close" type="button" onclick={onclose} aria-label="Fechar card">
			<Icon name="close" size={16} />
		</button>
	</header>

	<div class="meta">
		<span class="pill">{layer.label}</span>
		{#if country.continent}<span>{country.continent}</span>{/if}
		{#if country.code}<span class="mono">{country.code}</span>{/if}
	</div>

	<div class="external">
		<a href={wikipediaUrl} target="_blank" rel="noopener noreferrer">
			<Icon name="book" size={12} /> Wikipédia
		</a>
		<a href={britannicaUrl} target="_blank" rel="noopener noreferrer">
			<Icon name="external" size={12} /> Britannica
		</a>
		<span class="external-hint">abre em nova aba</span>
	</div>

	<div class="body">
		{#each layer.sections as section (section)}
			{#if section === 'identity'}
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
					<StatRow
						label="Membro da ONU"
						value={country.unMember === null ? 'Não disponível' : country.unMember ? 'Sim' : 'Não'}
					/>
					{#if historical?.independence}
						<StatRow label="Independência" value={String(historical.independence)} note={historical.note} />
					{/if}
				</section>
			{:else if section === 'demography'}
				<section>
					<h3>Demografia</h3>
					{#each indicatorRows as row (row.key)}
						<StatRow
							label={row.label}
							value={row.value}
							year={row.year}
							percentile={row.percentile}
							accent={accent}
						/>
					{/each}
				</section>
			{:else if section === 'economy'}
				<section>
					<h3>Economia</h3>
					{#each indicatorRows as row (row.key)}
						<StatRow
							label={row.label}
							value={row.value}
							year={row.year}
							percentile={row.percentile}
							accent={accent}
						/>
					{/each}
				</section>
			{:else if section === 'environment'}
				<section>
					<h3>Meio físico</h3>
					{#each indicatorRows as row (row.key)}
						<StatRow
							label={row.label}
							value={row.value}
							year={row.year}
							percentile={row.percentile}
							accent={accent}
						/>
					{/each}
					<StatRow label="Área" value={country.areaKm2 ? formatArea(country.areaKm2) : 'Não disponível'} />
				</section>
			{:else if section === 'geopolitics'}
				<section>
					<h3>Geopolítica</h3>
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
			{:else if section === 'history'}
				<section>
					<h3>História</h3>
					{#if historical?.independence}
						<StatRow
							label="Marco de independência"
							value={String(historical.independence)}
							note={historical.independenceFrom ? `De: ${historical.independenceFrom}` : historical.note}
						/>
					{/if}
					{#if formerNames}
						<StatRow label="Nomes e territórios anteriores" value={formerNames} />
					{/if}
					{#if historicalOrgs.length}
						<div class="orgs">
							{#each historicalOrgs as org (org.id)}
								<div class="org">
									<span>{org.short}</span>
									<p>{org.name} · {org.founded}–{org.dissolved ?? 'hoje'}</p>
								</div>
							{/each}
						</div>
					{/if}
					{#if !historical && !historicalOrgs.length}
						<p class="empty">Sem registro histórico curado para este país.</p>
					{/if}
					{#if historical?.note && !historical.independence}
						<p class="note">{historical.note}</p>
					{/if}
					{#if historicalOrgs.length}
						<p class="note">Federações históricas são mostradas com as fronteiras atuais; a correspondência é aproximada.</p>
					{/if}
				</section>
			{:else if section === 'neighbors'}
				<section>
					<h3>Países vizinhos</h3>
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
			{/if}
		{/each}

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
	</div>

	<footer>
		<span>Dados: {retrievedAt}</span>
		<a href="/sobre">Fontes e métodos</a>
	</footer>
</aside>

<style>
	.card {
		background: #0b1119;
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-shadow: 0 24px 70px -20px rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(18px);
		position: fixed;
		top: calc(var(--header-h) + 0.85rem);
		right: 0.9rem;
		bottom: 0.9rem;
		z-index: 35;
		width: 23.5rem;
		max-width: calc(100vw - 1.8rem);
		display: flex;
		flex-direction: column;
		border-radius: 0.9rem;
		overflow: hidden;
	}
	header {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		padding: 0.95rem 0.95rem 0.6rem;
	}
	.flag-wrap {
		flex-shrink: 0;
	}
	.flag {
		display: block;
		width: 2.2rem;
		height: 1.55rem;
		border-radius: 0.18rem;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background-size: cover;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
	}
	.flag-fallback {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 1.55rem;
		border-radius: 0.18rem;
		border: 1px solid rgba(255, 255, 255, 0.14);
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-mist-400);
	}
	.titles {
		min-width: 0;
		flex: 1;
	}
	h2 {
		margin: 0;
		font-size: 1.02rem;
		font-weight: 600;
		line-height: 1.2;
	}
	.titles p {
		margin: 0.2rem 0 0;
		font-size: 0.65rem;
		color: var(--color-mist-400);
	}
	.close {
		border: 0;
		background: rgba(255, 255, 255, 0.04);
		color: var(--color-mist-400);
		border-radius: 0.35rem;
		padding: 0.3rem;
		display: grid;
		place-items: center;
	}
	.close:hover {
		color: var(--color-mist-100);
		background: rgba(255, 255, 255, 0.09);
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0 0.95rem 0.7rem;
		font-size: 0.62rem;
		color: var(--color-mist-400);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}
	.pill {
		border: 1px solid color-mix(in oklab, var(--color-gold-400) 40%, transparent);
		color: var(--color-gold-300);
		background: color-mix(in oklab, var(--color-gold-400) 9%, transparent);
		border-radius: 999px;
		padding: 0.12rem 0.42rem;
		font-family: var(--font-mono);
		font-size: 0.52rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.mono {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.55rem;
		letter-spacing: 0.08em;
	}
	.external {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0 0.95rem 0.55rem;
	}
	.external a {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		border: 1px solid rgba(255, 255, 255, 0.09);
		background: rgba(255, 255, 255, 0.025);
		color: var(--color-mist-300);
		border-radius: 0.35rem;
		padding: 0.24rem 0.45rem;
		font-size: 0.58rem;
		text-decoration: none;
		transition: all 0.16s ease;
	}
	.external a:hover {
		color: var(--color-gold-300);
		border-color: color-mix(in oklab, var(--color-gold-400) 35%, transparent);
		background: color-mix(in oklab, var(--color-gold-400) 7%, transparent);
	}
	.external-hint {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.48rem;
		color: var(--color-mist-500);
	}
	.body {
		flex: 1;
		overflow-y: auto;
		padding: 0.85rem 0.95rem 1rem;
	}
	section {
		margin-bottom: 1rem;
	}
	h3 {
		margin: 0 0 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.56rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-mist-400);
	}
	.orgs {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: 0.35rem;
	}
	.org {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.35rem 0.45rem;
		border-radius: 0.35rem;
		background: rgba(255, 255, 255, 0.025);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}
	.org span {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		color: var(--color-gold-300);
		letter-spacing: 0.06em;
		white-space: nowrap;
	}
	.org p {
		margin: 0;
		font-size: 0.6rem;
		color: var(--color-mist-400);
		line-height: 1.35;
	}
	.neighbors {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin-top: 0.4rem;
	}
	.neighbors button {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		border: 1px solid rgba(255, 255, 255, 0.09);
		background: rgba(255, 255, 255, 0.025);
		color: var(--color-mist-300);
		border-radius: 999px;
		padding: 0.22rem 0.5rem 0.22rem 0.35rem;
		font-size: 0.6rem;
		transition: all 0.16s ease;
	}
	.neighbors button:hover {
		color: var(--color-mist-100);
		border-color: rgba(255, 255, 255, 0.22);
		background: rgba(255, 255, 255, 0.06);
	}
	.mini {
		width: 0.95rem;
		height: 0.68rem;
		border-radius: 0.1rem;
		background-size: cover;
	}
	.empty {
		margin: 0.35rem 0 0;
		font-size: 0.65rem;
		color: var(--color-mist-500);
	}
	.note {
		margin: 0.4rem 0 0;
		font-size: 0.6rem;
		line-height: 1.45;
		color: var(--color-mist-500);
	}
	.snippet {
		margin-top: 0.5rem;
		padding: 0.7rem;
		border-radius: 0.55rem;
		border: 1px solid color-mix(in oklab, var(--color-signal-400) 22%, transparent);
		background: color-mix(in oklab, var(--color-signal-400) 6%, transparent);
	}
	.snippet h3 {
		margin: 0.3rem 0 0.35rem;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-transform: none;
		color: var(--color-mist-100);
	}
	.snippet p {
		margin: 0 0 0.45rem;
		font-size: 0.65rem;
		line-height: 1.55;
		color: var(--color-mist-300);
	}
	.snippet a {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.56rem;
		color: var(--color-signal-300);
		text-decoration: none;
	}
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.55rem 0.95rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--color-mist-500);
	}
	footer a {
		color: var(--color-mist-400);
		text-decoration: none;
	}
	footer a:hover {
		color: var(--color-mist-100);
	}
	@media (max-width: 860px) {
		.card {
			top: auto;
			left: 0.5rem;
			right: 0.5rem;
			bottom: calc(6.6rem + env(safe-area-inset-bottom));
			width: auto;
			max-height: 56vh;
		}
		.body {
			padding-top: 0.6rem;
		}
	}
</style>
