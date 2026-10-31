<script lang="ts">
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { brand } from '#lib/brand';
	import { countries, indicatorKeys, retrievedAt } from '#lib/data/countries';
	import { mapLayers } from '#lib/configurations/map-layers';
	import { games } from '#lib/engines/game-engine/registry';
	import { worldOutline } from '#lib/data/world-silhouette';
	import { snippets } from '#lib/data/snippets';

	const featuredSnippets = snippets.filter((s) => s.countries.length).slice(0, 3);
	const layerColors = ['var(--water-0)', 'var(--forest)', 'var(--water-1)', 'var(--accent-1)', 'var(--wine)', 'var(--text-3)'];
</script>

<svelte:head>
	<title>{brand.name} — {brand.tagline}</title>
	<meta
		name="description"
		content="Atlas interativo de geografia e geopolítica: mapa em camadas, dossiês com fontes, séries temporais e jogos com dados reais."
	/>
</svelte:head>

<TopBar />

<main id="conteudo">
	<section class="hero">
		<div class="hero-copy">
			<span class="eyebrow">Atlas interativo · edição 2026</span>
			<h1>O mundo inteiro,<br />em uma folha.</h1>
			<p class="lede">
				Um atlas que se lê com o dedo: fronteiras, relevo, população, economia e história
				no mesmo mapa. Cada camada tem legenda, método e fonte.
			</p>
			<div class="hero-actions">
				<a class="btn btn-accent" href="/explore">
					<Icon name="globe" size={15} /> Abrir o atlas
				</a>
				<a class="btn" href="/play">
					<Icon name="gamepad" size={15} /> Jogar com o mapa
				</a>
			</div>
			<dl class="hero-stats">
				<div><dt>territórios</dt><dd>{countries.length}</dd></div>
				<div><dt>indicadores</dt><dd>{indicatorKeys.length}</dd></div>
				<div><dt>jogos</dt><dd>{games.length}</dd></div>
				<div><dt>camadas</dt><dd>{mapLayers.length}</dd></div>
			</dl>
		</div>

		<figure class="globe">
			<div class="globe-frame">
				<span class="tick top"></span>
				<span class="tick bottom"></span>
				<span class="tick left"></span>
				<span class="tick right"></span>
				<svg viewBox="0 0 100 100" role="img" aria-label="Contorno do mapa-múndi">
					<path class="land" d={worldOutline} />
				</svg>
				<span class="axis x"></span>
				<span class="axis y"></span>
				<span class="coord tl">180°O</span>
				<span class="coord tr">180°L</span>
				<span class="coord bl">60°S</span>
				<span class="coord br">80°N</span>
			</div>
			<figcaption>
				<span>Natural Earth 1:50m</span>
				<span>Projeção equirretangular</span>
				<span>Extração {retrievedAt}</span>
			</figcaption>
		</figure>
	</section>

	<section class="manifesto">
		<div class="manifesto-lead">
			<span class="eyebrow">Manifesto</span>
			<h2>O mapa não é fundo.<br />É a interface.</h2>
		</div>
		<div class="principles">
			<article>
				<span>01</span>
				<h3>Nada de dado inventado</h3>
				<p>Lacuna aparece como “não disponível”. Todo número carrega ano, unidade e fonte verificável.</p>
			</article>
			<article>
				<span>02</span>
				<h3>Camadas com método</h3>
				<p>Cada leitura visual tem legenda, nota de método e limites explícitos — inclusive fronteiras disputadas.</p>
			</article>
			<article>
				<span>03</span>
				<h3>Jogar é uma forma de ler</h3>
				<p>Sete jogos usam a mesma base do atlas. A resposta certa sempre vem com explicação e link.</p>
			</article>
		</div>
	</section>

	<section class="features">
		<a class="feature" href="/explore">
			<span class="feature-icon"><Icon name="globe3d" size={22} /></span>
			<div>
				<span class="eyebrow">Atlas</span>
				<h2>Seis camadas, um mundo</h2>
				<p>Político, físico, demografia, economia, geopolítica e história. Globo 3D e relevo opcionais.</p>
			</div>
			<Icon name="arrowUpRight" size={16} />
		</a>
		<a class="feature" href="/country/BRA">
			<span class="feature-icon"><Icon name="dossier" size={22} /></span>
			<div>
				<span class="eyebrow">Dossiês</span>
				<h2>Um verbete por país</h2>
				<p>{indicatorKeys.length} indicadores com série, comparação com a mediana mundial e fontes por seção.</p>
			</div>
			<Icon name="arrowUpRight" size={16} />
		</a>
		<a class="feature" href="/play">
			<span class="feature-icon"><Icon name="gamepad" size={22} /></span>
			<div>
				<span class="eyebrow">Jogos</span>
				<h2>Sete formas de errar</h2>
				<p>Silhuetas, capitais, blocos, rankings e fronteiras. Desafio diário com seed determinístico.</p>
			</div>
			<Icon name="arrowUpRight" size={16} />
		</a>
	</section>

	<section class="layers">
		<header class="section-head">
			<div>
				<span class="eyebrow">Camadas</span>
				<h2>Leituras do mesmo território</h2>
			</div>
			<a href="/explore">Abrir no mapa <Icon name="arrowRight" size={13} /></a>
		</header>
		<div class="layer-list">
			{#each mapLayers as layer, i (layer.id)}
				<a href={`/explore?layer=${layer.id}`} style:--cat={layerColors[i]}>
					<span class="num">{layer.index}</span>
					<span class="glyph"><Icon name={layer.icon} size={17} /></span>
					<strong>{layer.label}</strong>
					<span class="desc">{layer.description}</span>
					<Icon name="arrowRight" size={14} />
				</a>
			{/each}
		</div>
	</section>

	<section class="snippets">
		<header class="section-head">
			<div>
				<span class="eyebrow">Leituras</span>
				<h2>Comece por uma curiosidade</h2>
			</div>
		</header>
		<div class="snippet-grid">
			{#each featuredSnippets as snippet (snippet.id)}
				<article>
					<span class="eyebrow">{snippet.category}</span>
					<h3>{snippet.title}</h3>
					<p>{snippet.body}</p>
					<a href={snippet.sourceUrl} target="_blank" rel="noopener noreferrer">
						{snippet.source} <Icon name="external" size={10} />
					</a>
				</article>
			{/each}
		</div>
	</section>

	<section class="closing">
		<span class="eyebrow">Próxima leitura</span>
		<h2>Escolha um país.<br />O mapa faz o resto.</h2>
		<div class="closing-actions">
			<a class="btn btn-accent" href="/explore">Explorar o mundo <Icon name="arrowRight" size={14} /></a>
			<a class="link" href="/sobre">Fontes, licenças e limitações</a>
		</div>
	</section>

	<footer>
		<span>{brand.name} · {brand.tagline}</span>
		<nav aria-label="Rodapé">
			<a href="/explore">Atlas</a>
			<a href="/play">Jogos</a>
			<a href="/sobre">Fontes</a>
		</nav>
	</footer>
</main>

<style>
	main {
		position: relative;
		z-index: 1;
		padding: calc(var(--header-h) + 2.6rem) clamp(1rem, 5vw, 4rem) 2rem;
		max-width: 80rem;
		margin: 0 auto;
	}
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(22rem, 0.95fr);
		gap: clamp(2rem, 6vw, 5rem);
		align-items: center;
		padding-bottom: 3rem;
		border-bottom: 1px solid var(--line-strong);
	}
	h1 {
		margin: 0.6rem 0 0.9rem;
		font-family: var(--font-display);
		font-size: clamp(3.1rem, 7vw, 5.8rem);
		font-weight: 600;
		line-height: 0.94;
		letter-spacing: -0.045em;
	}
	.lede {
		max-width: 33rem;
		margin: 0 0 1.3rem;
		font-size: 0.92rem;
		line-height: 1.65;
		color: var(--text-3);
	}
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.hero-stats {
		display: flex;
		gap: 2rem;
		margin: 2rem 0 0;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}
	.hero-stats div {
		display: flex;
		flex-direction: column-reverse;
		gap: 0.15rem;
	}
	.hero-stats dt {
		font-family: var(--font-mono);
		font-size: 0.44rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.hero-stats dd {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 550;
		line-height: 1;
	}
	.globe {
		margin: 0;
	}
	.globe-frame {
		position: relative;
		aspect-ratio: 1;
		border: 1px solid var(--line-strong);
		background-image:
			linear-gradient(var(--line) 1px, transparent 1px),
			linear-gradient(90deg, var(--line) 1px, transparent 1px);
		background-size: 12.5% 12.5%;
		background-color: var(--surface-1);
		overflow: hidden;
	}
	.globe-frame::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 50% 50%, transparent 48%, color-mix(in oklab, var(--surface-0) 45%, transparent) 100%);
		pointer-events: none;
	}
	.globe-frame svg {
		position: absolute;
		inset: 13% 10%;
		width: 80%;
		height: 74%;
	}
	.land {
		fill: color-mix(in oklab, var(--accent-1) 38%, var(--surface-2));
		stroke: var(--accent-0);
		stroke-width: 0.35;
		vector-effect: non-scaling-stroke;
	}
	.axis {
		position: absolute;
		background: var(--line);
	}
	.axis.x {
		left: 7%;
		right: 7%;
		top: 50%;
		height: 1px;
	}
	.axis.y {
		top: 7%;
		bottom: 7%;
		left: 50%;
		width: 1px;
	}
	.tick {
		position: absolute;
		background: var(--line-strong);
	}
	.tick.top,
	.tick.bottom {
		left: 50%;
		width: 1px;
		height: 8px;
	}
	.tick.top {
		top: 0;
	}
	.tick.bottom {
		bottom: 0;
	}
	.tick.left,
	.tick.right {
		top: 50%;
		height: 1px;
		width: 8px;
	}
	.tick.left {
		left: 0;
	}
	.tick.right {
		right: 0;
	}
	.coord {
		position: absolute;
		font-family: var(--font-mono);
		font-size: 0.4rem;
		letter-spacing: 0.06em;
		color: var(--text-4);
	}
	.coord.tl {
		top: 0.4rem;
		left: 0.5rem;
	}
	.coord.tr {
		top: 0.4rem;
		right: 0.5rem;
	}
	.coord.bl {
		bottom: 0.4rem;
		left: 0.5rem;
	}
	.coord.br {
		bottom: 0.4rem;
		right: 0.5rem;
	}
	.globe figcaption {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding-top: 0.35rem;
		font-family: var(--font-mono);
		font-size: 0.42rem;
		color: var(--text-4);
	}
	.manifesto {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
		gap: clamp(2rem, 6vw, 5rem);
		padding: 3rem 0;
		border-bottom: 1px solid var(--line-strong);
	}
	.manifesto h2,
	.section-head h2,
	.closing h2 {
		margin: 0.5rem 0 0;
		font-family: var(--font-display);
		font-size: clamp(1.7rem, 3.2vw, 2.6rem);
		font-weight: 600;
		line-height: 1.05;
	}
	.principles {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.2rem;
	}
	.principles article {
		padding-top: 0.4rem;
		border-top: 1px solid var(--line-strong);
	}
	.principles span {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--accent-1);
	}
	.principles h3 {
		margin: 0.4rem 0 0.35rem;
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
	}
	.principles p {
		margin: 0;
		font-size: 0.64rem;
		line-height: 1.55;
		color: var(--text-3);
	}
	.features {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.8rem;
		padding: 2.4rem 0;
		border-bottom: 1px solid var(--line-strong);
	}
	.feature {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 1rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		text-decoration: none;
		color: inherit;
		transition: border-color 0.18s ease, background 0.18s ease;
	}
	.feature:hover {
		border-color: var(--line-strong);
		background: var(--surface-2);
	}
	.feature-icon {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border: 1px solid var(--line);
		color: var(--accent-0);
	}
	.feature h2 {
		margin: 0.35rem 0 0.3rem;
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 600;
	}
	.feature p {
		margin: 0;
		font-size: 0.64rem;
		line-height: 1.55;
		color: var(--text-3);
	}
	.feature > :global(svg) {
		margin-top: auto;
		color: var(--text-4);
	}
	.layers,
	.snippets {
		padding: 2.4rem 0;
		border-bottom: 1px solid var(--line-strong);
	}
	.section-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.1rem;
	}
	.section-head a {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--text-3);
		text-decoration: none;
	}
	.section-head a:hover {
		color: var(--accent-0);
	}
	.layer-list {
		display: flex;
		flex-direction: column;
	}
	.layer-list a {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.6rem 0.2rem;
		border-bottom: 1px solid var(--line);
		text-decoration: none;
		color: var(--text-2);
		transition: background 0.15s ease, padding 0.15s ease;
	}
	.layer-list a:hover {
		background: var(--surface-1);
		padding-left: 0.5rem;
	}
	.layer-list .num {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--text-4);
		width: 1.4rem;
	}
	.layer-list .glyph {
		color: var(--cat);
		display: grid;
		place-items: center;
	}
	.layer-list strong {
		min-width: 7rem;
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 600;
	}
	.layer-list .desc {
		flex: 1;
		font-size: 0.62rem;
		color: var(--text-3);
	}
	.layer-list a > :global(svg) {
		color: var(--text-4);
	}
	.snippet-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.7rem;
	}
	.snippet-grid article {
		padding: 0.85rem;
		border: 1px solid color-mix(in oklab, var(--water-0) 30%, transparent);
		background: color-mix(in oklab, var(--water-0) 6%, transparent);
	}
	.snippet-grid h3 {
		margin: 0.32rem 0 0.35rem;
		font-family: var(--font-display);
		font-size: 1.02rem;
		font-weight: 600;
	}
	.snippet-grid p {
		margin: 0 0 0.4rem;
		font-size: 0.62rem;
		line-height: 1.55;
		color: var(--text-2);
	}
	.snippet-grid a {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.5rem;
		color: var(--water-1);
		text-decoration: none;
	}
	.closing {
		padding: 3.2rem 0 2.4rem;
	}
	.closing-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		margin-top: 1.2rem;
	}
	.link {
		font-size: 0.66rem;
		color: var(--text-3);
	}
	footer {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
		font-family: var(--font-mono);
		font-size: 0.48rem;
		color: var(--text-4);
	}
	footer nav {
		display: flex;
		gap: 1rem;
	}
	footer a {
		color: var(--text-3);
		text-decoration: none;
	}
	footer a:hover {
		color: var(--text-1);
	}
	@media (max-width: 980px) {
		.hero {
			grid-template-columns: 1fr;
		}
		.globe {
			max-width: 24rem;
		}
		.manifesto {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
	@media (max-width: 760px) {
		main {
			padding: calc(var(--header-h) + 1.6rem) 1rem 1.5rem;
		}
		.features,
		.principles,
		.snippet-grid {
			grid-template-columns: 1fr;
		}
		.hero-stats {
			gap: 1.4rem;
		}
		.layer-list .desc {
			display: none;
		}
		.layer-list strong {
			flex: 1;
			min-width: 0;
		}
		footer {
			flex-direction: column;
		}
	}
</style>
