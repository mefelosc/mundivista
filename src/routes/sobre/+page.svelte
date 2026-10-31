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

	const sources = [
		manifest.sources.boundaries,
		manifest.sources.facts,
		manifest.sources.indicators,
		manifest.sources.physical
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
			name: 'AWS Terrain Tiles (Mapzen/Tilezen)',
			url: 'https://registry.opendata.aws/terrain-tiles/',
			license: 'Dados públicos; ver termos do projeto',
			note: 'Modelo digital de elevação (Terrarium) para relevo sombreado e modo 3D. Carregado sob demanda pela rede; não entra no build.'
		}
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
	<title>Fontes e métodos — Mundivista</title>
	<meta
		name="description"
		content="De onde vêm os dados da Mundivista, como os indicadores são tratados, licenças e limitações do mapa."
	/>
</svelte:head>

<TopBar />

<main id="conteudo">
	<header class="hero">
		<div>
			<span class="eyebrow">Transparência · método</span>
			<h1>Fontes e métodos</h1>
			<p class="lede">
				A plataforma não estima, não completa lacunas e não mistura períodos sem avisar.
				Cada número na interface carrega ano de referência e origem.
			</p>
		</div>
		<div class="stamp">
			<span>Extração</span>
			<strong>{retrievedAt}</strong>
			<span>{indicatorKeys.length} indicadores · {organizations.length} organizações</span>
		</div>
	</header>

	<section>
		<header class="section-head">
			<span class="index">01</span>
			<h2>Princípios</h2>
		</header>
		<div class="principles">
			<article>
				<span>01</span>
				<h3>Nada de dado inventado</h3>
				<p>Indicadores ausentes aparecem como “não disponível”. Nunca preenchemos lacunas com estimativas próprias.</p>
			</article>
			<article>
				<span>02</span>
				<h3>Ano sempre visível</h3>
				<p>Usamos a observação mais recente de cada país dentro da janela 2016–2025. O ano acompanha o valor.</p>
			</article>
			<article>
				<span>03</span>
				<h3>Fronteiras com contexto</h3>
				<p>O recorte é o do Natural Earth. Territórios com estatuto disputado recebem hachura e nota, sem atribuição de soberania.</p>
			</article>
			<article>
				<span>04</span>
				<h3>Licenças respeitadas</h3>
				<p>Cada base tem licença e link de origem. Uso comercial futuro deve revisar as condições de cada fonte.</p>
			</article>
		</div>
	</section>

	<section>
		<header class="section-head">
			<span class="index">02</span>
			<h2>Bases usadas</h2>
		</header>
		<div class="source-list">
			{#each sources as source (source.url)}
				<a href={source.url} target="_blank" rel="noopener noreferrer">
					<div>
						<strong>{source.name}</strong>
						<p>{source.note ?? ''}</p>
					</div>
					<span class="license">{source.license}</span>
					<Icon name="external" size={13} />
				</a>
			{/each}
			{#each extraSources as source (source.url)}
				<a href={source.url} target="_blank" rel="noopener noreferrer">
					<div>
						<strong>{source.name}</strong>
						<p>{source.note}</p>
					</div>
					<span class="license">{source.license}</span>
					<Icon name="external" size={13} />
				</a>
			{/each}
			<a href={historicalSource.url} target="_blank" rel="noopener noreferrer">
				<div>
					<strong>{historicalSource.name}</strong>
					<p>{historicalSource.note}</p>
				</div>
				<span class="license">Uso editorial</span>
				<Icon name="external" size={13} />
			</a>
		</div>
	</section>

	<section>
		<header class="section-head">
			<span class="index">03</span>
			<h2>Indicadores</h2>
		</header>
		<p class="section-note">
			Cobertura = países com polígono no mapa que têm valor para o indicador. A série é
			consultada de 2016 a 2025; usamos a observação mais recente de cada país. A série
			completa alimenta as sparklines dos dossiês.
		</p>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Indicador</th>
						<th>Código</th>
						<th>Unidade</th>
						<th>Formato</th>
						<th>Cobertura</th>
						<th>Fonte</th>
					</tr>
				</thead>
				<tbody>
					{#each indicatorKeys as key (key)}
						<tr>
							<td>{indicatorMeta[key].name}</td>
							<td class="mono">{indicatorMeta[key].code}</td>
							<td>{indicatorMeta[key].unit}</td>
							<td>{formatLabel[indicatorMeta[key].format] ?? indicatorMeta[key].format}</td>
							<td class="num">{indicatorCoverage[key]}</td>
							<td>
								<a href={indicatorMeta[key].sourceUrl} target="_blank" rel="noopener noreferrer">
									Banco Mundial <Icon name="external" size={10} />
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="footnote">
			{indicatorKeys.length} séries do World Bank Open Data (CC BY 4.0). Indicadores de
			governança usam os Worldwide Governance Indicators (WGI), também publicados pelo Banco
			Mundial. Dívida pública tem cobertura menor e é exibida apenas quando há observação.
		</p>
	</section>

	<section>
		<header class="section-head">
			<span class="index">04</span>
			<h2>Pipeline reproduzível</h2>
		</header>
		<div class="pipeline">
			<div>
				<span class="eyebrow">Gerar</span>
				<code>npm run data:build</code>
				<p>Usa o cache local de Natural Earth, mledoze e World Bank.</p>
			</div>
			<div>
				<span class="eyebrow">Atualizar</span>
				<code>npm run data:refresh</code>
				<p>Baixa tudo de novo e reescreve <code>src/lib/data/generated/</code>.</p>
			</div>
			<div>
				<span class="eyebrow">Validar</span>
				<code>npm test && npm run check</code>
				<p>Testes cobrem motores, integridade dos dados e jogos.</p>
			</div>
		</div>
	</section>

	<section>
		<header class="section-head">
			<span class="index">05</span>
			<h2>Limitações conhecidas</h2>
		</header>
		<ul class="limits">
			<li>Escala 1:50m do Natural Earth: fronteiras generalizadas. Microestados aparecem como pontos de capital, com área de clique ampliada.</li>
			<li>O relevo sombreado e o modo 3D usam tiles públicos de elevação carregados pela rede; sem conexão, o mapa permanece plano.</li>
			<li>Indicadores econômicos em dólares correntes não são comparáveis entre anos sem ajuste; por isso o ano aparece sempre.</li>
			<li>Blocos históricos e a linha do tempo usam os polígonos atuais. É uma aproximação didática, não um mapa histórico exato.</li>
			<li>“Independência” é um marco político discutível em vários casos; adotamos o ano indicado na fonte e registramos a ressalva.</li>
			<li>Composição de organizações como BRICS e OPEP muda com frequência; o recorte temporal está indicado em cada card.</li>
			<li>Séries do Banco Mundial podem ter lacunas e revisões. O app não interpola valores.</li>
		</ul>
	</section>

	<section>
		<header class="section-head">
			<span class="index">06</span>
			<h2>Conteúdo editorial e jogos</h2>
		</header>
		<p class="section-note">
			{organizations.length} organizações, {snippets.length} leituras curtas e {games.length} jogos.
			Cada explicação de rodada cita a fonte usada na validação. O motor de jogos não importa o
			mapa: recebe rodadas, valida respostas e devolve pontuação.
		</p>
		<div class="editorial-grid">
			<a href="/play">
				<Icon name="gamepad" size={18} />
				<strong>Jogos</strong>
				<span>Regras, fontes e recordes locais</span>
			</a>
			<a href="/country/BRA">
				<Icon name="dossier" size={18} />
				<strong>Dossiês</strong>
				<span>Exemplo: Brasil, com séries e comparações</span>
			</a>
			<a href="/explore">
				<Icon name="globe" size={18} />
				<strong>Atlas</strong>
				<span>Seis camadas e metadados no mapa</span>
			</a>
		</div>
	</section>

	<footer>
		<a href="/explore">← Voltar ao mapa</a>
		<span>{retrievedAt}</span>
		<a href="/play">Jogar →</a>
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
		font-size: 0.48rem;
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
		font-size: 0.52rem;
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
		font-size: 0.48rem;
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
		font-size: 0.62rem;
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
		font-size: 0.46rem;
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
		font-size: 0.62rem;
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
		font-size: 0.46rem;
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
		font-size: 0.52rem;
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
		font-size: 0.54rem;
		color: var(--water-1);
		text-decoration: none;
	}
	.footnote {
		margin: 0.6rem 0 0;
		font-size: 0.56rem;
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
		font-size: 0.58rem;
		color: var(--accent-0);
	}
	.pipeline p {
		margin: 0.3rem 0 0;
		font-size: 0.58rem;
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
		font-size: 0.58rem;
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
