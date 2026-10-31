<script lang="ts">
	import { onMount } from 'svelte';
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import GameCover from '#lib/components/games/GameCover.svelte';
	import { games } from '#lib/engines/game-engine/registry';
	import { gameAccent } from '#lib/engines/game-engine/theme';
	import { locale } from '#lib/locale.svelte';
	import { t } from '#lib/i18n';
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

	const text = $derived(locale.value);
	const categories = ['Todos', ...new Set(games.map((g) => g.category))];
	const CATEGORY_EN: Record<string, string> = {
		Geografia: 'Geography',
		Dados: 'Data',
		Geopolítica: 'Geopolitics',
		História: 'History',
		'Meio ambiente': 'Environment'
	};
	const DIFFICULTY_EN: Record<string, string> = {
		'Fácil': 'Easy',
		'Médio': 'Medium',
		'Difícil': 'Hard'
	};
	const categoryLabel = (category: string) =>
		text === 'en' ? (CATEGORY_EN[category] ?? category) : category;
	const difficultyLabel = (difficulty: string) =>
		text === 'en' ? (DIFFICULTY_EN[difficulty] ?? difficulty) : difficulty;
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
			<span class="eyebrow">{t('play.eyebrow', text)}</span>
			<h1><span>{t('play.titleA', text)}</span><em>{t('play.titleB', text)}</em></h1>
			<p>{t('play.lede', text)}</p>
		</div>
		<div class="stats">
			<div><strong>{games.length}</strong><span>{text === 'en' ? 'games' : 'jogos'}</span></div>
			<div><strong>{new Set(games.map((g) => g.interaction)).size}</strong><span>{text === 'en' ? 'mechanics' : 'mecânicas'}</span></div>
			<div><strong>{indicatorKeys.length}</strong><span>{text === 'en' ? 'indicators' : 'indicadores'}</span></div>
			<div><strong>{Object.keys(bests).length}</strong><span>{text === 'en' ? 'played' : 'jogados'}</span></div>
		</div>
	</section>

	{#if lastGame && lastState && !lastState.finished}
		<section class="resume">
			<div class="resume-label">
				<span class="eyebrow">{t('play.resume', text)}</span>
				<strong>{lastGame.title}</strong>
				<p>{lastState.index + 1}/{lastState.rounds.length} · {lastState.score} pts</p>
			</div>
			<div class="resume-track" aria-hidden="true"><span style:width={`${lastProgress * 100}%`}></span></div>
			<a class="btn btn-accent" href={`/game/${lastGame.slug}?resume=1`}>
				{t('play.resume', text)} <Icon name="arrowRight" size={13} />
			</a>
		</section>
	{/if}

	<section class="daily" style:--cat={gameAccent(dailyGame.category)}>
		<div class="daily-art"><GameCover slug={dailyGame.slug} icon={dailyGame.icon} /></div>
		<div class="daily-copy">
			<span class="eyebrow">{t('play.daily', text)}{today ? ` · ${today}` : ''}</span>
			<h2>{dailyGame.title}</h2>
			<p>{dailyGame.tagline}. {t('play.dailyHint', text)}</p>
			<div class="daily-meta">
				<span class="chip">{categoryLabel(dailyGame.category)}</span>
				<span class="chip">{difficultyLabel(dailyGame.difficulty)}</span>
				<span class="chip">{dailyGame.rounds} {text === 'en' ? 'rounds' : 'rodadas'}</span>
			</div>
		</div>
		<div class="daily-action">
			{#if dailyResult}
				<div class="daily-result">
					<strong>{dailyResult.correct}/{dailyResult.rounds}</strong>
					<span>{dailyResult.score} pts</span>
				</div>
				<button class="btn" type="button" onclick={shareDaily}>
					<Icon name={copied ? 'check' : 'link'} size={13} /> {copied ? (text === 'en' ? 'Copied' : 'Copiado') : t('action.share', text)}
				</button>
			{:else}
				<a class="btn btn-accent" href={`/game/${dailyGame.slug}?daily=1`}>
					<Icon name="target" size={14} /> {t('play.openDaily', text)}
				</a>
				<span class="daily-hint">{text === 'en' ? 'No spoilers when sharing.' : 'Sem spoiler no compartilhamento.'}</span>
			{/if}
		</div>
	</section>

	<div class="toolbar">
		<div class="filters" role="tablist" aria-label={text === 'en' ? 'Filter by category' : 'Filtrar por categoria'}>
			{#each categories as category (category)}
				<button
					type="button"
					role="tab"
					aria-selected={activeCategory === category}
					class:active={activeCategory === category}
					style:--cat={category === 'Todos' ? 'var(--accent-1)' : gameAccent(category)}
					onclick={() => (activeCategory = category)}
				>
					{category === 'Todos' ? t('play.all', text) : categoryLabel(category)}
					<span>{counts[category]}</span>
				</button>
			{/each}
		</div>
		<span class="toolbar-count">{filtered.length} {text === 'en' ? 'games' : 'jogos'}</span>
	</div>

	<section class="grid" aria-label={text === 'en' ? 'Available games' : 'Jogos disponíveis'}>
		{#each filtered as game, i (game.slug)}
			{@const best = bestFor(game.slug)}
			{@const saved = progressFor(game.slug)}
			<a
				class="game"
				href={`/game/${game.slug}${saved ? '?resume=1' : ''}`}
				style:--cat={gameAccent(game.category)}
				style:--index={i}
			>
				<div class="cover-wrap">
					<GameCover slug={game.slug} icon={game.icon} />
				</div>
				<div class="top">
					<span class="number">{String(games.indexOf(game) + 1).padStart(2, '0')}</span>
					<span class="category">{categoryLabel(game.category)}</span>
					<span class="difficulty">{difficultyLabel(game.difficulty)}</span>
					<span class="icon"><Icon name={game.icon} size={18} /></span>
				</div>
				<h2>{game.title}</h2>
				<p class="tagline">{game.tagline}</p>
				<div class="bottom">
					<span class="meta">{game.mechanic}</span>
					<span class="meta">{game.rounds} · {game.minutes} min</span>
					{#if best !== null}
						<span class="best" title={t('play.best', text)}><Icon name="trophy" size={12} /> {best}</span>
					{/if}
					{#if saved}
						<span class="resume-chip">{t('play.resume', text)} · {saved.index + 1}/{saved.rounds.length}</span>
					{/if}
					<span class="play-cta">{t('play.play', text)} <Icon name="arrowRight" size={14} /></span>
				</div>
			</a>
		{/each}
	</section>

	{#if Object.keys(bests).length}
		<section class="records">
			<header>
				<span class="eyebrow">{t('play.records', text)}</span>
				<h2>{t('play.records', text)}</h2>
			</header>
			<div class="record-list">
				{#each games as game (game.slug)}
					{#if bestFor(game.slug) !== null}
						<a href={`/game/${game.slug}`}>
							<span>{game.title}</span>
							<em>{categoryLabel(game.category)}</em>
							<strong>{bestFor(game.slug)} pts</strong>
							<Icon name="arrowUpRight" size={12} />
						</a>
					{/if}
				{/each}
			</div>
			<p class="records-note">{t('play.recordsNote', text)}</p>
		</section>
	{/if}

	<section class="note">
		<Icon name="info" size={16} />
		<p>{t('play.note', text)}</p>
	</section>
</main>

<style>
	main {
		min-height: 100dvh;
		padding: calc(var(--header-h) + 2rem) clamp(1rem, 5vw, 4rem) 4rem;
		max-width: 84rem;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}
	.hero {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 2rem;
		padding-bottom: 1.4rem;
		border-bottom: 1px solid var(--line-strong);
	}
	.intro {
		max-width: 44rem;
	}
	.intro .eyebrow {
		font-size: 0.66rem;
	}
	h1 {
		margin: 0.45rem 0 0.55rem;
		font-family: var(--font-display);
		font-size: clamp(3.4rem, 8vw, 6.6rem);
		font-weight: 600;
		line-height: 0.82;
		letter-spacing: -0.055em;
		text-transform: uppercase;
	}
	h1 span,
	h1 em {
		display: block;
	}
	h1 em {
		font-style: italic;
		font-weight: 500;
		color: color-mix(in oklab, var(--accent-1) 82%, var(--text-1));
	}
	.intro p {
		margin: 0;
		font-size: 0.98rem;
		line-height: 1.55;
		color: var(--text-3);
		max-width: 36rem;
	}
	.stats {
		display: flex;
		gap: 1.5rem;
		padding-bottom: 0.2rem;
	}
	.stats div {
		display: flex;
		flex-direction: column;
		gap: 0.12rem;
	}
	.stats strong {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 600;
		line-height: 1;
	}
	.stats span {
		font-family: var(--font-mono);
		font-size: 0.56rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.resume {
		display: flex;
		align-items: center;
		gap: 1.2rem;
		margin: 1rem 0 0;
		padding: 0.7rem 0.85rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.25rem;
		background: var(--surface-1);
	}
	.resume-label {
		min-width: 12rem;
	}
	.resume-label strong {
		display: block;
		margin-top: 0.2rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
	}
	.resume-label p {
		margin: 0.1rem 0 0;
		font-family: var(--font-mono);
		font-size: 0.58rem;
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
		display: grid;
		grid-template-columns: 10rem minmax(0, 1fr) auto;
		align-items: stretch;
		gap: 1.2rem;
		margin: 1.1rem 0 1.5rem;
		border: 1px solid color-mix(in oklab, var(--cat) 35%, var(--line));
		border-left: 4px solid var(--cat);
		border-radius: 0.3rem;
		background:
			linear-gradient(90deg, color-mix(in oklab, var(--cat) 10%, transparent), transparent 65%),
			var(--surface-1);
		overflow: hidden;
	}
	.daily-art {
		height: 100%;
		min-height: 8rem;
	}
	.daily-art :global(.cover) {
		height: 100%;
		border: 0;
	}
	.daily-copy {
		padding: 1rem 0;
	}
	.daily-copy h2 {
		margin: 0.3rem 0 0.25rem;
		font-family: var(--font-display);
		font-size: 1.7rem;
		font-weight: 600;
	}
	.daily-copy p {
		margin: 0;
		max-width: 36rem;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--text-3);
	}
	.daily-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.6rem;
	}
	.chip {
		border: 1px solid color-mix(in oklab, var(--cat) 35%, var(--line));
		border-radius: 0.15rem;
		padding: 0.18rem 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-3);
	}
	.daily-action {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: center;
		gap: 0.4rem;
		padding: 1rem 1rem 1rem 0;
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
		font-size: 0.58rem;
		color: var(--text-4);
	}
	.daily-hint {
		max-width: 12rem;
		font-size: 0.62rem;
		color: var(--text-4);
		text-align: right;
	}
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.1rem;
		border-bottom: 1px solid var(--line);
	}
	.filters {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		flex-wrap: wrap;
	}
	.filters button {
		display: inline-flex;
		align-items: baseline;
		gap: 0.35rem;
		border: 0;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--text-3);
		padding: 0.6rem 0.6rem;
		font-size: 0.8rem;
		margin-bottom: -1px;
	}
	.filters button span {
		font-family: var(--font-mono);
		font-size: 0.54rem;
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
	.toolbar-count {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--text-4);
		white-space: nowrap;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
		gap: 0.8rem;
	}
	.game {
		position: relative;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--line);
		border-top: 3px solid var(--cat);
		border-radius: 0.3rem;
		background: var(--surface-1);
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		transition: border-color 0.2s ease, background 0.2s ease, transform 0.22s var(--ease-out-soft);
		animation: fade-up 0.4s var(--ease-out-soft) both;
		animation-delay: calc(var(--index) * 45ms);
	}
	.game:hover {
		border-color: color-mix(in oklab, var(--cat) 55%, var(--line));
		background: var(--surface-2);
		transform: translateY(-3px);
	}
	.cover-wrap {
		height: 108px;
		overflow: hidden;
	}
	.cover-wrap :global(.cover) {
		height: 100%;
		transition: transform 0.45s var(--ease-out-soft);
	}
	.game:hover .cover-wrap :global(.cover) {
		transform: scale(1.04);
	}
	.top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 0.85rem 0;
	}
	.number {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--text-4);
	}
	.category,
	.difficulty {
		font-family: var(--font-mono);
		font-size: 0.56rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.14rem 0.36rem;
		border: 1px solid color-mix(in oklab, var(--cat) 45%, transparent);
		border-radius: 0.15rem;
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
		width: 2.2rem;
		height: 2.2rem;
		border: 1px solid color-mix(in oklab, var(--cat) 40%, var(--line));
		border-radius: 0.2rem;
		color: var(--cat);
		background: var(--surface-2);
	}
	.game h2 {
		margin: 0.65rem 0.85rem 0;
		font-family: var(--font-display);
		font-size: 1.45rem;
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.02em;
	}
	.tagline {
		margin: 0.18rem 0.85rem 0.9rem;
		font-size: 0.78rem;
		line-height: 1.4;
		color: var(--cat);
	}
	.bottom {
		margin-top: auto;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 0.85rem;
		border-top: 1px solid var(--line);
	}
	.meta {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.02em;
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
		font-size: 0.62rem;
		color: var(--accent-0);
	}
	.resume-chip {
		color: var(--cat);
	}
	.play-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-left: auto;
		padding: 0.3rem 0.5rem;
		border: 1px solid color-mix(in oklab, var(--cat) 45%, transparent);
		border-radius: 0.15rem;
		background: color-mix(in oklab, var(--cat) 10%, transparent);
		color: var(--cat);
		font-size: 0.66rem;
		font-weight: 600;
	}
	.game:hover .play-cta {
		background: color-mix(in oklab, var(--cat) 18%, transparent);
	}
	.play-cta :global(svg) {
		transition: transform 0.2s ease;
	}
	.game:hover .play-cta :global(svg) {
		transform: translateX(2px);
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
		font-size: 1.35rem;
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
		padding: 0.5rem 0.1rem;
		border-bottom: 1px solid var(--line);
		text-decoration: none;
		color: var(--text-2);
		font-size: 0.78rem;
	}
	.record-list a:hover {
		color: var(--text-1);
	}
	.record-list em {
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.56rem;
		color: var(--text-4);
	}
	.record-list strong {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		color: var(--accent-0);
	}
	.records-note {
		margin: 0.5rem 0 0;
		font-size: 0.62rem;
		color: var(--text-4);
	}
	.note {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		margin-top: 2rem;
		padding: 0.8rem 0.9rem;
		border: 1px solid var(--line);
		border-radius: 0.2rem;
		color: var(--text-3);
	}
	.note p {
		margin: 0;
		font-size: 0.68rem;
		line-height: 1.5;
	}
	@media (max-width: 1000px) {
		.daily {
			grid-template-columns: 8rem minmax(0, 1fr);
		}
		.daily-action {
			grid-column: 1 / -1;
			align-items: flex-start;
			padding: 0 1rem 1rem;
		}
		.daily-hint {
			text-align: left;
		}
	}
	@media (max-width: 760px) {
		main {
			padding: calc(var(--header-h) + 1.4rem) 1rem 2rem;
		}
		.hero {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		.stats {
			gap: 1.2rem;
		}
		.daily {
			grid-template-columns: 1fr;
		}
		.daily-art {
			height: 5.5rem;
			min-height: 0;
		}
		.daily-copy {
			padding: 0 1rem;
		}
		.daily-action {
			grid-column: auto;
			padding: 0 1rem 1rem;
		}
		.grid {
			grid-template-columns: 1fr;
		}
		h1 {
			font-size: clamp(3rem, 17vw, 4.5rem);
		}
		.toolbar {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.2rem;
		}
		.toolbar-count {
			padding-bottom: 0.5rem;
		}
		.resume {
			flex-wrap: wrap;
		}
		.resume-track {
			order: 3;
			flex-basis: 100%;
		}
	}
</style>
