<script lang="ts">
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { countries } from '#lib/data/countries';
	import { formatCompact } from '#lib/format';
	import { locale } from '#lib/locale.svelte';
	import { t } from '#lib/i18n';
	import { localizeContinent, localizeSubregion } from '#lib/i18n-data';

	const text = $derived(locale.value);
	const isEn = $derived(text === 'en');
	const tr = (pt: string, en: string) => (isEn ? en : pt);
	let query = $state('');
	let continent = $state('Todos');

	const continents = $derived(['Todos', ...new Set(countries.map((c) => c.continent).filter((continent): continent is string => Boolean(continent) && continent !== 'Oceano aberto'))]);

	const list = $derived.by(() => {
		const q = query
			.trim()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
		return countries
			.filter((country) => continent === 'Todos' || country.continent === continent)
			.filter(
				(country) =>
					!q ||
					country.name
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.toLowerCase()
						.includes(q) ||
					country.nameEn.toLowerCase().includes(q) ||
					country.code.toLowerCase().includes(q)
			)
			.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
	});
</script>

<svelte:head>
	<title>{tr('Países', 'Countries')} — Mundivista</title>
	<meta name="description" content={tr('Índice de países e territórios do atlas, com dossiês e acesso ao mapa.', 'Index of countries and territories in the atlas, with dossiers and map access.')} />
</svelte:head>

<TopBar />

<main id="conteudo">
	<header class="hero">
		<div>
			<span class="eyebrow">{tr('Atlas · índice', 'Atlas · index')}</span>
			<h1>{tr('Países', 'Countries')}</h1>
			<p>{tr('Encontre um território, abra o dossiê ou veja no mapa.', 'Find a territory, open its dossier or view it on the map.')}</p>
		</div>
		<div class="count">
			<strong>{countries.length}</strong>
			<span>{tr('territórios', 'territories')}</span>
		</div>
	</header>

	<div class="tools">
		<label class="search">
			<Icon name="search" size={16} />
			<input bind:value={query} type="search" placeholder={tr('Buscar país ou código…', 'Search country or code…')} aria-label={tr('Buscar país', 'Search country')} />
		</label>
		<div class="filters" role="group" aria-label={tr('Filtrar por continente', 'Filter by continent')}>
			{#each continents as item (item)}
				<button type="button" class:active={continent === item} onclick={() => (continent = item)}>
					{item === 'Todos' ? tr('Todos', 'All') : localizeContinent(item, text)}
				</button>
			{/each}
		</div>
	</div>

	<p class="result-count">{list.length} {tr('resultados', 'results')}</p>

	<ul class="countries">
		{#each list as country (country.code)}
			<li>
				<a class="country" href={`/country/${country.code}`}>
					<span class="flag">
						{#if country.iso2}
							<span class={`fi fi-${country.iso2}`}></span>
						{:else}
							<span class="fallback">{country.code}</span>
						{/if}
					</span>
					<span class="identity">
						<strong>{isEn ? country.nameEn : country.name}</strong>
						<span>{localizeContinent(country.continent, text) || '—'}{country.subregion && country.subregion !== country.continent ? ` · ${localizeSubregion(country.subregion, text)}` : ''}</span>
					</span>
					<span class="pop">
						<em>{tr('População', 'Population')}</em>
						<span>{country.indicators.population ? formatCompact(country.indicators.population.v) : '—'}</span>
					</span>
					<span class="map-link" title={tr('Ver no mapa', 'View on map')}>
						<Icon name="globe" size={15} />
					</span>
				</a>
			</li>
		{:else}
			<li class="empty">{tr('Nenhum país encontrado para', 'No country found for')} “{query}”.</li>
		{/each}
	</ul>
</main>

<style>
	main {
		min-height: 100dvh;
		max-width: 76rem;
		margin: 0 auto;
		padding: calc(var(--header-h) + 2rem) clamp(1rem, 4vw, 3rem) 3rem;
		position: relative;
		z-index: 1;
	}
	.hero {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
		padding-bottom: 1.2rem;
		border-bottom: 1px solid var(--line-strong);
	}
	.eyebrow {
		font-size: 0.66rem;
	}
	h1 {
		margin: 0.3rem 0 0.2rem;
		font-family: var(--font-display);
		font-size: clamp(3rem, 7vw, 5.5rem);
		font-weight: 700;
		line-height: 0.9;
		letter-spacing: -0.055em;
		text-transform: uppercase;
	}
	.hero p {
		margin: 0;
		font-size: 1rem;
		color: var(--text-3);
	}
	.count {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		font-family: var(--font-mono);
		color: var(--text-4);
	}
	.count strong {
		font-family: var(--font-display);
		font-size: 2.6rem;
		font-weight: 700;
		line-height: 1;
		color: var(--text-1);
	}
	.count span {
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.tools {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin: 1rem 0 0.5rem;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 20rem;
		border: 1px solid var(--line);
		border-radius: 0.2rem;
		background: var(--surface-1);
		padding: 0 0.65rem;
		color: var(--text-3);
	}
	.search input {
		width: 100%;
		height: 3rem;
		border: 0;
		background: transparent;
		color: var(--text-1);
		font-size: 0.96rem;
		outline: none;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.filters button {
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--surface-1);
		color: var(--text-3);
		padding: 0.55rem 0.85rem;
		font-size: 0.84rem;
		font-weight: 600;
	}
	.filters button:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
	.filters button.active {
		color: var(--accent-0);
		border-color: color-mix(in oklab, var(--accent-1) 55%, transparent);
		background: color-mix(in oklab, var(--accent-1) 12%, var(--surface-2));
	}
	.result-count {
		margin: 0.2rem 0 0.7rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-4);
	}
	.countries {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	.country {
		display: grid;
		grid-template-columns: 3rem 1fr auto 2.4rem;
		align-items: center;
		gap: 0.8rem;
		padding: 0.8rem 0.85rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface-1);
		color: inherit;
		text-decoration: none;
		box-shadow: 0 1px 0 color-mix(in oklab, #fff 40%, transparent) inset;
		transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
	}
	.country:hover {
		border-color: var(--line-strong);
		background: var(--surface-2);
		transform: translateY(-1px);
	}
	.flag :global(.fi),
	.flag {
		display: block;
		width: 2.8rem;
		height: 1.9rem;
		background-size: cover;
		border: 1px solid var(--line-strong);
	}
	.fallback {
		display: grid;
		place-items: center;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--text-4);
	}
	.identity {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.identity strong {
		font-size: 1rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.identity span {
		font-size: 0.78rem;
		color: var(--text-4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.pop {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		font-family: var(--font-mono);
		font-size: 0.82rem;
		color: var(--text-2);
	}
	.pop em {
		font-style: normal;
		font-size: 0.64rem;
		color: var(--text-4);
	}
	.map-link {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border: 1px solid var(--line);
		border-radius: 0.55rem;
		color: var(--text-3);
	}
	.country:hover .map-link {
		color: var(--accent-0);
		border-color: var(--line-strong);
	}
	.empty {
		grid-column: 1 / -1;
		padding: 2rem 0;
		font-size: 0.9rem;
		color: var(--text-4);
	}
	@media (max-width: 800px) {
		.countries {
			grid-template-columns: 1fr;
		}
		.tools {
			flex-direction: column;
		}
		.search {
			width: 100%;
			min-width: 0;
		}
		.hero {
			align-items: flex-start;
		}
		.count {
			display: none;
		}
	}
</style>
