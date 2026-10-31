<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import MapCanvas from '#lib/components/map/MapCanvas.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { countries, getCountry, searchCountries } from '#lib/data/countries';
	import { toggleCode, validateAnswer } from '#lib/engines/game-engine/validate';
	import type {
		AnswerKind,
		GameDefinition,
		GameRound,
		GameSource,
		ValidationRule
	} from '#lib/engines/game-engine/types';
	import {
		defaultScoreRules,
		formatClock,
		scoreRound,
		summarize,
		type RoundOutcome
	} from '#lib/engines/scoring-engine';
	import { getLayer } from '#lib/configurations/map-layers';
	import { theme } from '#lib/theme.svelte';
	import {
		clearProgress,
		dailyKey,
		dailySeed,
		getBest,
		loadProgress,
		saveProgress,
		setBest,
		setDailyResult
	} from '#lib/progress';

	interface Props {
		game: GameDefinition;
	}
	let { game }: Props = $props();

	const rules = defaultScoreRules;
	const mapLayer = $derived(getLayer('political', theme.resolved));

	let rounds = $state<GameRound[]>([]);
	let index = $state(0);
	let results = $state<RoundOutcome[]>([]);
	let score = $state(0);
	let displayScore = $state(0);
	let streak = $state(0);
	let selectedCodes = $state<string[]>([]);
	let textAnswer = $state('');
	let orderItems = $state<string[]>([]);
	let status = $state<Record<string, 'correct' | 'wrong'>>({});
	let feedback = $state<{
		correct: boolean;
		explanation: string;
		source?: GameSource;
		points: number;
	} | null>(null);
	let finished = $state(false);
	let best = $state<number | null>(null);
	let now = $state(Date.now());
	let roundStartedAt = 0;
	let mapRef = $state<MapCanvas | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);
	let listInput = $state<HTMLInputElement | null>(null);
	let listMode = $state(false);
	let listQuery = $state('');
	let showIntro = $state(false);
	let daily = $state(false);
	let seed: number | undefined;
	let shareStatus = $state<'copied' | 'shared' | null>(null);

	const current = $derived(rounds[index] ?? null);
	const summary = $derived(summarize(results, rules));
	const elapsed = $derived(Math.max(0, now - roundStartedAt));
	const progress = $derived(rounds.length ? (index + (feedback ? 1 : 0)) / rounds.length : 0);
	const isMapRound = $derived(
		current?.interaction === 'map-single' || current?.interaction === 'map-multi'
	);
	const focusCodes = $derived.by(() => {
		if (!current) return null;
		if (current.focus) return current.focus;
		if (current.choices) return current.choices;
		if (current.interaction === 'text') return targetCodes(current.rule);
		return null;
	});
	const listCandidates = $derived.by(() => {
		const round = current;
		if (!round) return [];
		const focused = round.focus ?? round.choices ?? [];
		let pool = focused.length
			? (focused.map((code) => getCountry(code)).filter(Boolean) as NonNullable<
					ReturnType<typeof getCountry>
				>[])
			: listQuery.trim()
				? searchCountries(listQuery, 12)
				: [...countries]
						.filter((c) => c.unMember)
						.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
						.slice(0, 12);
		if (focused.length && listQuery.trim()) {
			const q = listQuery
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase();
			pool = pool.filter((c) =>
				c.name
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.toLowerCase()
					.includes(q)
			);
		}
		return pool.slice(0, 12);
	});

	onMount(() => {
		const params = page.url.searchParams;
		daily = params.get('daily') === '1';
		seed = daily ? dailySeed() : undefined;
		const resume = params.get('resume') === '1';
		const saved = resume ? loadProgress(game.slug) : null;

		if (saved && saved.rounds.length) {
			rounds = saved.rounds;
			index = Math.min(saved.index, saved.rounds.length - 1);
			score = saved.score;
			displayScore = saved.score;
			streak = saved.streak;
			results = saved.results;
			status = saved.status;
			feedback = saved.feedback ?? null;
			finished = saved.finished;
			orderItems = [...(saved.rounds[index]?.items ?? [])];
		} else {
			rounds = game.build(seed);
			orderItems = [...(rounds[0]?.items ?? [])];
		}

		best = getBest(game.slug);
		roundStartedAt = Date.now();
		showIntro =
			!saved && !localStorage.getItem(`mundivista:intro:${game.interaction}`);
		const timer = setInterval(() => (now = Date.now()), 250);
		return () => clearInterval(timer);
	});

	$effect(() => {
		const round = current;
		if (!round || !mapRef || finished || showIntro) return;
		if (round.camera) mapRef.flyTo(round.camera.center, round.camera.zoom);
		else mapRef.resetView();
		if (round.interaction === 'text') {
			setTimeout(() => inputEl?.focus(), 80);
		}
	});

	function targetCodes(rule: ValidationRule): string[] {
		if (rule.type === 'code') return [rule.code];
		if (rule.type === 'set' || rule.type === 'order') return rule.codes;
		return [];
	}

	function persist() {
		if (!rounds.length) return;
		saveProgress({
			slug: game.slug,
			index,
			score,
			streak,
			results,
			status,
			feedback,
			rounds,
			finished,
			savedAt: Date.now(),
			daily,
			seed
		});
	}

	function animateScore(to: number) {
		const from = displayScore;
		if (from === to) return;
		const start = performance.now();
		const step = (time: number) => {
			const k = Math.min(1, (time - start) / 420);
			displayScore = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
			if (k < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}

	function onMapSelect(code: string) {
		const round = current;
		if (!round || feedback || showIntro) return;
		if (round.interaction === 'map-single') {
			submit({ kind: 'code', value: code });
		} else if (round.interaction === 'map-multi') {
			selectedCodes = toggleCode(selectedCodes, code);
		}
	}

	function onListSelect(code: string) {
		if (current?.interaction === 'map-multi') {
			selectedCodes = toggleCode(selectedCodes, code);
			return;
		}
		onMapSelect(code);
	}

	function submit(answer: { kind: AnswerKind; value: string | string[] }) {
		const round = current;
		if (!round || feedback) return;
		const elapsedMs = Date.now() - roundStartedAt;
		const validation = validateAnswer(round.rule, answer);
		const scored = scoreRound(
			{ correct: validation.correct, elapsedMs, streakBefore: streak },
			rules
		);
		streak = scored.streakAfter;
		score += scored.points;
		animateScore(score);
		results = [...results, { correct: validation.correct, elapsedMs }];

		const targets = targetCodes(round.rule);
		const nextStatus: Record<string, 'correct' | 'wrong'> = {};
		for (const code of targets) nextStatus[code] = 'correct';
		if (!validation.correct) {
			if (answer.kind === 'codes' && Array.isArray(answer.value)) {
				for (const code of answer.value) {
					if (!targets.includes(code)) nextStatus[code] = 'wrong';
				}
			} else if (
				answer.kind === 'code' &&
				typeof answer.value === 'string' &&
				!targets.includes(answer.value)
			) {
				nextStatus[answer.value] = 'wrong';
			}
		}
		status = nextStatus;
		feedback = {
			correct: validation.correct,
			explanation: round.explanation,
			source: round.source,
			points: scored.points
		};
		persist();
	}

	function submitText(event: SubmitEvent) {
		event.preventDefault();
		if (!textAnswer.trim()) return;
		submit({ kind: 'text', value: textAnswer });
	}

	function submitSelection() {
		submit({ kind: 'codes', value: selectedCodes });
	}

	function submitOrder() {
		submit({ kind: 'order', value: orderItems });
	}

	function choose(code: string) {
		if (feedback) return;
		submit({ kind: 'code', value: code });
	}

	function moveItem(position: number, delta: number) {
		const target = position + delta;
		if (target < 0 || target >= orderItems.length) return;
		const copy = [...orderItems];
		[copy[position], copy[target]] = [copy[target], copy[position]];
		orderItems = copy;
	}

	function next() {
		if (index + 1 >= rounds.length) {
			finish();
			return;
		}
		index += 1;
		resetRound();
		persist();
	}

	function resetRound() {
		selectedCodes = [];
		textAnswer = '';
		status = {};
		feedback = null;
		listQuery = '';
		orderItems = [...(rounds[index]?.items ?? [])];
		roundStartedAt = Date.now();
		now = Date.now();
	}

	function finish() {
		finished = true;
		const total = summarize(results, rules).total;
		if (!best || total > best) {
			best = total;
			setBest(game.slug, total);
		}
		if (daily) {
			setDailyResult({
				slug: game.slug,
				score: total,
				correct: results.filter((r) => r.correct).length,
				rounds: results.length,
				at: Date.now()
			});
		}
		persist();
	}

	function restart() {
		clearProgress(game.slug);
		rounds = game.build(seed);
		index = 0;
		results = [];
		score = 0;
		displayScore = 0;
		streak = 0;
		finished = false;
		resetRound();
		persist();
	}

	function startGame() {
		showIntro = false;
		try {
			localStorage.setItem(`mundivista:intro:${game.interaction}`, '1');
		} catch {
			/* storage bloqueado */
		}
		if (current?.interaction === 'text') setTimeout(() => inputEl?.focus(), 60);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && feedback) {
			event.preventDefault();
			next();
			return;
		}
		if (
			!feedback &&
			current?.interaction === 'choice' &&
			current.options &&
			/^[1-4]$/.test(event.key)
		) {
			const option = current.options[Number(event.key) - 1];
			if (option) {
				event.preventDefault();
				choose(option.value);
			}
		}
	}

	function nameOf(code: string): string {
		return getCountry(code)?.name ?? code;
	}

	function flagOf(code: string): string {
		const iso2 = getCountry(code)?.iso2;
		return iso2 ? `fi fi-${iso2}` : '';
	}

	async function shareResult() {
		const grid = results.map((r) => (r.correct ? '🟩' : '🟥')).join('');
		const label = daily
			? `Desafio diário · ${new Date().toLocaleDateString('pt-BR')}`
			: game.title;
		const line = `${label}\n${summary.correct}/${summary.rounds} · ${summary.total} pontos\n${grid}`;
		const url =
			typeof location !== 'undefined'
				? `${location.origin}/game/${game.slug}${daily ? '?daily=1' : ''}`
				: '';
		try {
			if (navigator.share) {
				await navigator.share({ title: 'Mundivista', text: line, url });
				shareStatus = 'shared';
			} else {
				await navigator.clipboard.writeText(`${line}\n${url}`);
				shareStatus = 'copied';
				setTimeout(() => (shareStatus = null), 2000);
			}
		} catch {
			/* cancelado */
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>{game.title} — Mundivista</title>
	<meta name="description" content={game.description} />
</svelte:head>

<div class="game" id="conteudo">
	<MapCanvas
		bind:this={mapRef}
		layer={mapLayer}
		interactive={isMapRound && !feedback && !showIntro}
		showLabels={!current?.focus}
		focus={focusCodes}
		highlight={
			current?.interaction === 'order'
				? (current.items ?? [])
				: current?.interaction === 'map-multi'
					? selectedCodes
					: []
		}
		{status}
		onselect={onMapSelect}
	/>

	<header>
		<a class="exit" href="/play" aria-label="Sair do jogo">
			<Icon name="arrowLeft" size={15} />
			<span>Sair</span>
		</a>
		<div class="title">
			<span class="eyebrow">{game.category}{daily ? ' · desafio diário' : ''}</span>
			<strong>{game.title}</strong>
		</div>
		<div class="hud">
			<div class="timer" title="Tempo da rodada">
				<Icon name="clock" size={13} />
				<span>{formatClock(elapsed)}</span>
			</div>
			<div class="score">
				<span class="label">Pontos</span>
				<strong>{displayScore}</strong>
			</div>
			{#if streak > 1}
				<div class="streak">×{streak}</div>
			{/if}
		</div>
	</header>
	<div class="progress" aria-hidden="true"><span style:width={`${progress * 100}%`}></span></div>

	{#if current && !finished && !showIntro}
		<section class="prompt panel animate-fade-up">
			<div class="prompt-head">
				<span class="round">Rodada {index + 1} de {rounds.length}</span>
				<span class="mechanic">{game.mechanic}</span>
			</div>
			<h1>{current.prompt}</h1>
			{#if current.hint}<p class="hint">{current.hint}</p>{/if}

			{#if current.interaction === 'text'}
				<form onsubmit={submitText}>
					<div class="input-row">
						<input
							bind:this={inputEl}
							bind:value={textAnswer}
							placeholder="Digite a capital"
							autocomplete="off"
							spellcheck="false"
							disabled={!!feedback}
							aria-label="Sua resposta"
						/>
						<button type="submit" disabled={!textAnswer.trim() || !!feedback} aria-label="Enviar resposta">
							<Icon name="arrowRight" size={16} />
						</button>
					</div>
				</form>
				<p class="micro">Aceita português ou inglês, com ou sem acento.</p>
			{:else if current.interaction === 'choice'}
				{#if current.silhouette}
					<div class="silhouette" aria-hidden="true">
						<svg viewBox="0 0 100 100" role="img">
							<path d={current.silhouette} />
						</svg>
					</div>
				{/if}
				<div class="options" role="group" aria-label="Alternativas">
					{#each current.options ?? [] as option, i (option.value)}
						<button
							type="button"
							class:selected={status[option.value] === 'wrong'}
							class:correct={status[option.value] === 'correct'}
							disabled={!!feedback}
							onclick={() => choose(option.value)}
						>
							<span class="key">{i + 1}</span>
							{#if flagOf(option.value)}<span class={flagOf(option.value)}></span>{/if}
							<span>{option.label}</span>
							{#if status[option.value] === 'correct'}<Icon name="check" size={13} />{/if}
							{#if status[option.value] === 'wrong'}<Icon name="x" size={13} />{/if}
						</button>
					{/each}
				</div>
			{:else if current.interaction === 'map-multi'}
				<div class="confirm">
					<span>{selectedCodes.length} selecionado{selectedCodes.length === 1 ? '' : 's'}</span>
					<button
						type="button"
						disabled={!selectedCodes.length || !!feedback}
						onclick={submitSelection}
					>
						<Icon name="check" size={14} />
						Confirmar
					</button>
				</div>
			{:else if current.interaction === 'order'}
				<ul class="order">
					{#each orderItems as code, position (code)}
						<li>
							<span class="pos">{position + 1}</span>
							<span class={flagOf(code)}></span>
							<span class="name">{nameOf(code)}</span>
							<span class="moves">
								<button
									type="button"
									onclick={() => moveItem(position, -1)}
									disabled={position === 0 || !!feedback}
									aria-label={`Subir ${nameOf(code)}`}
								>
									↑
								</button>
								<button
									type="button"
									onclick={() => moveItem(position, 1)}
									disabled={position === orderItems.length - 1 || !!feedback}
									aria-label={`Descer ${nameOf(code)}`}
								>
									↓
								</button>
							</span>
						</li>
					{/each}
				</ul>
				<button class="submit-order" type="button" disabled={!!feedback} onclick={submitOrder}>
					<Icon name="check" size={14} />
					Confirmar ordem
				</button>
			{:else}
				<div class="map-tools">
					<div class="map-instruction">
						<span class="pulse"></span>
						Clique no país no mapa
					</div>
					<button
						type="button"
						class="mode-toggle"
						class:active={listMode}
						onclick={() => {
							listMode = !listMode;
							if (listMode) setTimeout(() => listInput?.focus(), 40);
						}}
						aria-pressed={listMode}
					>
						<Icon name="list" size={13} /> Modo lista
					</button>
				</div>
			{/if}

			{#if isMapRound && listMode}
				<div class="list-mode">
					<div class="list-search">
						<Icon name="search" size={13} />
						<input
							bind:this={listInput}
							bind:value={listQuery}
							type="search"
							placeholder="Buscar país…"
							autocomplete="off"
							aria-label="Buscar país na lista"
						/>
					</div>
					<ul role="listbox" aria-label="Países">
						{#each listCandidates as candidate (candidate.code)}
							<li>
								<button
									type="button"
									class:selected={selectedCodes.includes(candidate.code)}
									class:correct={status[candidate.code] === 'correct'}
									class:wrong={status[candidate.code] === 'wrong'}
									disabled={!!feedback}
									onclick={() => onListSelect(candidate.code)}
								>
									{#if candidate.iso2}<span class={`fi fi-${candidate.iso2}`}></span>{/if}
									<span>{candidate.name}</span>
									{#if selectedCodes.includes(candidate.code)}<Icon name="check" size={12} />{/if}
								</button>
							</li>
						{:else}
							<li class="empty">Nenhum país encontrado.</li>
						{/each}
					</ul>
				</div>
			{/if}
		</section>
	{/if}

	{#if feedback}
		<div
			class="feedback panel animate-sheet-in"
			class:correct={feedback.correct}
			class:wrong={!feedback.correct}
			role="status"
			aria-live="polite"
		>
			<div class="verdict">
				<span class="badge">
					{#if feedback.correct}
						<Icon name="check" size={14} /> Correto
					{:else}
						<Icon name="x" size={14} /> Incorreto
					{/if}
				</span>
				{#if feedback.correct}<span class="points">+{feedback.points}</span>{/if}
			</div>
			<p>{feedback.explanation}</p>
			<div class="feedback-foot">
				{#if feedback.source}
					<a href={feedback.source.url} target="_blank" rel="noopener noreferrer">
						{feedback.source.name} <Icon name="external" size={10} />
					</a>
				{/if}
				<button type="button" onclick={next}>
					{index + 1 >= rounds.length ? 'Ver resultado' : 'Próxima'}
					<Icon name="arrowRight" size={14} />
				</button>
			</div>
		</div>
	{/if}

	{#if showIntro && !finished}
		<div class="intro-backdrop">
			<div class="intro panel animate-fade-up">
				<span class="eyebrow">{game.category} · {game.mechanic}</span>
				<h2>{game.title}</h2>
				<p>{game.description}</p>
				<ul>
					{#if current?.interaction === 'map-single'}
						<li><Icon name="pin" size={14} /> Clique no país pedido no mapa — ou ative o modo lista e responda pelo teclado.</li>
					{:else if current?.interaction === 'map-multi'}
						<li><Icon name="layers" size={14} /> Selecione todos os países do bloco e confirme. Cuidado com o intruso.</li>
					{:else if current?.interaction === 'text'}
						<li><Icon name="type" size={14} /> Digite a capital. Aceita português ou inglês, com ou sem acento.</li>
					{:else if current?.interaction === 'order'}
						<li><Icon name="sort" size={14} /> Reordene do maior para o menor com as setas. A ordem inicial é embaralhada.</li>
					{:else}
						<li><Icon name="target" size={14} /> Escolha uma das quatro alternativas. Você também pode usar as teclas 1 a 4.</li>
					{/if}
					<li><Icon name="trophy" size={14} /> {game.rounds} rodadas · bônus por velocidade e sequência.</li>
				</ul>
				<div class="intro-actions">
					<button type="button" class="primary" onclick={startGame}>
						Começar <Icon name="arrowRight" size={14} />
					</button>
					<a href="/sobre">De onde vêm os dados</a>
				</div>
			</div>
		</div>
	{/if}

	{#if finished}
		<div class="result-backdrop">
			<div class="result panel animate-sheet-in">
				<span class="eyebrow">Fim do jogo · {game.title}{daily ? ' · diário' : ''}</span>
				<div class="result-score">
					<strong>{summary.total}</strong>
					<span>pontos</span>
				</div>
				<h2>{summary.tier.label}</h2>
				<p class="tier-desc">{summary.tier.description}</p>

				<div class="result-stats">
					<div><strong>{Math.round(summary.accuracy * 100)}%</strong><span>acertos</span></div>
					<div><strong>{summary.correct}/{summary.rounds}</strong><span>rodadas</span></div>
					<div><strong>{summary.maxStreak}</strong><span>sequência</span></div>
					<div><strong>{formatClock(summary.elapsedMs)}</strong><span>tempo</span></div>
				</div>

				{#if best && summary.total >= best}
					<p class="record"><Icon name="trophy" size={13} /> Novo recorde pessoal</p>
				{:else if best}
					<p class="record muted">Recorde pessoal: {best} pontos</p>
				{/if}

				<div class="round-dots" aria-label="Resultado por rodada">
					{#each results as result, i (i)}
						<span class:ok={result.correct} class:no={!result.correct} title={`Rodada ${i + 1}`}></span>
					{/each}
				</div>

				<div class="result-actions">
					<button type="button" class="primary" onclick={restart}>
						<Icon name="refresh" size={14} />
						Jogar de novo
					</button>
					<button type="button" class="ghost" onclick={shareResult}>
						<Icon name={shareStatus === 'copied' ? 'check' : 'link'} size={13} />
						{shareStatus === 'copied' ? 'Copiado' : daily ? 'Compartilhar desafio' : 'Compartilhar'}
					</button>
					<a href="/play">Outros jogos</a>
					<a href="/explore">Explorar o mapa</a>
				</div>
				{#if daily}
					<p class="daily-note">O desafio diário usa a mesma sequência para todos. Volte amanhã para uma nova.</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.game {
		position: fixed;
		inset: 0;
		background: var(--map-paper);
	}
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 40;
		height: var(--header-h);
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 0.85rem;
		border-bottom: 1px solid var(--line);
		background: color-mix(in oklab, var(--surface-0) 94%, transparent);
	}
	.exit {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--text-3);
		text-decoration: none;
		font-size: 0.68rem;
		padding: 0.32rem 0.45rem;
		border: 1px solid transparent;
	}
	.exit:hover {
		color: var(--text-1);
		background: var(--surface-2);
		border-color: var(--line);
	}
	.title {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
		min-width: 0;
	}
	.title strong {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.title .eyebrow {
		font-size: 0.46rem;
	}
	.hud {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}
	.timer {
		display: flex;
		align-items: center;
		gap: 0.28rem;
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--text-3);
	}
	.score {
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
	}
	.score .label {
		font-family: var(--font-mono);
		font-size: 0.46rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.score strong {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--accent-0);
		font-variant-numeric: tabular-nums;
	}
	.streak {
		font-family: var(--font-mono);
		font-size: 0.54rem;
		color: var(--accent-0);
		border: 1px solid color-mix(in oklab, var(--accent-1) 40%, transparent);
		padding: 0.08rem 0.32rem;
		animation: pulse-soft 1.2s ease-in-out infinite;
	}
	.progress {
		position: fixed;
		top: var(--header-h);
		left: 0;
		right: 0;
		height: 2px;
		background: var(--line);
		z-index: 41;
	}
	.progress span {
		display: block;
		height: 100%;
		background: var(--accent-1);
		transition: width 0.35s var(--ease-out-soft);
	}
	.prompt {
		position: fixed;
		top: calc(var(--header-h) + 0.7rem);
		left: 0.75rem;
		z-index: 32;
		width: 23.5rem;
		max-width: calc(100vw - 1.5rem);
		max-height: calc(100dvh - var(--header-h) - 1.4rem);
		overflow-y: auto;
		padding: 0.8rem 0.9rem 0.9rem;
	}
	.prompt-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.round {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent-0);
	}
	.mechanic {
		font-family: var(--font-mono);
		font-size: 0.46rem;
		letter-spacing: 0.06em;
		color: var(--text-4);
	}
	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: -0.015em;
	}
	.hint {
		margin: 0.3rem 0 0;
		font-size: 0.62rem;
		line-height: 1.45;
		color: var(--text-3);
	}
	.input-row {
		display: flex;
		gap: 0.3rem;
		margin-top: 0.7rem;
	}
	input {
		flex: 1;
		min-width: 0;
		background: var(--surface-1);
		border: 1px solid var(--line-strong);
		padding: 0.45rem 0.55rem;
		color: var(--text-1);
		font-size: 0.76rem;
		outline: none;
	}
	input:focus {
		border-color: var(--accent-1);
		background: var(--surface-2);
	}
	input::placeholder {
		color: var(--text-4);
	}
	.input-row button {
		display: grid;
		place-items: center;
		width: 2.1rem;
		border: 1px solid color-mix(in oklab, var(--accent-1) 45%, transparent);
		background: color-mix(in oklab, var(--accent-1) 12%, var(--surface-2));
		color: var(--accent-0);
	}
	.input-row button:disabled {
		opacity: 0.35;
	}
	.micro {
		margin: 0.35rem 0 0;
		font-size: 0.52rem;
		color: var(--text-4);
	}
	.map-tools {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}
	.map-instruction {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.6rem;
		color: var(--water-1);
		font-family: var(--font-mono);
		letter-spacing: 0.04em;
	}
	.pulse {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--water-0);
		animation: pulse-soft 1.4s ease-in-out infinite;
	}
	.mode-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-3);
		font-size: 0.56rem;
		padding: 0.25rem 0.4rem;
	}
	.mode-toggle.active {
		color: var(--accent-0);
		border-color: color-mix(in oklab, var(--accent-1) 45%, transparent);
		background: color-mix(in oklab, var(--accent-1) 10%, var(--surface-1));
	}
	.list-mode {
		margin-top: 0.55rem;
		border-top: 1px solid var(--line);
		padding-top: 0.55rem;
	}
	.list-search {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		padding: 0.3rem 0.45rem;
		color: var(--text-4);
	}
	.list-search input {
		border: 0;
		background: transparent;
		padding: 0;
		font-size: 0.68rem;
	}
	.list-mode ul {
		list-style: none;
		margin: 0.35rem 0 0;
		padding: 0;
		max-height: 11rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.list-mode li button {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
		border: 1px solid transparent;
		background: var(--surface-1);
		color: var(--text-2);
		padding: 0.3rem 0.4rem;
		font-size: 0.66rem;
		text-align: left;
	}
	.list-mode li button:hover {
		border-color: var(--line-strong);
		color: var(--text-1);
	}
	.list-mode li button.selected {
		border-color: var(--accent-1);
		background: color-mix(in oklab, var(--accent-1) 9%, var(--surface-1));
	}
	.list-mode li button.correct {
		border-color: var(--positive);
	}
	.list-mode li button.wrong {
		border-color: var(--negative);
	}
	.list-mode li button :global(svg) {
		margin-left: auto;
	}
	.list-mode .empty {
		font-size: 0.6rem;
		color: var(--text-4);
		padding: 0.3rem;
	}
	.confirm {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.75rem;
		font-size: 0.62rem;
		color: var(--text-3);
	}
	.confirm button,
	.submit-order {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		border: 1px solid color-mix(in oklab, var(--accent-1) 45%, transparent);
		background: color-mix(in oklab, var(--accent-1) 12%, var(--surface-2));
		color: var(--accent-0);
		padding: 0.35rem 0.55rem;
		font-size: 0.62rem;
	}
	.confirm button:disabled,
	.submit-order:disabled {
		opacity: 0.35;
	}
	.silhouette {
		margin-top: 0.7rem;
		padding: 0.4rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
	}
	.silhouette svg {
		display: block;
		width: 100%;
		height: 9.5rem;
	}
	.silhouette path {
		fill: color-mix(in oklab, var(--accent-1) 22%, var(--surface-2));
		stroke: var(--accent-0);
		stroke-width: 1.1;
		vector-effect: non-scaling-stroke;
	}
	.options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.3rem;
		margin-top: 0.7rem;
	}
	.options button {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-2);
		padding: 0.45rem 0.5rem;
		font-size: 0.66rem;
		text-align: left;
		transition: border-color 0.15s ease, background 0.15s ease;
	}
	.options button:hover:not(:disabled) {
		border-color: var(--line-strong);
		color: var(--text-1);
		background: var(--surface-3);
	}
	.options button .key {
		font-family: var(--font-mono);
		font-size: 0.46rem;
		color: var(--text-4);
		border: 1px solid var(--line);
		padding: 0.05rem 0.22rem;
	}
	.options button .fi {
		flex-shrink: 0;
	}
	.options button.correct {
		border-color: var(--positive);
		background: color-mix(in oklab, var(--positive) 12%, var(--surface-1));
		color: var(--text-1);
	}
	.options button.selected {
		border-color: var(--negative);
		background: color-mix(in oklab, var(--negative) 10%, var(--surface-1));
	}
	.options button :global(svg) {
		margin-left: auto;
	}
	.order {
		list-style: none;
		margin: 0.65rem 0 0.45rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.order li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.4rem;
		background: var(--surface-1);
		border: 1px solid var(--line);
	}
	.pos {
		font-family: var(--font-mono);
		font-size: 0.52rem;
		color: var(--accent-0);
		width: 0.8rem;
	}
	.order .name {
		font-size: 0.66rem;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.moves {
		display: flex;
		gap: 2px;
	}
	.moves button {
		width: 1.25rem;
		height: 1.25rem;
		display: grid;
		place-items: center;
		border: 1px solid var(--line);
		background: var(--surface-2);
		color: var(--text-3);
		font-size: 0.62rem;
	}
	.moves button:disabled {
		opacity: 0.25;
	}
	.submit-order {
		width: 100%;
		justify-content: center;
	}
	.feedback {
		position: fixed;
		bottom: 0.75rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 38;
		width: min(36rem, calc(100vw - 1.5rem));
		padding: 0.7rem 0.8rem;
		border-left: 3px solid var(--line-strong);
	}
	.feedback.correct {
		border-left-color: var(--positive);
		animation: fade-up 0.24s var(--ease-out-soft) both;
	}
	.feedback.wrong {
		border-left-color: var(--negative);
		animation: shake 0.28s ease both;
	}
	@keyframes shake {
		0%,
		100% {
			transform: translateX(-50%);
		}
		30% {
			transform: translateX(calc(-50% - 5px));
		}
		70% {
			transform: translateX(calc(-50% + 5px));
		}
	}
	.verdict {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.3rem;
	}
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		font-family: var(--font-mono);
		font-size: 0.54rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.correct .badge {
		color: var(--positive);
	}
	.wrong .badge {
		color: var(--negative);
	}
	.points {
		margin-left: auto;
		font-family: var(--display, var(--font-display));
		font-size: 0.9rem;
		color: var(--accent-0);
	}
	.feedback p {
		margin: 0;
		font-size: 0.7rem;
		line-height: 1.5;
		color: var(--text-2);
	}
	.feedback-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
	.feedback-foot a {
		display: inline-flex;
		align-items: center;
		gap: 0.22rem;
		font-size: 0.52rem;
		color: var(--text-4);
		text-decoration: none;
	}
	.feedback-foot a:hover {
		color: var(--text-2);
	}
	.feedback-foot button {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		border: 1px solid color-mix(in oklab, var(--accent-1) 45%, transparent);
		background: color-mix(in oklab, var(--accent-1) 12%, var(--surface-2));
		color: var(--accent-0);
		padding: 0.34rem 0.6rem;
		font-size: 0.62rem;
	}
	.intro-backdrop {
		position: fixed;
		inset: 0;
		z-index: 55;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: color-mix(in oklab, var(--surface-0) 60%, transparent);
	}
	.intro {
		width: min(27rem, 100%);
		padding: 1.2rem 1.25rem;
	}
	.intro h2 {
		margin: 0.45rem 0 0.4rem;
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 600;
	}
	.intro p {
		margin: 0;
		font-size: 0.72rem;
		line-height: 1.55;
		color: var(--text-3);
	}
	.intro ul {
		list-style: none;
		margin: 0.8rem 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.intro li {
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: var(--text-2);
	}
	.intro li :global(svg) {
		color: var(--accent-0);
		flex-shrink: 0;
		margin-top: 0.1rem;
	}
	.intro-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		padding-top: 0.7rem;
		border-top: 1px solid var(--line);
	}
	.intro-actions a {
		font-size: 0.56rem;
		color: var(--text-3);
		text-decoration: none;
	}
	.result-backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: color-mix(in oklab, var(--surface-0) 72%, transparent);
	}
	.result {
		width: min(30rem, 100%);
		padding: 1.4rem;
		text-align: center;
	}
	.result-score {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.45rem;
		margin: 0.5rem 0 0.15rem;
	}
	.result-score strong {
		font-family: var(--font-display);
		font-size: 3.2rem;
		font-weight: 500;
		letter-spacing: -0.04em;
		color: var(--accent-0);
		line-height: 1;
	}
	.result-score span {
		font-family: var(--font-mono);
		font-size: 0.54rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.result h2 {
		margin: 0.45rem 0 0.15rem;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
	}
	.tier-desc {
		margin: 0 auto;
		max-width: 22rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: var(--text-3);
	}
	.result-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		margin: 1rem 0 0.7rem;
		padding: 0.7rem 0;
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}
	.result-stats div {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.result-stats strong {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text-1);
	}
	.result-stats span {
		font-family: var(--font-mono);
		font-size: 0.44rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.record {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		font-size: 0.6rem;
		color: var(--accent-0);
		margin: 0;
	}
	.record.muted {
		color: var(--text-4);
	}
	.round-dots {
		display: flex;
		justify-content: center;
		gap: 0.28rem;
		margin: 0.65rem 0 0.9rem;
	}
	.round-dots span {
		width: 0.5rem;
		height: 0.5rem;
	}
	.round-dots .ok {
		background: var(--positive);
	}
	.round-dots .no {
		background: var(--negative);
	}
	.result-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.result-actions .primary,
	.result-actions .ghost {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		border: 1px solid color-mix(in oklab, var(--accent-1) 45%, transparent);
		background: color-mix(in oklab, var(--accent-1) 14%, var(--surface-2));
		color: var(--accent-0);
		padding: 0.45rem 0.7rem;
		font-size: 0.66rem;
	}
	.result-actions .ghost {
		border-color: var(--line-strong);
		background: var(--surface-1);
		color: var(--text-2);
	}
	.result-actions a {
		font-size: 0.62rem;
		color: var(--text-3);
		text-decoration: none;
	}
	.result-actions a:hover {
		color: var(--text-1);
	}
	.daily-note {
		margin: 0.7rem 0 0;
		font-size: 0.52rem;
		color: var(--text-4);
	}
	.intro-actions .primary {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		border: 1px solid color-mix(in oklab, var(--accent-1) 45%, transparent);
		background: color-mix(in oklab, var(--accent-1) 14%, var(--surface-2));
		color: var(--accent-0);
		padding: 0.42rem 0.7rem;
		font-size: 0.68rem;
	}
	@media (max-width: 900px) {
		.title .eyebrow,
		.exit span,
		.score .label {
			display: none;
		}
		.prompt {
			top: calc(var(--header-h) + 0.5rem);
			left: 0.4rem;
			right: 0.4rem;
			width: auto;
			max-height: 54vh;
		}
		.feedback {
			bottom: calc(0.4rem + env(safe-area-inset-bottom));
		}
		.result-stats {
			grid-template-columns: repeat(2, 1fr);
		}
		.options {
			grid-template-columns: 1fr;
		}
	}
</style>
