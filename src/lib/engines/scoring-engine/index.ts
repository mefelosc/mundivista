/**
 * Motor de pontuação — funções puras, sem dependência de UI.
 *
 * Pontos = base + bônus de velocidade + bônus de sequência.
 * Resposta errada não subtrai pontos (o jogo já perde a rodada), mas zera a sequência.
 */

export interface ScoreRules {
	/** Pontos por acerto. */
	base: number;
	/** Bônus máximo por responder rápido. */
	timeBonusMax: number;
	/** Tempo de referência da rodada. */
	roundTimeMs: number;
	/** Bônus por acerto consecutivo anterior. */
	streakStep: number;
	/** Teto do bônus de sequência. */
	streakMax: number;
	/** Penalidade por erro (0 por padrão). */
	penalty: number;
}

export const defaultScoreRules: ScoreRules = {
	base: 100,
	timeBonusMax: 60,
	roundTimeMs: 25_000,
	streakStep: 20,
	streakMax: 100,
	penalty: 0
};

export interface RoundResult {
	correct: boolean;
	elapsedMs: number;
	/** Acertos consecutivos antes desta rodada. */
	streakBefore: number;
}

/** Resultado de rodada sem o estado de sequência (calculado pelo sumário). */
export type RoundOutcome = { correct: boolean; elapsedMs: number; streakBefore?: number };

export interface ScoredRound {
	points: number;
	base: number;
	speedBonus: number;
	streakBonus: number;
	penalty: number;
	streakAfter: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function scoreRound(result: RoundResult, rules: ScoreRules = defaultScoreRules): ScoredRound {
	const streakAfter = result.correct ? result.streakBefore + 1 : 0;
	if (!result.correct) {
		return {
			points: rules.penalty > 0 ? -rules.penalty : 0,
			base: 0,
			speedBonus: 0,
			streakBonus: 0,
			penalty: rules.penalty,
			streakAfter
		};
	}

	const remaining = clamp(1 - result.elapsedMs / rules.roundTimeMs, 0, 1);
	const speedBonus = Math.round(rules.timeBonusMax * remaining);
	const streakBonus = Math.min(rules.streakMax, result.streakBefore * rules.streakStep);
	const base = rules.base;

	return {
		points: base + speedBonus + streakBonus,
		base,
		speedBonus,
		streakBonus,
		penalty: 0,
		streakAfter
	};
}

export interface ScoreSummary {
	total: number;
	correct: number;
	rounds: number;
	accuracy: number;
	maxStreak: number;
	elapsedMs: number;
	averageMs: number;
	perfect: boolean;
	tier: { id: string; label: string; description: string };
}

export function summarize(
	results: RoundOutcome[],
	rules: ScoreRules = defaultScoreRules
): ScoreSummary {
	let total = 0;
	let correct = 0;
	let streak = 0;
	let maxStreak = 0;
	let elapsedMs = 0;

	for (const result of results) {
		const scored = scoreRound({ ...result, streakBefore: streak }, rules);
		total += scored.points;
		streak = scored.streakAfter;
		maxStreak = Math.max(maxStreak, streak);
		if (result.correct) correct++;
		elapsedMs += result.elapsedMs;
	}

	const rounds = results.length;
	const accuracy = rounds ? correct / rounds : 0;
	return {
		total: Math.max(0, total),
		correct,
		rounds,
		accuracy,
		maxStreak,
		elapsedMs,
		averageMs: rounds ? elapsedMs / rounds : 0,
		perfect: rounds > 0 && correct === rounds,
		tier: tierFor(accuracy)
	};
}

export function tierFor(accuracy: number): ScoreSummary['tier'] {
	if (accuracy >= 0.9)
		return {
			id: 'cartographer',
			label: 'Leitura de cartógrafo',
			description: 'Precisão altíssima. Você lê o mapa como quem desenha.'
		};
	if (accuracy >= 0.7)
		return {
			id: 'navigator',
			label: 'Boa orientação',
			description: 'Base sólida — poucos pontos cegos no mapa.'
		};
	if (accuracy >= 0.5)
		return {
			id: 'explorer',
			label: 'Em exploração',
			description: 'Você já reconhece o terreno. Vale revisar os erros.'
		};
	return {
		id: 'beginner',
		label: 'Primeiros passos',
		description: 'O mapa ainda tem muito a mostrar. Explore e tente de novo.'
	};
}

export function formatClock(ms: number): string {
	const totalSeconds = Math.max(0, Math.round(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
