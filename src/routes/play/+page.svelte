<script lang="ts">
	import { onMount } from 'svelte';
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { games } from '#lib/engines/game-engine/registry';
	import { indicatorKeys } from '#lib/data/countries';
	import {
		bestScores,
		dailySeed,
		getDailyResult,
		lastPlayed,
		loadProgress,
		type DailyResult,
		type SavedGame
	} from '#lib/progress';

	const categories = ['Todos', ...new Set(games.map((g) => g.category))];
	let activeCategory = $state('Todos');
	const filtered = $derived(
		activeCategory === 'Todos' ? games : games.filter((g) => g.category === activeCategory)
	);

	const counts = $derived(
		Object.fromEntries(
			categories.map((category) => [
				category,
				category === 'Todos' ? games.length : games.filter((g) => g.category === category).length
			])
		)
	);

	const ACCENTS: Record<string, string> = {
		Geografia: 'var(--water-1)',
		Dados: 'var(--accent-0)',
		Geopolítica: 'var(--wine)',
		História: 'var(--forest)',
		'Meio ambiente': 'var(--positive)'
	};

	let bests = $state<Record<string, number>>({});
	let last = $state<{ slug: string; savedAt: number; daily: boolean } | null>(null);
	let lastState = $state<SavedGame | null>(null);
	let dailyGame = $state(games[0]);
	let dailyResult = $state<DailyResult | null>(null);
	let today = $state('');
	let copied = $state(false);

	onMount(() => {
		today = new Date().toLocaleDateString('pt-BR');
		bests = bestScores();
		last = lastPlayed();
		if (last) lastState = loadProgress(last.slug);
		const index = dailySeed() % games.length;
		dailyGame = games[index];
		dailyResult = getDailyResult();
	});

	const lastGame = $derived(last ? games.find((g) => g.slug === last!.slug) : null);
	const lastProgress = $derived(lastState && lastState.rounds.length ? lastState.index / lastState.rounds.length : 0);

	function accent(category: string): string {
		return ACCENTS[category] ?? 'var(--accent-1)';
	}

	function progressFor(slug: string): SavedGame | null {
		if (lastState?.slug === slug && !lastState.finished) return lastState;
		return null;
	}

	function bestFor(slug: string): number | null {
		return bests[slug] ?? null;
	}

	async function shareDaily() {
		if (!dailyResult) return;
		const text = `Mundivista · Desafio diário\n${dailyResult.correct}/${dailyResult.rounds} · ${dailyResult.score} pontos\n${typeof location !== 'undefined' ? location.origin : ''}/game/${dailyResult.slug}?daily=1`;
		try {
			if (navigator.share) await navigator.share({ title: 'Mundivista — desafio diário', text });
			else {
				await navigator.clipboard.writeText(text);
				copied = true;
				setTimeout(() => (copied = false), 1800);
			}
		} catch {
			/* cancelado */
		}
	}
</script>

<svelte:head>
	<title>Jogar — Mundivista</title>
	<meta
		name="description"
		content="Minigames de geografia, geopolítica, história e dados. Todos usam o mapa e fontes reais."
	/>
</svelte:head>

<TopBar />

