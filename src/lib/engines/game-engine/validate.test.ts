import { describe, expect, it } from 'vitest';
import { normalizeText, toggleCode, validateAnswer } from './validate';

describe('normalizeText', () => {
	it('remove acentos, caixa e pontuação', () => {
		expect(normalizeText('  Brasília, DF! ')).toBe('brasilia df');
		expect(normalizeText('Washington, D.C.')).toBe('washington d c');
	});
});

describe('validateAnswer', () => {
	it('valida código único', () => {
		const rule = { type: 'code' as const, code: 'BRA' };
		expect(validateAnswer(rule, { kind: 'code', value: 'BRA' }).correct).toBe(true);
		expect(validateAnswer(rule, { kind: 'code', value: 'ARG' }).correct).toBe(false);
	});

	it('valida conjuntos sem depender da ordem', () => {
		const rule = { type: 'set' as const, codes: ['BRA', 'ARG', 'CHL'] };
		expect(validateAnswer(rule, { kind: 'codes', value: ['CHL', 'BRA', 'ARG'] }).correct).toBe(true);
		const partial = validateAnswer(rule, { kind: 'codes', value: ['BRA', 'ARG', 'URY'] });
		expect(partial.correct).toBe(false);
		expect(partial.missing).toEqual(['CHL']);
		expect(partial.extra).toEqual(['URY']);
	});

	it('ignora duplicatas em seleções', () => {
		const rule = { type: 'set' as const, codes: ['BRA', 'ARG'] };
		expect(validateAnswer(rule, { kind: 'codes', value: ['BRA', 'ARG', 'ARG'] }).correct).toBe(true);
	});

	it('aceita variantes de texto', () => {
		const rule = { type: 'text' as const, accepted: ['Brasília', 'Brasilia'] };
		expect(validateAnswer(rule, { kind: 'text', value: 'brasilia' }).correct).toBe(true);
		expect(validateAnswer(rule, { kind: 'text', value: '  BRASÍLIA ' }).correct).toBe(true);
		expect(validateAnswer(rule, { kind: 'text', value: '' }).correct).toBe(false);
		expect(validateAnswer(rule, { kind: 'text', value: 'Rio' }).correct).toBe(false);
	});

	it('valida ordem exata', () => {
		const rule = { type: 'order' as const, codes: ['A', 'B', 'C'] };
		expect(validateAnswer(rule, { kind: 'order', value: ['A', 'B', 'C'] }).correct).toBe(true);
		expect(validateAnswer(rule, { kind: 'order', value: ['B', 'A', 'C'] }).correct).toBe(false);
	});

	it('não lança com tipo de resposta errado', () => {
		const rule = { type: 'code' as const, code: 'BRA' };
		expect(validateAnswer(rule, { kind: 'text', value: 'BRA' }).correct).toBe(false);
	});
});

describe('toggleCode', () => {
	it('adiciona e remove', () => {
		expect(toggleCode([], 'BRA')).toEqual(['BRA']);
		expect(toggleCode(['BRA'], 'BRA')).toEqual([]);
		expect(toggleCode(['BRA'], 'ARG')).toEqual(['BRA', 'ARG']);
	});
});
