import type { GameRound } from '#lib/engines/game-engine/types';

const BEST_PREFIX = 'mundivista:best:';
const PROGRESS_PREFIX = 'mundivista:progress:';
const LAST_KEY = 'mundivista:last-game';
const DAILY_KEY = 'mundivista:daily';

export interface RoundResult {
	correct: boolean;
	elapsedMs: number;
}

export interface SavedGame {
	slug: string;
	index: number;
	score: number;
	streak: number;
	results: RoundResult[];
	status: Record<string, 'correct' | 'wrong'>;
	feedback?: {
		correct: boolean;
		explanation: string;
		source?: { name: string; url: string };
		points: number;
	} | null;
	rounds: GameRound[];
	finished: boolean;
	savedAt: number;
	daily?: boolean;
	seed?: number;
}

function read<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

export function getBest(slug: string): number | null {
	try {
		const raw = localStorage.getItem(`${BEST_PREFIX}${slug}`);
		return raw ? Number(raw) : null;
	} catch {
		return null;
	}
}

export function setBest(slug: string, score: number): void {
	try {
		localStorage.setItem(`${BEST_PREFIX}${slug}`, String(score));
	} catch {
		/* storage bloqueado */
	}
}

export function bestScores(): Record<string, number> {
	const out: Record<string, number> = {};
	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key?.startsWith(BEST_PREFIX)) continue;
			const score = Number(localStorage.getItem(key));
			if (Number.isFinite(score)) out[key.slice(BEST_PREFIX.length)] = score;
		}
	} catch {
		/* storage bloqueado */
	}
	return out;
}

export function saveProgress(state: SavedGame): void {
	try {
		localStorage.setItem(`${PROGRESS_PREFIX}${state.slug}`, JSON.stringify(state));
		if (!state.finished) {
			localStorage.setItem(
				LAST_KEY,
				JSON.stringify({ slug: state.slug, savedAt: state.savedAt, daily: state.daily ?? false })
			);
		} else {
			const last = read<{ slug: string }>(LAST_KEY);
			if (last?.slug === state.slug) localStorage.removeItem(LAST_KEY);
		}
	} catch {
		/* storage bloqueado */
	}
}

export function loadProgress(slug: string): SavedGame | null {
	const state = read<SavedGame>(`${PROGRESS_PREFIX}${slug}`);
	if (!state || state.slug !== slug || !Array.isArray(state.rounds)) return null;
	return state;
}

export function clearProgress(slug: string): void {
	try {
		localStorage.removeItem(`${PROGRESS_PREFIX}${slug}`);
	} catch {
		/* storage bloqueado */
	}
}

export function lastPlayed(): { slug: string; savedAt: number; daily: boolean } | null {
	return read(`${LAST_KEY}`);
}

/** Seed determinística por dia (AAAA-MM-DD), estável em qualquer fuso local. */
export function dailySeed(date = new Date()): number {
	const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	let hash = 2166136261;
	for (let i = 0; i < key.length; i++) {
		hash ^= key.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

export function dailyKey(date = new Date()): string {
	const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	return `${DAILY_KEY}:${key}`;
}

export interface DailyResult {
	slug: string;
	score: number;
	correct: number;
	rounds: number;
	at: number;
}

export function getDailyResult(): DailyResult | null {
	return read<DailyResult>(dailyKey());
}

export function setDailyResult(result: DailyResult): void {
	try {
		localStorage.setItem(dailyKey(), JSON.stringify(result));
	} catch {
		/* storage bloqueado */
	}
}
