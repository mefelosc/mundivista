<script lang="ts">
	import { onMount } from 'svelte';
	import MapCanvas from '#lib/components/map/MapCanvas.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { getCountry } from '#lib/data/countries';
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

	interface Props {
		game: GameDefinition;
	}
	let { game }: Props = $props();

	const rules = defaultScoreRules;
	const mapLayer = getLayer('political');

	let rounds = $state<GameRound[]>([]);
	let index = $state(0);
	let results = $state<RoundOutcome[]>([]);
	let score = $state(0);
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

	const current = $derived(rounds[index] ?? null);
	const summary = $derived(summarize(results, rules));
	const elapsed = $derived(Math.max(0, now - roundStartedAt));
	const progress = $derived(rounds.length ? (index + (feedback ? 1 : 0)) / rounds.length : 0);
	const focusCodes = $derived.by(() => {
		if (!current) return null;
		if (current.focus) return current.focus;
		if (current.choices) return current.choices;
		if (current.interaction === 'text') return targetCodes(current.rule);
		return null;
	});

	onMount(() => {
		rounds = game.build();
		roundStartedAt = Date.now();
		orderItems = [...(rounds[0]?.items ?? [])];
		const stored = localStorage.getItem(`mundivista:best:${game.slug}`);
		best = stored ? Number(stored) : null;
		const timer = setInterval(() => (now = Date.now()), 250);
		return () => clearInterval(timer);
	});

	$effect(() => {
		const round = current;
		if (!round || !mapRef || finished) return;
		if (round.camera) mapRef.flyTo(round.camera.center, round.camera.zoom);
		else mapRef.resetView();
		if (round.interaction === 'text') {
			setTimeout(() => inputEl?.focus(), 60);
		}
	});

	function targetCodes(rule: ValidationRule): string[] {
		if (rule.type === 'code') return [rule.code];
		if (rule.type === 'set' || rule.type === 'order') return rule.codes;
		return [];
	}

	function onMapSelect(code: string) {
		const round = current;
		if (!round || feedback) return;
		if (round.interaction === 'map-single') {
			submit({ kind: 'code', value: code });
		} else if (round.interaction === 'map-multi') {
			selectedCodes = toggleCode(selectedCodes, code);
		}
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
	}

	function resetRound() {
		selectedCodes = [];
		textAnswer = '';
		status = {};
		feedback = null;
		orderItems = [...(rounds[index]?.items ?? [])];
		roundStartedAt = Date.now();
		now = Date.now();
	}

	function finish() {
		finished = true;
		const total = summarize(results, rules).total;
		if (!best || total > best) {
			best = total;
			localStorage.setItem(`mundivista:best:${game.slug}`, String(total));
		}
	}

	function restart() {
		rounds = game.build();
		index = 0;
		results = [];
		score = 0;
		streak = 0;
		finished = false;
		resetRound();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && feedback) {
			event.preventDefault();
			next();
		}
	}

	function nameOf(code: string): string {
		return getCountry(code)?.name ?? code;
	}

	function flagOf(code: string): string {
		const iso2 = getCountry(code)?.iso2;
		return iso2 ? `fi fi-${iso2}` : '';
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>{game.title} — Mundivista</title>
</svelte:head>

<div class="game">
	<MapCanvas
		bind:this={mapRef}
		layer={mapLayer}
		interactive={(current?.interaction === 'map-single' ||
			current?.interaction === 'map-multi') &&
			!feedback}
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
			<span class="eyebrow">{game.category}</span>
			<strong>{game.title}</strong>
		</div>
		<div class="hud">
			<div class="timer">
				<Icon name="clock" size={13} />
				<span>{formatClock(elapsed)}</span>
			</div>
			<div class="score">
				<span class="label">Pontos</span>
				<strong>{score}</strong>
			</div>
			{#if streak > 1}
				<div class="streak">×{streak}</div>
			{/if}
		</div>
	</header>
	<div class="progress" aria-hidden="true"><span style:width={`${progress * 100}%`}></span></div>

	{#if current && !finished}
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
						<button type="submit" disabled={!textAnswer.trim() || !!feedback}>
							<Icon name="arrowRight" size={16} />
						</button>
					</div>
				</form>
				<p class="micro">Aceita português ou inglês, com ou sem acento.</p>
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
				<div class="map-instruction">
					<span class="pulse"></span>
					Clique no país no mapa
				</div>
			{/if}
		</section>
	{/if}

	{#if feedback}
		<div class="feedback panel animate-sheet-in" class:correct={feedback.correct} class:wrong={!feedback.correct}>
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

	{#if finished}
		<div class="result-backdrop">
			<div class="result panel animate-sheet-in">
				<span class="eyebrow">Fim do jogo · {game.title}</span>
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
					<a href="/play">Outros jogos</a>
					<a href="/explore">Explorar o mapa</a>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.game {
		position: fixed;
		inset: 0;
		background: #070b12;
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
		padding: 0 0.9rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		background: color-mix(in oklab, #06090e 68%, transparent);
		backdrop-filter: blur(18px);
	}
	.exit {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--color-mist-400);
		text-decoration: none;
		font-size: 0.72rem;
		padding: 0.35rem 0.5rem;
		border-radius: 0.35rem;
	}
	.exit:hover {
		color: var(--color-mist-100);
		background: rgba(255, 255, 255, 0.05);
	}
	.title {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		min-width: 0;
	}
	.title strong {
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.title .eyebrow {
		font-size: 0.5rem;
	}
	.hud {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}
	.timer {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		color: var(--color-mist-300);
	}
	.score {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
	}
	.score .label {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-mist-500);
	}
	.score strong {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-gold-300);
	}
	.streak {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		color: var(--color-gold-300);
		border: 1px solid color-mix(in oklab, var(--color-gold-400) 30%, transparent);
		border-radius: 999px;
		padding: 0.1rem 0.4rem;
	}
	.progress {
		position: fixed;
		top: var(--header-h);
		left: 0;
		right: 0;
		height: 2px;
		background: rgba(255, 255, 255, 0.05);
		z-index: 41;
	}
	.progress span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--color-gold-500), var(--color-gold-300));
		transition: width 0.35s var(--ease-out-soft);
	}
	.prompt {
		position: fixed;
		top: calc(var(--header-h) + 0.9rem);
		left: 0.9rem;
		z-index: 32;
		width: 23rem;
		max-width: calc(100vw - 1.8rem);
		max-height: calc(100dvh - var(--header-h) - 2rem);
		overflow-y: auto;
		padding: 0.9rem 1rem 1rem;
		border-radius: 0.75rem;
	}
	.prompt-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.55rem;
	}
	.round {
		font-family: var(--font-mono);
		font-size: 0.54rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-gold-300);
	}
	.mechanic {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.06em;
		color: var(--color-mist-500);
	}
	h1 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
		line-height: 1.3;
		letter-spacing: -0.02em;
	}
	.hint {
		margin: 0.35rem 0 0;
		font-size: 0.65rem;
		line-height: 1.45;
		color: var(--color-mist-400);
	}
	.input-row {
		display: flex;
		gap: 0.3rem;
		margin-top: 0.8rem;
	}
	input {
		flex: 1;
		min-width: 0;
		background: rgba(255, 255, 255, 0.035);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.4rem;
		padding: 0.5rem 0.6rem;
		color: var(--color-mist-100);
		font-size: 0.78rem;
		outline: none;
	}
	input:focus {
		border-color: var(--color-signal-400);
		background: rgba(255, 255, 255, 0.05);
	}
	input::placeholder {
		color: var(--color-mist-500);
	}
	.input-row button {
		display: grid;
		place-items: center;
		width: 2.25rem;
		border: 1px solid color-mix(in oklab, var(--color-gold-400) 40%, transparent);
		background: color-mix(in oklab, var(--color-gold-400) 12%, transparent);
		color: var(--color-gold-300);
		border-radius: 0.4rem;
	}
	.input-row button:disabled {
		opacity: 0.35;
	}
	.micro {
		margin: 0.4rem 0 0;
		font-size: 0.55rem;
		color: var(--color-mist-500);
	}
	.confirm {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.85rem;
		font-size: 0.65rem;
		color: var(--color-mist-400);
	}
	.confirm button,
	.submit-order {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid color-mix(in oklab, var(--color-gold-400) 40%, transparent);
		background: color-mix(in oklab, var(--color-gold-400) 12%, transparent);
		color: var(--color-gold-300);
		border-radius: 0.4rem;
		padding: 0.4rem 0.6rem;
		font-size: 0.65rem;
	}
	.confirm button:disabled,
	.submit-order:disabled {
		opacity: 0.35;
	}
	.map-instruction {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin-top: 0.85rem;
		font-size: 0.62rem;
		color: var(--color-signal-300);
		font-family: var(--font-mono);
		letter-spacing: 0.04em;
	}
	.pulse {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-signal-400);
		box-shadow: 0 0 0 0 rgba(111, 183, 255, 0.4);
		animation: pulse-soft 1.4s ease-in-out infinite;
	}
	.order {
		list-style: none;
		margin: 0.75rem 0 0.5rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.order li {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0.4rem;
		border-radius: 0.35rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.055);
	}
	.pos {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		color: var(--color-gold-300);
		width: 0.8rem;
	}
	.order .name {
		font-size: 0.7rem;
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
		width: 1.3rem;
		height: 1.3rem;
		display: grid;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: transparent;
		color: var(--color-mist-400);
		border-radius: 0.25rem;
		font-size: 0.65rem;
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
		bottom: 0.9rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 38;
		width: min(36rem, calc(100vw - 1.8rem));
		padding: 0.8rem 0.9rem;
		border-radius: 0.7rem;
		border-color: rgba(255, 255, 255, 0.1);
	}
	.feedback.correct {
		border-color: color-mix(in oklab, var(--color-positive-400) 35%, transparent);
	}
	.feedback.wrong {
		border-color: color-mix(in oklab, var(--color-negative-400) 35%, transparent);
	}
	.verdict {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.35rem;
	}
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.56rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.correct .badge {
		color: var(--color-positive-400);
	}
	.wrong .badge {
		color: var(--color-negative-400);
	}
	.points {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		color: var(--color-gold-300);
	}
	.feedback p {
		margin: 0;
		font-size: 0.72rem;
		line-height: 1.5;
		color: var(--color-mist-300);
	}
	.feedback-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.55rem;
	}
	.feedback-foot a {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.56rem;
		color: var(--color-mist-500);
		text-decoration: none;
	}
	.feedback-foot a:hover {
		color: var(--color-mist-300);
	}
	.feedback-foot button {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid color-mix(in oklab, var(--color-gold-400) 40%, transparent);
		background: color-mix(in oklab, var(--color-gold-400) 12%, transparent);
		color: var(--color-gold-300);
		border-radius: 0.4rem;
		padding: 0.38rem 0.65rem;
		font-size: 0.65rem;
	}
	.result-backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: color-mix(in oklab, #05080d 72%, transparent);
		backdrop-filter: blur(10px);
	}
	.result {
		width: min(30rem, 100%);
		padding: 1.5rem;
		border-radius: 0.9rem;
		text-align: center;
	}
	.result-score {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.5rem;
		margin: 0.6rem 0 0.2rem;
	}
	.result-score strong {
		font-family: var(--font-mono);
		font-size: 3rem;
		font-weight: 400;
		letter-spacing: -0.04em;
		color: var(--color-gold-300);
		line-height: 1;
	}
	.result-score span {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-mist-500);
	}
	.result h2 {
		margin: 0.5rem 0 0.2rem;
		font-size: 1.3rem;
		font-weight: 600;
	}
	.tier-desc {
		margin: 0 auto;
		max-width: 22rem;
		font-size: 0.72rem;
		line-height: 1.5;
		color: var(--color-mist-400);
	}
	.result-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		margin: 1.1rem 0 0.8rem;
		padding: 0.8rem 0;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}
	.result-stats div {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.result-stats strong {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-mist-100);
	}
	.result-stats span {
		font-family: var(--font-mono);
		font-size: 0.48rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-mist-500);
	}
	.record {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.62rem;
		color: var(--color-gold-300);
		margin: 0;
	}
	.record.muted {
		color: var(--color-mist-500);
	}
	.round-dots {
		display: flex;
		justify-content: center;
		gap: 0.3rem;
		margin: 0.7rem 0 1rem;
	}
	.round-dots span {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
	}
	.round-dots .ok {
		background: var(--color-positive-400);
	}
	.round-dots .no {
		background: var(--color-negative-400);
	}
	.result-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.6rem;
	}
	.result-actions .primary {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid color-mix(in oklab, var(--color-gold-400) 45%, transparent);
		background: color-mix(in oklab, var(--color-gold-400) 14%, transparent);
		color: var(--color-gold-300);
		border-radius: 0.45rem;
		padding: 0.5rem 0.8rem;
		font-size: 0.7rem;
	}
	.result-actions a {
		font-size: 0.68rem;
		color: var(--color-mist-400);
		text-decoration: none;
	}
	.result-actions a:hover {
		color: var(--color-mist-100);
	}
	@media (max-width: 860px) {
		.title .eyebrow,
		.exit span {
			display: none;
		}
		.prompt {
			top: calc(var(--header-h) + 0.6rem);
			left: 0.5rem;
			right: 0.5rem;
			width: auto;
			max-height: 46vh;
		}
		.feedback {
			bottom: calc(0.5rem + env(safe-area-inset-bottom));
		}
		.result-stats {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
