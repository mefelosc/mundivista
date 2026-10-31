/**
 * Estrutura de mensagens PT/EN.
 *
 * A tradução completa do conteúdo editorial fica para uma etapa posterior.
 * Aqui vivem as strings de navegação e do shell, com paridade testada.
 */

export type Locale = 'pt' | 'en';

export const messages = {
	pt: {
		'nav.explore': 'Explorar',
		'nav.play': 'Jogar',
		'nav.sources': 'Fontes',
		'nav.search': 'Buscar país, camada ou jogo',
		'nav.playNow': 'Jogar agora',
		'nav.atlas': 'atlas interativo',
		'action.openAtlas': 'Abrir o atlas',
		'action.openDossier': 'Abrir dossiê',
		'action.share': 'Compartilhar',
		'action.close': 'Fechar',
		'state.unavailable': 'Não disponível',
		'state.loading': 'Desenhando o mundo…',
		'unit.people': 'habitantes'
	},
	en: {
		'nav.explore': 'Explore',
		'nav.play': 'Play',
		'nav.sources': 'Sources',
		'nav.search': 'Search country, layer or game',
		'nav.playNow': 'Play now',
		'nav.atlas': 'interactive atlas',
		'action.openAtlas': 'Open the atlas',
		'action.openDossier': 'Open dossier',
		'action.share': 'Share',
		'action.close': 'Close',
		'state.unavailable': 'Not available',
		'state.loading': 'Drawing the world…',
		'unit.people': 'people'
	}
} as const;

export type MessageKey = keyof (typeof messages)['pt'];

export function t(key: MessageKey, locale: Locale = 'pt'): string {
	return messages[locale]?.[key] ?? messages.pt[key];
}

export function localeFromUrl(url: { searchParams: { get(name: string): string | null } }): Locale {
	return url.searchParams.get('lang') === 'en' ? 'en' : 'pt';
}

export function formatNumber(value: number, locale: Locale = 'pt'): string {
	return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR').format(value);
}
