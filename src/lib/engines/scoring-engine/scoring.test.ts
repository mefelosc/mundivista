import { describe, expect, it } from 'vitest';
import {
	defaultScoreRules,
	scoreRound,
	summarize,
	tierFor,
	type RoundResult
} from './index';

const rules = defaultScoreRules;

describe('scoreRound', () => {
	it('soma base, velocidade e sequência', () => {
		const result = scoreRound({ correct: true, elapsedMs: 0, streakBefore: 0 }, rules);
		expect(result.base).toBe(100);
		expect(result.speedBonus).toBe(60);
		expect(result.streakBonus).toBe(0);
		expect(result.points).toBe(160);
	});

	it('não passa do teto de velocidade', () => {
		const result = scoreRound({ correct: true, elapsedMs: 0, streakBefore: 0 }, rules);
		expect(result.speedBonus).toBeLessThanOrEqual(rules.timeBonusMax);
	});

	it('zera bônus de velocidade após o tempo limite', () => {
		const result = scoreRound(
			{ correct: true, elapsedMs: rules.roundTimeMs * 2, streakBefore: 0 },
			rules
		);
		expect(result.speedBonus).toBe(0);
		expect(result.points).toBe(100);
	});

	it('aplica bônus de sequência com teto', () => {
		const result = scoreRound({ correct: true, elapsedMs: 0, streakBefore: 50 }, rules);
		expect(result.streakBonus).toBe(rules.streakMax);
	});

	it('erro não tira pontos e zera a sequência', () => {
		const result = scoreRound({ correct: false, elapsedMs: 1000, streakBefore: 5 }, rules);
		expect(result.points).toBe(0);
		expect(result.streakAfter).toBe(0);
	});

	it('respeita penalidade configurada', () => {
		const result = scoreRound(
			{ correct: false, elapsedMs: 1000, streakBefore: 0 },
			{ ...rules, penalty: 10 }
		);
		expect(result.points).toBe(-10);
	});
});

describe('summarize', () => {
	const results: RoundResult[] = [
		{ correct: true, elapsedMs: 1000, streakBefore: 0 },
		{ correct: true, elapsedMs: 2000, streakBefore: 1 },
		{ correct: false, elapsedMs: 3000, streakBefore: 2 },
		{ correct: true, elapsedMs: 4000, streakBefore: 0 }
	];

	it('calcula acertos, precisão e sequência máxima', () => {
		const summary = summarize(results, rules);
		expect(summary.correct).toBe(3);
		expect(summary.rounds).toBe(4);
		expect(summary.accuracy).toBeCloseTo(0.75);
		expect(summary.maxStreak).toBe(2);
		expect(summary.perfect).toBe(false);
		expect(summary.total).toBeGreaterThan(0);
	});

	it('nunca retorna pontuação negativa no total', () => {
		const summary = summarize(
			[{ correct: false, elapsedMs: 1000, streakBefore: 0 }],
			{ ...rules, penalty: 500 }
		);
		expect(summary.total).toBe(0);
	});

	it('marca rodada perfeita', () => {
		const summary = summarize(
			[
				{ correct: true, elapsedMs: 1000, streakBefore: 0 },
				{ correct: true, elapsedMs: 1000, streakBefore: 1 }
			],
			rules
		);
		expect(summary.perfect).toBe(true);
		expect(summary.tier.id).toBe('cartographer');
	});
});

describe('tierFor', () => {
	it('respeita os limites', () => {
		expect(tierFor(0.95).id).toBe('cartographer');
		expect(tierFor(0.75).id).toBe('navigator');
		expect(tierFor(0.55).id).toBe('explorer');
		expect(tierFor(0.2).id).toBe('beginner');
	});
});
