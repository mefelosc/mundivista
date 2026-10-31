import silhouettesRaw from './generated/silhouettes.json';

const data = silhouettesRaw as unknown as { retrieved: string; silhouettes: Record<string, string> };

/** Contornos simplificados (viewBox 0 0 100 100) para o jogo de reconhecimento. */
export const silhouettes = data.silhouettes;
export const silhouettesRetrieved = data.retrieved;

export function silhouetteFor(code: string): string | null {
	return silhouettes[code] ?? null;
}