<main id="conteudo">
	<section class="hero">
		<div class="intro">
			<span class="eyebrow">Play · biblioteca</span>
			<h1>O mapa como<br />tabuleiro.</h1>
			<p>
				Minigames curtos sobre geografia, geopolítica e dados. Cada rodada usa a mesma base
				do atlas — e cada resposta tem uma fonte por trás.
			</p>
		</div>
		<div class="stats">
			<div><strong>{games.length}</strong><span>jogos</span></div>
			<div><strong>{new Set(games.map((g) => g.interaction)).size}</strong><span>mecânicas</span></div>
			<div><strong>{indicatorKeys.length}</strong><span>indicadores</span></div>
			<div><strong>{Object.keys(bests).length}</strong><span>jogados</span></div>
		</div>
	</section>

	{#if lastGame && lastState && !lastState.finished}
		<section class="resume">
			<div class="resume-label">
				<span class="eyebrow">Continuar jogando</span>
				<strong>{lastGame.title}</strong>
				<p>Rodada {lastState.index + 1} de {lastState.rounds.length} · {lastState.score} pontos</p>
			</div>
			<div class="resume-track" aria-hidden="true"><span style:width={`${lastProgress * 100}%`}></span></div>
			<a class="btn btn-accent" href={`/game/${lastGame.slug}?resume=1`}>
				Retomar <Icon name="arrowRight" size={13} />
			</a>
		</section>
	{/if}

	<section class="daily" style:--cat={accent(dailyGame.category)}>
		<div class="daily-copy">
			<span class="eyebrow">Desafio do dia{today ? ` · ${today}` : ''}</span>
			<h2>{dailyGame.title}</h2>
			<p>{dailyGame.tagline}. A mesma sequência para todo mundo hoje — um seed determinístico por data.</p>
			<div class="daily-meta">
				<span class="chip">{dailyGame.category}</span>
				<span class="chip">{dailyGame.difficulty}</span>
				<span class="chip">{dailyGame.rounds} rodadas</span>
			</div>
		</div>
		<div class="daily-action">
			{#if dailyResult}
				<div class="daily-result">
					<strong>{dailyResult.correct}/{dailyResult.rounds}</strong>
					<span>{dailyResult.score} pontos</span>
				</div>
				<button class="btn" type="button" onclick={shareDaily}>
					<Icon name={copied ? 'check' : 'link'} size={13} /> {copied ? 'Copiado' : 'Compartilhar'}
				</button>
			{:else}
				<a class="btn btn-accent" href={`/game/${dailyGame.slug}?daily=1`}>
					<Icon name="target" size={14} /> Jogar o desafio
				</a>
				<span class="daily-hint">Sem spoiler no compartilhamento.</span>
			{/if}
		</div>
	</section>

	<div class="filters" role="tablist" aria-label="Filtrar por categoria">
		{#each categories as category (category)}
			<button
				type="button"
				role="tab"
				aria-selected={activeCategory === category}
				class:active={activeCategory === category}
				style:--cat={category === 'Todos' ? 'var(--accent-1)' : accent(category)}
				onclick={() => (activeCategory = category)}
			>
				{category}
				<span>{counts[category]}</span>
			</button>
		{/each}
		<span class="filters-rule"></span>
	</div>

	<section class="grid" aria-label="Jogos disponíveis">
		{#each filtered as game, i (game.slug)}
			{@const best = bestFor(game.slug)}
			{@const saved = progressFor(game.slug)}
			<a
				class="game"
				href={`/game/${game.slug}${saved ? '?resume=1' : ''}`}
				style:--cat={accent(game.category)}
				style:--index={i}
			>
				<div class="top">
					<span class="number">{String(games.indexOf(game) + 1).padStart(2, '0')}</span>
					<span class="category">{game.category}</span>
					<span class="difficulty">{game.difficulty}</span>
					<span class="icon"><Icon name={game.icon} size={18} /></span>
				</div>
				<h2>{game.title}</h2>
				<p class="tagline">{game.tagline}</p>
				<p class="description">{game.description}</p>
				<div class="bottom">
					<span class="meta">{game.mechanic}</span>
					<span class="meta">{game.rounds} rodadas · {game.minutes} min</span>
					{#if best !== null}
						<span class="best" title="Recorde pessoal"><Icon name="trophy" size={11} /> {best}</span>
					{/if}
					{#if saved}
						<span class="resume-chip">continuar · {saved.index + 1}/{saved.rounds.length}</span>
					{/if}
					<span class="go"><Icon name="arrowRight" size={15} /></span>
				</div>
			</a>
		{/each}
	</section>

	{#if Object.keys(bests).length}
		<section class="records">
			<header>
				<span class="eyebrow">Seus recordes</span>
				<h2>Progresso local</h2>
			</header>
			<div class="record-list">
				{#each games as game (game.slug)}
					{#if bestFor(game.slug) !== null}
						<a href={`/game/${game.slug}`}>
							<span>{game.title}</span>
							<em>{game.category}</em>
							<strong>{bestFor(game.slug)} pts</strong>
							<Icon name="arrowUpRight" size={12} />
						</a>
					{/if}
				{/each}
			</div>
			<p class="records-note">Recordes ficam no seu navegador. Sem cadastro, sem ranking global.</p>
		</section>
	{/if}

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
		padding: calc(var(--header-h) + 2.6rem) clamp(1rem, 5vw, 4rem) 4rem;
		max-width: 76rem;
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
	.intro {
		max-width: 38rem;
	}
	h1 {
		margin: 0.45rem 0 0.6rem;
		font-family: var(--font-display);
		font-size: clamp(2.6rem, 6vw, 4.6rem);
		font-weight: 600;
		letter-spacing: -0.035em;
		line-height: 0.98;
		color: var(--text-1);
	}
	.intro p {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.65;
		color: var(--text-3);
		max-width: 31rem;
	}
	.stats {
		display: flex;
		gap: 1.6rem;
		padding-bottom: 0.2rem;
	}
	.stats div {
		display: flex;
		flex-direction: column;
		gap: 0.12rem;
	}
	.stats strong {
		font-family: var(--font-display);
		font-size: 1.7rem;
		font-weight: 550;
		color: var(--text-1);
		line-height: 1;
	}
	.stats span {
		font-family: var(--font-mono);
		font-size: 0.46rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.resume {
		display: flex;
		align-items: center;
		gap: 1.2rem;
		margin: 1.1rem 0 0;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--line-strong);
		background: var(--surface-1);
	}
	.resume-label {
		min-width: 12rem;
	}
	.resume-label strong {
		display: block;
		margin-top: 0.2rem;
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
	}
	.resume-label p {
		margin: 0.1rem 0 0;
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--text-4);
	}
	.resume-track {
		flex: 1;
		height: 3px;
		background: var(--line);
	}
	.resume-track span {
		display: block;
		height: 100%;
		background: var(--accent-1);
	}
	.daily {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		margin: 1.1rem 0 1.4rem;
		padding: 1rem 1.1rem;
		border: 1px solid var(--line);
		border-left: 3px solid var(--cat);
		background:
			linear-gradient(90deg, color-mix(in oklab, var(--cat) 7%, transparent), transparent 60%),
			var(--surface-1);
	}
	.daily-copy h2 {
		margin: 0.3rem 0 0.25rem;
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 600;
	}
	.daily-copy p {
		margin: 0;
		max-width: 36rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: var(--text-3);
	}
	.daily-meta {
		display: flex;
		gap: 0.3rem;
		margin-top: 0.5rem;
	}
	.daily-action {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.35rem;
		flex-shrink: 0;
	}
	.daily-result {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}
	.daily-result strong {
		font-family: var(--font-display);
		font-size: 1.6rem;
		color: var(--cat);
	}
	.daily-result span {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--text-4);
	}
	.daily-hint {
		font-family: var(--font-mono);
		font-size: 0.44rem;
		color: var(--text-4);
	}
	.filters {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		margin-bottom: 1.1rem;
		border-bottom: 1px solid var(--line);
	}
	.filters button {
		display: inline-flex;
		align-items: baseline;
		gap: 0.35rem;
		border: 0;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--text-3);
		padding: 0.45rem 0.55rem;
		font-size: 0.7rem;
		margin-bottom: -1px;
	}
	.filters button span {
		font-family: var(--font-mono);
		font-size: 0.48rem;
		color: var(--text-4);
	}
	.filters button:hover {
		color: var(--text-1);
	}
	.filters button.active {
		color: var(--text-1);
		border-bottom-color: var(--cat);
	}
	.filters button.active span {
		color: var(--cat);
	}
	.filters-rule {
		flex: 1;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
	}
	.game {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 0.95rem 1rem 0.85rem;
		border: 1px solid var(--line);
		border-top: 2px solid color-mix(in oklab, var(--cat) 60%, var(--line));
		background: var(--surface-1);
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		transition:
			border-color 0.2s ease,
			background 0.2s ease,
			transform 0.22s var(--ease-out-soft);
		animation: fade-up 0.45s var(--ease-out-soft) both;
		animation-delay: calc(var(--index) * 45ms);
	}
	.game::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(var(--line) 1px, transparent 1px),
			linear-gradient(90deg, var(--line) 1px, transparent 1px);
		background-size: 38px 38px;
		opacity: 0.35;
		mask-image: radial-gradient(80% 60% at 85% 0%, #000 0%, transparent 70%);
		pointer-events: none;
	}
	.game:hover {
		border-color: color-mix(in oklab, var(--cat) 55%, var(--line));
		background: var(--surface-2);
		transform: translateY(-2px);
	}
	.top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.number {
		font-family: var(--font-mono);
		font-size: 0.52rem;
		color: var(--text-4);
	}
	.category,
	.difficulty {
		font-family: var(--font-mono);
		font-size: 0.46rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 0.12rem 0.34rem;
		border: 1px solid color-mix(in oklab, var(--cat) 45%, transparent);
		color: var(--cat);
	}
	.difficulty {
		border-color: var(--line);
		color: var(--text-4);
	}
	.icon {
		margin-left: auto;
		display: grid;
		place-items: center;
		width: 1.9rem;
		height: 1.9rem;
		border: 1px solid var(--line);
		color: var(--cat);
		background: var(--surface-2);
	}
	.game h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.tagline {
		margin: 0.1rem 0 0.45rem;
		font-size: 0.66rem;
		color: var(--cat);
	}
	.description {
		margin: 0 0 1.1rem;
		font-size: 0.7rem;
		line-height: 1.55;
		color: var(--text-3);
		max-width: 30rem;
	}
	.bottom {
		margin-top: auto;
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding-top: 0.55rem;
		border-top: 1px solid var(--line);
	}
	.meta {
		font-family: var(--font-mono);
		font-size: 0.48rem;
		letter-spacing: 0.03em;
		color: var(--text-4);
	}
	.meta + .meta {
		margin-left: auto;
	}
	.best,
	.resume-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-family: var(--font-mono);
		font-size: 0.48rem;
		color: var(--accent-0);
	}
	.resume-chip {
		color: var(--cat);
	}
	.go {
		display: grid;
		place-items: center;
		color: var(--text-3);
		transition: transform 0.2s ease, color 0.2s ease;
	}
	.game:hover .go {
		color: var(--cat);
		transform: translateX(3px);
	}
	.records {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line-strong);
	}
	.records header {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
		margin-bottom: 0.6rem;
	}
	.records h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 600;
	}
	.record-list {
		display: flex;
		flex-direction: column;
	}
	.record-list a {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		padding: 0.42rem 0.1rem;
		border-bottom: 1px solid var(--line);
		text-decoration: none;
		color: var(--text-2);
		font-size: 0.68rem;
	}
	.record-list a:hover {
		color: var(--text-1);
	}
	.record-list em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.46rem;
		color: var(--text-4);
	}
	.record-list strong {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.56rem;
		color: var(--accent-0);
	}
	.records-note {
		margin: 0.5rem 0 0;
		font-size: 0.56rem;
		color: var(--text-4);
	}
	.note {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		margin-top: 2rem;
		padding: 0.75rem 0.85rem;
		border: 1px solid var(--line);
		color: var(--text-3);
	}
	.note p {
		margin: 0;
		font-size: 0.62rem;
		line-height: 1.5;
	}
	@media (max-width: 900px) {
		main {
			padding: calc(var(--header-h) + 1.4rem) 1rem 2rem;
		}
		.hero {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.1rem;
		}
		.stats {
			gap: 1.2rem;
		}
		.grid {
			grid-template-columns: 1fr;
		}
		.daily {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.8rem;
		}
		.daily-action {
			align-items: flex-start;
		}
		.resume {
			flex-wrap: wrap;
		}
		.resume-track {
			order: 3;
			flex-basis: 100%;
		}
		h1 {
			font-size: 2.7rem;
		}
	}
</style>
