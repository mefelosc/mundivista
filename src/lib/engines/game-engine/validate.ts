import type { AnswerKind, ValidationResult, ValidationRule } from './types';

/** Normaliza texto para comparação: sem acentos, caixa baixa, sem pontuação. */
export function normalizeText(input: string): string {
	return input
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[.,;:!?'"()\[\]{}]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function sameSet(a: string[], b: string[]): boolean {
	const sa = [...new Set(a)].sort();
	const sb = [...new Set(b)].sort();
	return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}

/**
 * Valida uma resposta contra a regra da rodada.
 * Nunca lança: entradas inesperadas resultam em `correct: false`.
 */
export function validateAnswer(
	rule: ValidationRule,
	answer: { kind: AnswerKind; value: string | string[] }
): ValidationResult {
	const empty = { correct: false, missing: [], extra: [] };

	switch (rule.type) {
		case 'code': {
			if (answer.kind !== 'code' || typeof answer.value !== 'string') return empty;
			return { correct: answer.value === rule.code, missing: [], extra: [] };
		}
		case 'set': {
			if (answer.kind !== 'codes' || !Array.isArray(answer.value)) return empty;
			const given = [...new Set(answer.value)];
			const target = [...new Set(rule.codes)];
			return {
				correct: sameSet(given, target),
				missing: target.filter((c) => !given.includes(c)),
				extra: given.filter((c) => !target.includes(c))
			};
		}
		case 'text': {
			if (answer.kind !== 'text' || typeof answer.value !== 'string') return empty;
			const given = normalizeText(answer.value);
			if (!given) return empty;
			return {
				correct: rule.accepted.some((a) => normalizeText(a) === given),
				missing: [],
				extra: []
			};
		}
		case 'order': {
			if (answer.kind !== 'order' || !Array.isArray(answer.value)) return empty;
			return { correct: rule.codes.every((c, i) => answer.value[i] === c), missing: [], extra: [] };
		}
		default:
			return empty;
	}
}

export function answerKindFor(rule: ValidationRule): AnswerKind {
	switch (rule.type) {
		case 'code':
			return 'code';
		case 'set':
			return 'codes';
		case 'text':
			return 'text';
		case 'order':
			return 'order';
	}
}

/** Alterna um código em uma seleção múltipla. */
export function toggleCode(codes: string[], code: string): string[] {
	return codes.includes(code) ? codes.filter((c) => c !== code) : [...codes, code];
}
