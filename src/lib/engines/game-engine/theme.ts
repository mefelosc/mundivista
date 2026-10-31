/** Cores de tema por categoria, compartilhadas pela biblioteca e pelo jogo. */
const ACCENTS: Record<string, string> = {
	Geografia: 'var(--forest)',
	Dados: 'var(--wine)',
	Geopolítica: 'var(--clay)',
	História: 'var(--accent-0)',
	'Meio ambiente': 'var(--positive)'
};

export function gameAccent(category: string): string {
	return ACCENTS[category] ?? 'var(--accent-1)';
}
