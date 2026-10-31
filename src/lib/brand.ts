/**
 * Identidade provisória.
 *
 * O nome do produto ainda não foi decidido (ver briefing, §1).
 * Nada estrutural depende destes valores: troque aqui para renomear
 * a plataforma em toda a interface.
 */
export const brand = {
	name: 'Mundivista',
	short: 'MVD',
	tagline: 'O mundo, em camadas.',
	description:
		'Explore o planeta, leia os dados por trás de cada fronteira e jogue com o mapa.',
	/** Usado em metadados e no rodapé. */
	provisional: true
} as const;

export type Brand = typeof brand;
