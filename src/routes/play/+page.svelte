<script lang="ts">
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { games } from '#lib/engines/game-engine/registry';

	const categories = ['Todos', ...new Set(games.map((g) => g.category))];
	let activeCategory = $state('Todos');
	const filtered = $derived(
		activeCategory === 'Todos' ? games : games.filter((g) => g.category === activeCategory)
	);
</script>

<svelte:head>
	<title>Jogar — Mundivista</title>
	<meta
		name="description"
		content="Minigames de geografia, geopolítica, história e dados. Todos usam o mapa e fontes reais."
	/>
</svelte:head>

<TopBar />

<main>
	<section class="hero">
		<div class="intro">
			<span class="eyebrow">Play · biblioteca</span>
			<h1>Jogue com o mundo.</h1>
			<p>
				Minigames curtos sobre geografia, geopolítica e dados. O mapa é a mesa — e cada
				resposta tem uma fonte por trás.
			</p>
		</div>
		<div class="stats">
			<div><strong>{games.length}</strong><span>jogos</span></div>
			<div><strong>4</strong><span>mecânicas</span></div>
			<div><strong>20</strong><span>indicadores</span></div>
		</div>
	</section>

	<div class="filters" role="group" aria-label="Filtrar por categoria">
		{#each categories as category (category)}
			<button
				type="button"
				class:active={activeCategory === category}
				onclick={() => (activeCategory = category)}
			>
				{category}
			</button>
		{/each}
	</div>

	<section class="grid" aria-label="Jogos disponíveis">
		{#each filtered as game, i (game.slug)}
			<a class="game" href={`/game/${game.slug}`} style:--index={i}>
				<div class="top">
					<span class="number">{String(games.indexOf(game) + 1).padStart(2, '0')}</span>
					<span class="category">{game.category}</span>
					<span class="icon"><Icon name={game.icon} size={18} /></span>
				</div>
				<h2>{game.title}</h2>
				<p class="tagline">{game.tagline}</p>
				<p class="description">{game.description}</p>
				<div class="bottom">
					<span class="meta">{game.mechanic}</span>
					<span class="meta">{game.rounds} rodadas · {game.minutes} min</span>
					<span class="go"><Icon name="arrowRight" size={15} /></span>
				</div>
			</a>
		{/each}
	</section>

	<section class="note">
		<Icon name="info" size={15} />
		<p>
			Sem cadastro, sem ranking global e sem dados inventados. Cada rodada usa a mesma base
			do atlas — Banco Mundial, Natural Earth e fontes oficiais citadas no jogo.
		</p>
	</section>
</main>

<style>
	main {
		min-height: 100dvh;
		padding: calc(var(--header-h) + 3.2rem) clamp(1rem, 5vw, 4rem) 4rem;
		background:
			radial-gradient(90% 50% at 20% 0%, rgba(111, 183, 255, 0.06), transparent 60%),
			radial-gradient(70% 40% at 90% 10%, rgba(230, 180, 92, 0.05), transparent 60%),
			#070b12;
	}
	.hero {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 2rem;
		max-width: 72rem;
		margin: 0 auto 2.2rem;
		padding-bottom: 1.6rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}
	.intro {
		max-width: 38rem;
	}
	h1 {
		margin: 0.5rem 0 0.7rem;
		font-size: clamp(2.3rem, 5vw, 3.6rem);
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 1;
		background: linear-gradient(100deg, #e9eff7 20%, #f0cd8e 80%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	.intro p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--color-mist-300);
		max-width: 33rem;
	}
	.stats {
		display: flex;
		gap: 1.5rem;
		padding-bottom: 0.3rem;
	}
	.stats div {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.stats strong {
		font-family: var(--font-mono);
		font-size: 1.35rem;
		font-weight: 500;
		color: var(--color-gold-300);
	}
	.stats span {
		font-family: var(--font-mono);
		font-size: 0.52rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-mist-500);
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		max-width: 72rem;
		margin: 0 auto 1.2rem;
	}
	.filters button {
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: transparent;
		color: var(--color-mist-400);
		border-radius: 999px;
		padding: 0.28rem 0.7rem;
		font-size: 0.68rem;
		transition: all 0.16s ease;
	}
	.filters button:hover {
		color: var(--color-mist-100);
		border-color: rgba(255, 255, 255, 0.2);
	}
	.filters button.active {
		color: var(--color-gold-300);
		border-color: color-mix(in oklab, var(--color-gold-400) 45%, transparent);
		background: color-mix(in oklab, var(--color-gold-400) 8%, transparent);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.85rem;
		max-width: 72rem;
		margin: 0 auto;
	}
	.game {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 1.15rem 1.2rem 1rem;
		border-radius: 0.8rem;
		border: 1px solid rgba(255, 255, 255, 0.075);
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 40%),
			#0b1119;
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		transition: border-color 0.22s ease, transform 0.22s var(--ease-out-soft), background 0.22s ease;
		animation: fade-up 0.5s var(--ease-out-soft) both;
		animation-delay: calc(var(--index) * 45ms);
	}
	.game::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.022) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px);
		background-size: 34px 34px;
		mask-image: radial-gradient(80% 60% at 80% 0%, #000 0%, transparent 70%);
		pointer-events: none;
	}
	.game:hover {
		border-color: color-mix(in oklab, var(--color-gold-400) 38%, transparent);
		background:
			linear-gradient(180deg, rgba(230, 180, 92, 0.055), transparent 45%),
			#0c131c;
		transform: translateY(-2px);
	}
	.top {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 1.2rem;
	}
	.number {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-mist-500);
	}
	.category {
		font-family: var(--font-mono);
		font-size: 0.54rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-gold-300);
		border: 1px solid color-mix(in oklab, var(--color-gold-400) 25%, transparent);
		border-radius: 999px;
		padding: 0.12rem 0.42rem;
	}
	.icon {
		margin-left: auto;
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.45rem;
		background: rgba(255, 255, 255, 0.035);
		border: 1px solid rgba(255, 255, 255, 0.06);
		color: var(--color-mist-300);
	}
	h2 {
		margin: 0;
		font-size: 1.22rem;
		font-weight: 600;
		letter-spacing: -0.025em;
	}
	.tagline {
		margin: 0.15rem 0 0.55rem;
		font-size: 0.7rem;
		color: var(--color-gold-300);
	}
	.description {
		margin: 0 0 1.3rem;
		font-size: 0.76rem;
		line-height: 1.55;
		color: var(--color-mist-400);
		max-width: 30rem;
	}
	.bottom {
		margin-top: auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-top: 0.7rem;
		border-top: 1px solid rgba(255, 255, 255, 0.055);
	}
	.meta {
		font-family: var(--font-mono);
		font-size: 0.54rem;
		letter-spacing: 0.04em;
		color: var(--color-mist-500);
	}
	.meta + .meta {
		margin-left: auto;
	}
	.go {
		display: grid;
		place-items: center;
		color: var(--color-mist-300);
		transition: transform 0.2s ease, color 0.2s ease;
	}
	.game:hover .go {
		color: var(--color-gold-300);
		transform: translateX(3px);
	}
	.note {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		max-width: 72rem;
		margin: 1.6rem auto 0;
		padding: 0.85rem 1rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.6rem;
		color: var(--color-mist-400);
	}
	.note p {
		margin: 0;
		font-size: 0.68rem;
		line-height: 1.5;
	}
	@media (max-width: 860px) {
		main {
			padding: calc(var(--header-h) + 1.6rem) 1rem 2rem;
		}
		.hero {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.2rem;
		}
		.stats {
			gap: 1.2rem;
		}
		.grid {
			grid-template-columns: 1fr;
		}
		h1 {
			font-size: 2.3rem;
		}
	}
</style>
