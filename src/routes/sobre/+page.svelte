<script lang="ts">
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import {
		indicatorCoverage,
		indicatorKeys,
		indicatorMeta,
		manifest,
		retrievedAt
	} from '#lib/data/countries';
	import { historicalSource } from '#lib/data/historical';
	import { organizations } from '#lib/data/organizations';
	import { snippets } from '#lib/data/snippets';
	import { games } from '#lib/engines/game-engine/registry';
	import { locale } from '#lib/locale.svelte';
	import { indicatorName, indicatorUnit } from '#lib/i18n-data';
	import { historicalSourceEn } from '#lib/i18n-data';
	import { localizedGame } from '#lib/i18n-data-en';

	const isEn = $derived(locale.value === 'en');
	const tr = (pt: string, en: string) => (isEn ? en : pt);

	const sourceCopyEn: Record<string, { name?: string; license?: string; note?: string }> = {
		'https://www.naturalearthdata.com/downloads/110m-cultural-vectors/': {
			name: 'Natural Earth — Admin 0 Countries (1:50m)',
			license: 'Public domain',
			note: 'Generalised boundaries. Microstates may not be represented. Disputed borders do not express a political position.'
		},
		'https://github.com/mledoze/countries': {
			name: 'mledoze/countries (base for REST Countries)',
			note: 'Capital, currency, area, languages and neighbouring countries.'
		},
		'https://www.naturalearthdata.com/downloads/50m-physical-vectors/': {
			name: 'Natural Earth — Seas and oceans (1:50m)',
			license: 'Public domain',
			note: 'Portuguese names and label position calculated inside each marine polygon.'
		},
		'https://www.naturalearthdata.com/downloads/': {
			name: 'Natural Earth — Rivers, lakes and coastline',
			license: 'Public domain',
			note: 'Rivers and lakes at 1:110m; coastline at 1:50m. Shaded relief and 3D use a public digital model loaded on demand.'
		},
		'https://data.worldbank.org': {
			name: 'World Bank Open Data',
			note: 'Most recent series per country within the window. Historical Natural Earth codes are normalised; territories without a series appear as not available.'
		},
		'https://population.un.org/wpp/': {
			name: 'UN DESA — World Population Prospects 2024',
			license: 'CC BY 3.0 IGO',
			note: 'Total population and density (medium variant) only where the World Bank has no series, such as Taiwan, the Holy See and small islands.'
		}
	};

	const sources = [
		manifest.sources.boundaries,
		manifest.sources.facts,
		manifest.sources.indicators,
		manifest.sources.population,
		manifest.sources.physical,
		manifest.sources.marine
	].filter(Boolean);

	const extraSources = [
		{
			name: 'Natural Earth — cidades principais (1:110m)',
			url: 'https://www.naturalearthdata.com/downloads/110m-cultural-vectors/',
			license: 'Domínio público',
			note: 'Pontos populacionais para a camada de demografia. São pontos de cidade, não manchas urbanas.'
		},
		{
			name: 'Natural Earth — linha de costa (1:50m)',
			url: 'https://www.naturalearthdata.com/downloads/50m-physical-vectors/',
			license: 'Domínio público',
			note: 'Hierarquia costeira do mapa político e físico.'
		},
		{
			name: 'Natural Earth — unidades administrativas (1:10m)',
			url: 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/',
			license: 'Domínio público',
			note: 'Estados, províncias e distritos de primeiro nível exibidos ao selecionar um país na camada política. Geometria simplificada; o nível disponível varia por país.'
		},
		{
			name: 'Curadoria Mundivista — fatos complementares',
			url: 'https://www.britannica.com/place/Somaliland',
			license: 'Fontes citadas no dossiê',
			note: 'Capital, área, moeda e línguas da Somalilândia e moeda da Micronésia. Usado apenas quando mledoze/World Bank não cobrem o território; a origem aparece no metadado do dossiê.'
		},
		{
			name: 'AWS Terrain Tiles (Mapzen/Tilezen)',
			url: 'https://registry.opendata.aws/terrain-tiles/',
			license: 'Dados públicos; ver termos do projeto',
			note: 'Modelo digital de elevação (Terrarium) para relevo sombreado e modo 3D. Carregado sob demanda pela rede; não entra no build.'
		}
	];

	const extraSourcesEn = [
		{ name: 'Natural Earth — major cities (1:110m)', url: 'https://www.naturalearthdata.com/downloads/110m-cultural-vectors/', license: 'Public domain', note: 'Population points for the demography layer. City points, not urban footprints.' },
		{ name: 'Natural Earth — coastline (1:50m)', url: 'https://www.naturalearthdata.com/downloads/50m-physical-vectors/', license: 'Public domain', note: 'Coastline hierarchy for the political and physical maps.' },
		{ name: 'Natural Earth — administrative units (1:10m)', url: 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/', license: 'Public domain', note: 'First-level states, provinces and districts shown when a country is selected in the political layer. Simplified geometry; the available level varies by country.' },
		{ name: 'Mundivista curation — complementary facts', url: 'https://www.britannica.com/place/Somaliland', license: 'Sources cited in the dossier', note: 'Capital, area, currency and languages of Somaliland, and the currency of Micronesia. Used only where mledoze/World Bank do not cover the territory; the origin appears in the dossier metadata.' },
		{ name: 'AWS Terrain Tiles (Mapzen/Tilezen)', url: 'https://registry.opendata.aws/terrain-tiles/', license: 'Public data; see project terms', note: 'Digital elevation model (Terrarium) for shaded relief and 3D mode. Loaded on demand over the network; not part of the build.' }
	];

	function sourceFor(source: { name: string; url: string; license: string; note?: string | null }) {
		return isEn ? { ...source, ...(sourceCopyEn[source.url] ?? {}) } : source;
	}

	const formatLabelEn: Record<string, string> = {
		int: 'integer',
		dec1: '1 decimal',
		dec2: '2 decimals',
		usd: 'current US$',
		'usd-pc': 'US$ per person'
	};

	const limitsPt = [
		'Escala 1:50m do Natural Earth: fronteiras generalizadas. Microestados aparecem como pontos de capital, com área de clique ampliada.',
		'O relevo sombreado e o modo 3D usam tiles públicos de elevação carregados pela rede; sem conexão, o mapa permanece plano.',
		'Indicadores econômicos em dólares correntes não são comparáveis entre anos sem ajuste; por isso o ano aparece sempre.',
		'Blocos históricos e a linha do tempo usam os polígonos atuais. É uma aproximação didática, não um mapa histórico exato.',
		'“Independência” é um marco político discutível em vários casos; adotamos o ano indicado na fonte e registramos a ressalva.',
		'Composição de organizações como BRICS e OPEP muda com frequência; o recorte temporal está indicado em cada card.',
		'Séries do Banco Mundial podem ter lacunas e revisões. O app não interpola valores.'
	];
	const limitsEn = [
		'Natural Earth 1:50m scale: generalised borders. Microstates appear as capital points with a larger click area.',
		'Shaded relief and 3D mode use public elevation tiles loaded over the network; without a connection the map stays flat.',
		'Economic indicators in current dollars are not comparable across years without adjustment; that is why the year is always shown.',
		'Historical blocs and the timeline use current polygons. This is a teaching approximation, not an exact historical map.',
		'“Independence” is a debatable political milestone in several cases; we adopt the year stated by the source and record the caveat.',
		'The composition of organisations such as BRICS and OPEC changes frequently; the snapshot is shown on each card.',
		'World Bank series may have gaps and revisions. The app does not interpolate values.'
	];

	const formatLabel: Record<string, string> = {
		int: 'inteiro',
		dec1: '1 decimal',
		dec2: '2 decimais',
		usd: 'US$ corrente',
		'usd-pc': 'US$ por pessoa'
	};
</script>

<svelte:head>
	<title>{tr('Fontes e métodos', 'Sources and methods')} — Mundivista</title>
	<meta
		name="description"
		content={tr('De onde vêm os dados da Mundivista, como os indicadores são tratados, licenças e limitações do mapa.', 'Where Mundivista data comes from, how indicators are handled, and the map’s licences and limitations.')}
	/>
</svelte:head>

<TopBar />

<main id="conteudo">
	<header class="hero">
		<div>
			<span class="eyebrow">{tr('Transparência · método', 'Transparency · method')}</span>
			<h1>{tr('Fontes e métodos', 'Sources and methods')}</h1>
			<p class="lede">
				{tr('A plataforma não estima, não completa lacunas e não mistura períodos sem avisar. Cada número na interface carrega ano de referência e origem.', 'The platform does not estimate, fill gaps or mix periods without warning. Every number in the interface carries its reference year and origin.')}
			</p>
		</div>
		<div class="stamp">
			<span>{tr('Extração', 'Retrieved')}</span>
			<strong>{retrievedAt}</strong>
			<span>{indicatorKeys.length} {tr('indicadores', 'indicators')} · {organizations.length} {tr('organizações', 'organisations')}</span>
		</div>
	</header>

	<section>
		<header class="section-head">
			<span class="index">01</span>
			<h2>{tr('Princípios', 'Principles')}</h2>
		</header>
		<div class="principles">
			<article>
				<span>01</span>
				<h3>{tr('Nada de dado inventado', 'No invented data')}</h3>
				<p>{tr('Indicadores ausentes aparecem como “não disponível”. Nunca preenchemos lacunas com estimativas próprias.', 'Missing indicators appear as “not available”. We never fill gaps with our own estimates.')}</p>
			</article>
			<article>
				<span>02</span>
				<h3>{tr('Ano sempre visível', 'Year always visible')}</h3>
				<p>{tr('Usamos a observação mais recente de cada país dentro da janela 2016–2025. O ano acompanha o valor.', 'We use the most recent observation for each country within 2016–2025. The year accompanies the value.')}</p>
			</article>
			<article>
				<span>03</span>
				<h3>{tr('Fronteiras com contexto', 'Borders with context')}</h3>
				<p>{tr('O recorte é o do Natural Earth. Territórios com estatuto disputado recebem hachura e nota, sem atribuição de soberania.', 'The boundaries are Natural Earth’s. Territories with disputed status receive hatching and a note, without assigning sovereignty.')}</p>
			</article>
			<article>
				<span>04</span>
				<h3>{tr('Licenças respeitadas', 'Licences respected')}</h3>
				<p>{tr('Cada base tem licença e link de origem. Uso comercial futuro deve revisar as condições de cada fonte.', 'Each dataset carries a licence and source link. Future commercial use should review each source’s terms.')}</p>
			</article>
		</div>
	</section>

	<section>
		<header class="section-head">
			<span class="index">02</span>
			<h2>{tr('Bases usadas', 'Datasets')}</h2>
		</header>
		<div class="source-list">
			{#each sources as source (source.url)}
				{@const copy = sourceFor(source)}
				<a href={copy.url} target="_blank" rel="noopener noreferrer">
					<div>
						<strong>{copy.name}</strong>
						<p>{copy.note ?? ''}</p>
					</div>
					<span class="license">{copy.license}</span>
					<Icon name="external" size={13} />
				</a>
			{/each}
			{#each isEn ? extraSourcesEn : extraSources as source (source.url)}
				<a href={source.url} target="_blank" rel="noopener noreferrer">
					<div>
						<strong>{source.name}</strong>
						<p>{source.note}</p>
					</div>
					<span class="license">{source.license}</span>
					<Icon name="external" size={13} />
				</a>
			{/each}
			<a href={(isEn ? historicalSourceEn : historicalSource).url} target="_blank" rel="noopener noreferrer">
				<div>
					<strong>{(isEn ? historicalSourceEn : historicalSource).name}</strong>
					<p>{(isEn ? historicalSourceEn : historicalSource).note}</p>
				</div>
				<span class="license">{tr('Uso editorial', 'Editorial use')}</span>
				<Icon name="external" size={13} />
			</a>
		</div>
	</section>

	<section>
		<header class="section-head">
			<span class="index">03</span>
			<h2>{tr('Indicadores', 'Indicators')}</h2>
		</header>
		<p class="section-note">
			{tr('Cobertura = países com polígono no mapa que têm valor para o indicador. A série é consultada de 2016 a 2025; usamos a observação mais recente de cada país. A série completa alimenta os gráficos dos dossiês.', 'Coverage = countries with a map polygon that have a value for the indicator. The series is queried from 2016 to 2025; we use the most recent observation for each country. The full series feeds the dossier charts.')}
		</p>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>{tr('Indicador', 'Indicator')}</th>
						<th>{tr('Código', 'Code')}</th>
						<th>{tr('Unidade', 'Unit')}</th>
						<th>{tr('Formato', 'Format')}</th>
						<th>{tr('Cobertura', 'Coverage')}</th>
						<th>{tr('Fonte', 'Source')}</th>
					</tr>
				</thead>
				<tbody>
					{#each indicatorKeys as key (key)}
						<tr>
							<td>{indicatorName(key, locale.value)}</td>
							<td class="mono">{indicatorMeta[key].code}</td>
							<td>{indicatorUnit(key, locale.value)}</td>
							<td>{isEn ? formatLabelEn[indicatorMeta[key].format] ?? indicatorMeta[key].format : formatLabel[indicatorMeta[key].format] ?? indicatorMeta[key].format}</td>
							<td class="num">{indicatorCoverage[key]}</td>
							<td>
								<a href={indicatorMeta[key].sourceUrl} target="_blank" rel="noopener noreferrer">
									{tr('Banco Mundial', 'World Bank')} <Icon name="external" size={10} />
								</a>
								{#if indicatorMeta[key].fallback}
									<span class="alt-source">
										+ <a href={indicatorMeta[key].fallback!.url} target="_blank" rel="noopener noreferrer">
											{tr('UN WPP 2024', 'UN WPP 2024')}
										</a>
									</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="footnote">
			{indicatorKeys.length} {tr('séries do World Bank Open Data (CC BY 4.0). Indicadores de governança usam os Worldwide Governance Indicators (WGI), também publicados pelo Banco Mundial. População e densidade de países fora da cobertura do Banco usam a UN WPP 2024 (CC BY 3.0 IGO); a fonte alternativa aparece no dossiê. Dívida pública tem cobertura menor e é exibida apenas quando há observação.', 'series from World Bank Open Data (CC BY 4.0). Governance indicators use the Worldwide Governance Indicators (WGI), also published by the World Bank. Population and density for countries outside World Bank coverage use UN WPP 2024 (CC BY 3.0 IGO); the alternative source is shown in the dossier. Public debt has lower coverage and is shown only when an observation exists.')}
		</p>
	</section>

	<section>
		<header class="section-head">
			<span class="index">04</span>
			<h2>{tr('Pipeline reproduzível', 'Reproducible pipeline')}</h2>
		</header>
		<div class="pipeline">
			<div>
				<span class="eyebrow">{tr('Gerar', 'Build')}</span>
				<code>npm run data:build</code>
				<p>{tr('Usa o cache local de Natural Earth, mledoze e World Bank.', 'Uses the local Natural Earth, mledoze and World Bank cache.')}</p>
			</div>
			<div>
				<span class="eyebrow">{tr('Atualizar', 'Refresh')}</span>
				<code>npm run data:refresh</code>
				<p>{tr('Baixa tudo de novo e reescreve', 'Downloads everything again and rewrites')} <code>src/lib/data/generated/</code>.</p>
			</div>
			<div>
				<span class="eyebrow">{tr('Validar', 'Validate')}</span>
				<code>npm test && npm run check</code>
				<p>{tr('Testes cobrem motores, integridade dos dados e jogos.', 'Tests cover engines, data integrity and games.')}</p>
			</div>
		</div>
	</section>

	<section>
		<header class="section-head">
			<span class="index">05</span>
			<h2>{tr('Limitações conhecidas', 'Known limitations')}</h2>
		</header>
		<ul class="limits">
			{#each isEn ? limitsEn : limitsPt as item}
				<li>{item}</li>
			{/each}
		</ul>
	</section>

	<section>
		<header class="section-head">
			<span class="index">06</span>
			<h2>{tr('Conteúdo editorial e jogos', 'Editorial content and games')}</h2>
		</header>
		<p class="section-note">
			{organizations.length} {tr('organizações', 'organisations')}, {snippets.length} {tr('leituras curtas', 'quick reads')} {tr('e', 'and')} {games.length} {tr('jogos', 'games')}. {tr('Cada explicação de rodada cita a fonte usada na validação. O motor de jogos não importa o mapa: recebe rodadas, valida respostas e devolve pontuação.', 'Each round explanation cites the source used in validation. The game engine does not import the map: it receives rounds, validates answers and returns a score.')}
		</p>
		<div class="editorial-grid">
			<a href="/play">
				<Icon name="gamepad" size={18} />
				<strong>{tr('Jogos', 'Games')}</strong>
				<span>{tr('Regras, fontes e recordes locais', 'Rules, sources and local records')}</span>
			</a>
			<a href="/country/BRA">
				<Icon name="dossier" size={18} />
				<strong>{tr('Dossiês', 'Dossiers')}</strong>
				<span>{tr('Exemplo: Brasil, com séries e comparações', 'Example: Brazil, with series and comparisons')}</span>
			</a>
			<a href="/explore">
				<Icon name="globe" size={18} />
				<strong>{tr('Atlas', 'Atlas')}</strong>
				<span>{tr('Seis camadas e metadados no mapa', 'Six layers and metadata on the map')}</span>
			</a>
		</div>
	</section>

	<footer>
		<a href="/explore">← {tr('Voltar ao mapa', 'Back to the map')}</a>
		<span>{retrievedAt}</span>
		<a href="/play">{tr('Jogar', 'Play')} →</a>
	</footer>
</main>

<style>
	main {
		min-height: 100dvh;
		padding: calc(var(--header-h) + 2.2rem) clamp(1rem, 5vw, 4rem) 3rem;
		max-width: 80rem;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}
	.hero {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--line-strong);
	}
	h1 {
		margin: 0.5rem 0 0.7rem;
		font-family: var(--font-display);
		font-size: clamp(2.6rem, 6vw, 4.4rem);
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 0.98;
	}
	.lede {
		max-width: 42rem;
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.65;
		color: var(--text-3);
	}
	.stamp {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding-left: 1rem;
		border-left: 1px solid var(--line);
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-4);
		white-space: nowrap;
	}
	.stamp strong {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 550;
		letter-spacing: 0;
		color: var(--text-1);
	}
	section {
		margin-top: 2.3rem;
	}
	.section-head {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
		padding-bottom: 0.45rem;
		margin-bottom: 0.85rem;
		border-bottom: 1px solid var(--line-strong);
	}
	.index {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--accent-1);
	}
	.section-head h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 600;
	}
	.principles {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.7rem;
	}
	.principles article {
		padding: 0.8rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
	}
	.principles span {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--accent-1);
	}
	.principles h3 {
		margin: 0.4rem 0 0.3rem;
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 600;
	}
	.principles p {
		margin: 0;
		font-size: 0.64rem;
		line-height: 1.55;
		color: var(--text-3);
	}
	.source-list {
		display: flex;
		flex-direction: column;
	}
	.source-list a {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.65rem 0.2rem;
		border-bottom: 1px solid var(--line);
		text-decoration: none;
		color: inherit;
		transition: background 0.15s ease, padding 0.15s ease;
	}
	.source-list a:hover {
		background: var(--surface-1);
		padding-left: 0.5rem;
	}
	.source-list div {
		flex: 1;
	}
	.source-list strong {
		font-size: 0.72rem;
		font-weight: 550;
	}
	.source-list p {
		margin: 0.18rem 0 0;
		font-size: 0.6rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	.license {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.05em;
		color: var(--text-3);
		border: 1px solid var(--line);
		padding: 0.12rem 0.32rem;
		white-space: nowrap;
	}
	.section-note {
		max-width: 52rem;
		margin: 0 0 0.9rem;
		font-size: 0.7rem;
		line-height: 1.6;
		color: var(--text-3);
	}
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--line);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.64rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.42rem 0.6rem;
		border-bottom: 1px solid var(--line);
		vertical-align: top;
	}
	th {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-4);
		font-weight: 500;
		background: var(--surface-1);
		white-space: nowrap;
	}
	td {
		color: var(--text-2);
	}
	td.mono {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--text-3);
	}
	td.num {
		font-family: var(--font-mono);
		color: var(--text-1);
	}
	td a {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.64rem;
		color: var(--accent-0);
		text-decoration: none;
	}
	.alt-source {
		display: block;
		font-size: 0.6rem;
		color: var(--text-4);
	}
	.footnote {
		margin: 0.6rem 0 0;
		font-size: 0.64rem;
		line-height: 1.55;
		color: var(--text-4);
	}
	.pipeline {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.7rem;
	}
	.pipeline div {
		padding: 0.7rem;
		border: 1px solid var(--line);
	}
	.pipeline code {
		display: block;
		margin-top: 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--accent-0);
	}
	.pipeline p {
		margin: 0.3rem 0 0;
		font-size: 0.64rem;
		line-height: 1.5;
		color: var(--text-4);
	}
	.limits {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		max-width: 58rem;
	}
	.limits li {
		position: relative;
		padding-left: 1rem;
		font-size: 0.66rem;
		line-height: 1.6;
		color: var(--text-3);
	}
	.limits li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55rem;
		width: 4px;
		height: 4px;
		background: var(--accent-1);
	}
	.editorial-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.7rem;
	}
	.editorial-grid a {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.8rem;
		border: 1px solid var(--line);
		text-decoration: none;
		color: inherit;
	}
	.editorial-grid a:hover {
		background: var(--surface-1);
	}
	.editorial-grid :global(svg) {
		color: var(--accent-0);
	}
	.editorial-grid strong {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 600;
	}
	.editorial-grid span {
		font-size: 0.64rem;
		color: var(--text-4);
	}
	footer {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 2.6rem;
		padding-top: 0.9rem;
		border-top: 1px solid var(--line-strong);
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--text-4);
	}
	footer a {
		color: var(--text-3);
		text-decoration: none;
	}
	footer a:hover {
		color: var(--text-1);
	}
	@media (max-width: 900px) {
		.principles {
			grid-template-columns: 1fr 1fr;
		}
		.pipeline,
		.editorial-grid {
			grid-template-columns: 1fr;
		}
		.hero {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		.stamp {
			border-left: 0;
			padding-left: 0;
		}
	}
	@media (max-width: 600px) {
		main {
			padding-left: 1rem;
			padding-right: 1rem;
		}
		.principles {
			grid-template-columns: 1fr;
		}
		footer {
			flex-direction: column;
		}
	}
</style>
