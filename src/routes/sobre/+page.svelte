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

	const sources = [
		manifest.sources.boundaries,
		manifest.sources.facts,
		manifest.sources.indicators,
		manifest.sources.physical
	].filter(Boolean);
</script>

<svelte:head>
	<title>Fontes e métodos — Mundivista</title>
	<meta
		name="description"
		content="De onde vêm os dados da Mundivista, como os indicadores são tratados e quais são as limitações do mapa."
	/>
</svelte:head>

<TopBar />

<main>
	<header class="hero">
		<span class="eyebrow">Transparência</span>
		<h1>Fontes e métodos</h1>
		<p>
			A plataforma não estima, não completa lacunas e não mistura períodos sem avisar.
			Cada número na interface carrega ano de referência e origem.
		</p>
		<p class="stamp">Extração dos dados: {retrievedAt}</p>
	</header>

	<section>
		<h2>Princípios</h2>
		<div class="principles">
			<article>
				<span>01</span>
				<h3>Nada de dado inventado</h3>
				<p>Indicadores ausentes aparecem como “não disponível”. Nunca preenchemos lacunas com estimativas próprias.</p>
			</article>
			<article>
				<span>02</span>
				<h3>Ano sempre visível</h3>
				<p>O Banco Mundial publica cada indicador no último ano disponível. O ano acompanha o valor em todo lugar.</p>
			</article>
			<article>
				<span>03</span>
				<h3>Fronteiras com contexto</h3>
				<p>O recorte é o do Natural Earth. Territórios disputados não são apresentados como consenso universal.</p>
			</article>
			<article>
				<span>04</span>
				<h3>Licenças respeitadas</h3>
				<p>Cada base tem licença e link de origem. O uso comercial futuro deverá revisar essas condições.</p>
			</article>
		</div>
	</section>

	<section>
		<h2>Bases usadas</h2>
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
		<h2>Indicadores</h2>
		<p class="section-note">
			Cobertura = países com polígono no mapa que têm valor para o indicador. A série é
			consultada de 2016 a 2025; usamos a observação mais recente de cada país.
		</p>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Indicador</th>
						<th>Unidade</th>
						<th>Cobertura</th>
						<th>Fonte</th>
					</tr>
				</thead>
				<tbody>
					{#each indicatorKeys as key (key)}
						<tr>
							<td>{indicatorMeta[key].name}</td>
							<td>{indicatorMeta[key].unit}</td>
							<td class="num">{indicatorCoverage[key]}</td>
							<td>
								<a href={indicatorMeta[key].sourceUrl} target="_blank" rel="noopener noreferrer">
									{indicatorMeta[key].code}
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>Limitações conhecidas</h2>
		<ul class="limits">
			<li>Escala 1:50m do Natural Earth: fronteiras generalizadas e alguns microestados muito pequenos podem não ser selecionáveis com conforto.</li>
			<li>Indicadores econômicos em dólares correntes não são comparáveis entre anos sem ajuste; por isso o ano aparece sempre.</li>
			<li>Blocos históricos (URSS, Iugoslávia) são desenhados sobre fronteiras atuais. É uma aproximação didática, não um mapa histórico exato.</li>
			<li>“Independência” é um marco político discutível em vários casos; adotamos o ano indicado na fonte e registramos a ressalva na nota.</li>
			<li>O relevo é simplificado por rótulos curados. Não há modelo digital de elevação nesta versão.</li>
			<li>Composição de organizações como BRICS e OPEP muda com frequência; o recorte temporal está indicado em cada card.</li>
		</ul>
	</section>

	<section>
		<h2>Conteúdo editorial</h2>
		<p class="section-note">
			{organizations.length} organizações e {snippets.length} snippets curados, todos com
			fonte. Snippets são leituras curtas, não substituem o dado original.
		</p>
	</section>

	<footer>
		<a href="/explore">← Voltar ao mapa</a>
		<a href="/play">Jogar →</a>
	</footer>
</main>

<style>
	main {
		min-height: 100dvh;
		padding: calc(var(--header-h) + 3rem) clamp(1rem, 6vw, 5rem) 4rem;
		background: #070b12;
		max-width: 80rem;
		margin: 0 auto;
	}
	.hero {
		max-width: 46rem;
		padding-bottom: 1.8rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}
	h1 {
		margin: 0.5rem 0 0.8rem;
		font-size: clamp(2.2rem, 5vw, 3.4rem);
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 1;
	}
	.hero p {
		margin: 0 0 0.7rem;
		font-size: 0.88rem;
		line-height: 1.65;
		color: var(--color-mist-300);
	}
	.stamp {
		font-family: var(--font-mono);
		font-size: 0.55rem !important;
		letter-spacing: 0.08em;
		color: var(--color-mist-500) !important;
		text-transform: uppercase;
	}
	section {
		margin-top: 2.5rem;
	}
	h2 {
		margin: 0 0 1rem;
		font-family: var(--font-mono);
		font-size: 0.58rem;
		font-weight: 500;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-gold-300);
	}
	.principles {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.6rem;
	}
	.principles article {
		padding: 0.9rem;
		border-radius: 0.6rem;
		border: 1px solid rgba(255, 255, 255, 0.07);
		background: rgba(255, 255, 255, 0.018);
	}
	.principles span {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		color: var(--color-mist-500);
	}
	.principles h3 {
		margin: 0.45rem 0 0.35rem;
		font-size: 0.8rem;
		font-weight: 600;
	}
	.principles p {
		margin: 0;
		font-size: 0.65rem;
		line-height: 1.55;
		color: var(--color-mist-400);
	}
	.source-list {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.source-list a {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.75rem 0.85rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		text-decoration: none;
		color: inherit;
		transition: border-color 0.16s ease, background 0.16s ease;
	}
	.source-list a:hover {
		border-color: rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.025);
	}
	.source-list div {
		flex: 1;
	}
	.source-list strong {
		font-size: 0.75rem;
		font-weight: 550;
	}
	.source-list p {
		margin: 0.2rem 0 0;
		font-size: 0.62rem;
		line-height: 1.45;
		color: var(--color-mist-500);
	}
	.license {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.06em;
		color: var(--color-mist-400);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 999px;
		padding: 0.15rem 0.4rem;
		white-space: nowrap;
	}
	.section-note {
		max-width: 48rem;
		margin: 0 0 0.9rem;
		font-size: 0.72rem;
		line-height: 1.6;
		color: var(--color-mist-400);
	}
	.table-wrap {
		overflow-x: auto;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 0.6rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.68rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.5rem 0.7rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}
	th {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-mist-500);
		font-weight: 500;
		background: rgba(255, 255, 255, 0.02);
	}
	td {
		color: var(--color-mist-300);
	}
	td.num {
		font-family: var(--font-mono);
		color: var(--color-mist-100);
	}
	td a {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-signal-300);
		text-decoration: none;
	}
	.limits {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 52rem;
	}
	.limits li {
		position: relative;
		padding-left: 1rem;
		font-size: 0.72rem;
		line-height: 1.6;
		color: var(--color-mist-300);
	}
	.limits li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55rem;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--color-gold-500);
	}
	footer {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 3rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
	}
	footer a {
		font-size: 0.72rem;
		color: var(--color-mist-400);
		text-decoration: none;
	}
	footer a:hover {
		color: var(--color-gold-300);
	}
	@media (max-width: 900px) {
		.principles {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 600px) {
		.principles {
			grid-template-columns: 1fr;
		}
	}
</style>
