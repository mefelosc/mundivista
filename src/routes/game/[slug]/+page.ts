import { error } from '@sveltejs/kit';
import { games } from '#lib/engines/game-engine/registry';

export const entries = () => games.map((game) => ({ slug: game.slug }));

export function load({ params }: { params: { slug: string } }) {
	const game = games.find((g) => g.slug === params.slug);
	if (!game) error(404, 'Jogo não encontrado');
	return { slug: game.slug };
}
