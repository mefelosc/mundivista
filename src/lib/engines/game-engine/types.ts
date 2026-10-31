/**
 * Tipos do motor de jogos.
 *
 * O motor não conhece o mapa nem o DOM: recebe rodadas, valida respostas e
 * devolve resultado. O mapa é apenas um dos renderizadores possíveis.
 */

export type GameInteraction = 'map-single' | 'map-multi' | 'text' | 'order';

export type AnswerKind = 'code' | 'codes' | 'text' | 'order';

export type ValidationRule =
	| { type: 'code'; code: string }
	| { type: 'set'; codes: string[] }
	| { type: 'text'; accepted: string[] }
	| { type: 'order'; codes: string[] };

export interface GameSource {
	name: string;
	url: string;
}

export interface GameRound {
	id: string;
	prompt: string;
	hint?: string;
	interaction: GameInteraction;
	answerKind: AnswerKind;
	rule: ValidationRule;
	/** Países destacados/candidatos. Vazio = mapa inteiro. */
	focus?: string[];
	/** Candidatos clicáveis em rodadas de escolha. */
	choices?: string[];
	/** Itens na ordem inicial (interação 'order'). */
	items?: string[];
	explanation: string;
	source?: GameSource;
	camera?: { center: [number, number]; zoom: number };
}

export interface GameDefinition {
	slug: string;
	title: string;
	tagline: string;
	description: string;
	category: 'Geografia' | 'Geopolítica' | 'Dados' | 'História' | 'Meio ambiente';
	interaction: GameInteraction;
	rounds: number;
	minutes: number;
	/** Rótulo curto da mecânica, exibido na biblioteca. */
	mechanic: string;
	icon: string;
	build: (seed?: number) => GameRound[];
}

export interface ValidationResult {
	correct: boolean;
	/** Códigos que faltaram em uma seleção. */
	missing: string[];
	/** Códigos selecionados a mais. */
	extra: string[];
}
