import { describe, expect, it } from 'vitest';
import { countryByCode } from '#lib/data/countries';
import { games, buildRounds } from './registry';
import { answerKindFor } from './validate';
import type { GameRound } from './types';

function codesIn(round: GameRound): string[] {
	const out: string[] = [];
	if (round.rule.type === 'code') out.push(round.rule.code);
	if (round.rule.type === 'set' || round.rule.type === 'order') out.push(...round.rule.codes);
	out.push(...(round.choices ?? []), ...(round.focus ?? []), ...(round.items ?? []));
	out.push(...(round.options ?? []).map((option) => option.value));
	return out;
}

describe('registro de jogos', () => {
	it('tem nove jogos com slugs únicos', () => {
		expect(games).toHaveLength(9);
		expect(new Set(games.map((g) => g.slug)).size).toBe(9);
	});

	for (const game of games) {
		it(`${game.slug}: gera ${game.rounds} rodadas determinísticas`, () => {
			const a = buildRounds(game.slug, 42);
			const b = buildRounds(game.slug, 42);
			expect(a).toHaveLength(game.rounds);
			expect(a.map((r) => r.id)).toEqual(b.map((r) => r.id));
			expect(new Set(a.map((r) => r.id)).size).toBe(a.length);
		});

		it(`${game.slug}: referências existem no mapa`, () => {
			const rounds = buildRounds(game.slug, 7);
			for (const round of rounds) {
				for (const code of codesIn(round)) {
					expect(countryByCode.has(code), `${code} em ${round.id}`).toBe(true);
				}
				expect(answerKindFor(round.rule)).toBe(round.answerKind);
				expect(round.prompt.length).toBeGreaterThan(5);
				expect(round.explanation.length).toBeGreaterThan(5);
				expect(round.source?.url.startsWith('http')).toBe(true);
			}
		});

		it(`${game.slug}: não repete alvos`, () => {
			const rounds = buildRounds(game.slug, 11);
			const targets = rounds
				.filter((r) => r.rule.type === 'code')
				.map((r) => (r.rule.type === 'code' ? r.rule.code : ''));
			expect(new Set(targets).size).toBe(targets.length);
		});
	}

	it('rodadas de ordem são permutações válidas', () => {
		const rounds = buildRounds('world-rankings', 3);
		for (const round of rounds) {
			if (round.rule.type !== 'order') continue;
			expect([...(round.items ?? [])].sort()).toEqual([...round.rule.codes].sort());
			expect(new Set(round.rule.codes).size).toBe(round.rule.codes.length);
		}
	});

	it('rodadas de escolha incluem a resposta', () => {
		const rounds = buildRounds('landlocked', 5);
		for (const round of rounds) {
			if (round.rule.type === 'code' && round.choices) {
				expect(round.choices).toContain(round.rule.code);
			}
		}
	});

	it('rodadas de múltipla escolha têm quatro alternativas e a resposta', () => {
		for (const slug of ['silhouettes', 'borders']) {
			const rounds = buildRounds(slug, 21);
			for (const round of rounds) {
				expect(round.interaction).toBe('choice');
				expect(round.options).toHaveLength(4);
				expect(round.options?.map((option) => option.value)).toContain(
					round.rule.type === 'code' ? round.rule.code : ''
				);
				expect(new Set(round.options?.map((option) => option.value)).size).toBe(4);
			}
		}
	});

	it('jogo de bandeiras usa flags e respostas distintas', () => {
		const rounds = buildRounds('flags', 12);
		for (const round of rounds) {
			expect(round.flag).toMatch(/^[a-z]{2}$/);
			expect(round.options).toHaveLength(4);
			expect(round.options?.map((option) => option.value)).toContain(
				round.rule.type === 'code' ? round.rule.code : ''
			);
		}
	});

	it('alternativas de escolha têm rótulos distintos', () => {
		for (const slug of ['silhouettes', 'borders', 'flags', 'economy-quiz']) {
			for (const round of buildRounds(slug, 33)) {
				const labels = (round.options ?? []).map((option) => option.label);
				expect(new Set(labels).size, `${slug}/${round.id}: ${labels.join(', ')}`).toBe(labels.length);
			}
		}
	});

	it('bandeiras parecidas não aparecem na mesma rodada', () => {
		const twins = new Set(['TD|RO', 'RO|TD', 'ID|MC', 'MC|ID']);
		for (const seed of [1, 5, 12, 21, 33]) {
			for (const round of buildRounds('flags', seed)) {
				const codes = (round.options ?? []).map((option) => option.value);
				for (const a of codes) {
					for (const b of codes) {
						expect(twins.has(`${a}|${b}`), `${round.id}: ${codes.join(', ')}`).toBe(false);
					}
				}
			}
		}
	});

	it('jogo de economia cita valores, anos e fonte', () => {
		const rounds = buildRounds('economy-quiz', 15);
		expect(rounds).toHaveLength(8);
		for (const round of rounds) {
			expect(round.options).toHaveLength(4);
			expect(round.explanation).toMatch(/\d{4}/);
			expect(round.source?.url.startsWith('https://')).toBe(true);
		}
	});

	it('silhuetas têm contorno SVG e respostas distintas', () => {
		const rounds = buildRounds('silhouettes', 4);
		for (const round of rounds) {
			expect(round.silhouette?.startsWith('M')).toBe(true);
			expect(round.silhouette?.length).toBeGreaterThan(20);
		}
	});

	it('rodadas de texto aceitam a capital em português', () => {
		const rounds = buildRounds('capital-match', 9);
		for (const round of rounds) {
			if (round.rule.type !== 'text') continue;
			expect(round.rule.accepted.length).toBeGreaterThan(0);
			expect(round.prompt).toContain('capital');
		}
	});
});
