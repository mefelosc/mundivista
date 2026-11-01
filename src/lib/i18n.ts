/**
 * Estrutura de mensagens PT/EN.
 *
 * Shell, portal, atlas, dossiês, card do país e páginas de dados são
 * traduzidos. O conteúdo interno dos jogos permanece em português.
 */

export type Locale = 'pt' | 'en';

export const messages = {
	pt: {
		'nav.home': 'Início',
		'nav.explore': 'Explorar',
		'nav.play': 'Jogar',
		'nav.sources': 'Fontes',
		'nav.settings': 'Configurações',
		'nav.search': 'Buscar país, camada ou jogo',
		'nav.playNow': 'Jogar agora',
		'nav.atlas': 'atlas interativo',
		'action.openAtlas': 'Abrir o atlas',
		'action.openDossier': 'Abrir dossiê',
		'action.share': 'Compartilhar',
		'action.close': 'Fechar',
		'state.unavailable': 'Não disponível',
		'state.loading': 'Desenhando o mundo…',
		'unit.people': 'habitantes',
		'settings.title': 'Configurações',
		'settings.language': 'Idioma',
		'settings.portuguese': 'Português',
		'settings.english': 'English',
		'settings.appearance': 'Aparência',
		'settings.sound': 'Som',
		'settings.soundOn': 'Sons ligados',
		'settings.soundOff': 'Sons desligados',
		'settings.text': 'Tamanho do texto',
		'settings.textNormal': 'Normal',
		'settings.textLarge': 'Grande',
		'settings.sources': 'Fontes e métodos',
		'settings.close': 'Fechar configurações',
		'settings.note': 'O conteúdo dos jogos e alguns textos editoriais de método seguem em português nesta versão.',
		'landing.eyebrow': 'Atlas interativo · edição 2026',
		'landing.titleA': 'Escolha',
		'landing.titleB': 'seu caminho',
		'landing.lede': 'Um atlas para ler o mundo por inteiro — ou um lugar de cada vez.',
		'landing.explore': 'Explorar',
		'landing.exploreDesc': 'O mapa-múndi em camadas, com dados, relevo e história.',
		'landing.play': 'Jogar',
		'landing.playDesc': 'Minijogos de geografia com o mesmo mapa e dados reais.',
		'landing.countries': 'Países',
		'landing.countriesDesc': 'Encontre um território e abra o dossiê completo.',
		'landing.about': 'Sobre',
		'landing.aboutDesc': 'Fontes, método, licenças e limitações do atlas.',
		'landing.territories': 'territórios',
		'landing.indicators': 'indicadores',
		'landing.games': 'jogos',
		'landing.layers': 'camadas',
		'landing.footer': 'Um atlas feito para ser explorado.',
		'landing.sources': 'Fontes e métodos',
		'play.eyebrow': 'Sala de jogos',
		'play.titleA': 'Jogue',
		'play.titleB': 'o mundo',
		'play.lede': 'Rodadas curtas, mapa de verdade e uma fonte por trás de cada resposta.',
		'play.daily': 'Desafio do dia',
		'play.dailyHint': 'A mesma sequência para todo mundo hoje.',
		'play.openDaily': 'Jogar o desafio',
		'play.play': 'Jogar',
		'play.best': 'Recorde',
		'play.resume': 'Continuar',
		'play.records': 'Seus recordes',
		'play.recordsNote': 'Recordes ficam no seu navegador.',
		'play.all': 'Todos',
		'play.note': 'Sem cadastro, sem ranking global e sem dados inventados.'
	},
	en: {
		'nav.home': 'Home',
		'nav.explore': 'Explore',
		'nav.play': 'Play',
		'nav.sources': 'Sources',
		'nav.settings': 'Settings',
		'nav.search': 'Search country, layer or game',
		'nav.playNow': 'Play now',
		'nav.atlas': 'interactive atlas',
		'action.openAtlas': 'Open the atlas',
		'action.openDossier': 'Open dossier',
		'action.share': 'Share',
		'action.close': 'Close',
		'state.unavailable': 'Not available',
		'state.loading': 'Drawing the world…',
		'unit.people': 'people',
		'settings.title': 'Settings',
		'settings.language': 'Language',
		'settings.portuguese': 'Português',
		'settings.english': 'English',
		'settings.appearance': 'Appearance',
		'settings.sound': 'Sound',
		'settings.soundOn': 'Sound on',
		'settings.soundOff': 'Sound off',
		'settings.text': 'Text size',
		'settings.textNormal': 'Normal',
		'settings.textLarge': 'Large',
		'settings.sources': 'Sources and methods',
		'settings.close': 'Close settings',
		'settings.note': 'Game content and some editorial method texts remain in Portuguese in this version.',
		'landing.eyebrow': 'Interactive atlas · 2026 edition',
		'landing.titleA': 'Choose',
		'landing.titleB': 'your path',
		'landing.lede': 'An atlas to read the whole world — or one place at a time.',
		'landing.explore': 'Explore',
		'landing.exploreDesc': 'The world map in layers, with data, terrain and history.',
		'landing.play': 'Play',
		'landing.playDesc': 'Geography mini games built on the same map and real data.',
		'landing.countries': 'Countries',
		'landing.countriesDesc': 'Find a territory and open its full dossier.',
		'landing.about': 'About',
		'landing.aboutDesc': 'Sources, methods, licences and limitations.',
		'landing.territories': 'territories',
		'landing.indicators': 'indicators',
		'landing.games': 'games',
		'landing.layers': 'layers',
		'landing.footer': 'An atlas made to be explored.',
		'landing.sources': 'Sources and methods',
		'play.eyebrow': 'Game room',
		'play.titleA': 'Play',
		'play.titleB': 'the world',
		'play.lede': 'Short rounds, a real map and a source behind every answer.',
		'play.daily': 'Daily challenge',
		'play.dailyHint': 'The same sequence for everyone today.',
		'play.openDaily': 'Play the challenge',
		'play.play': 'Play',
		'play.best': 'Best',
		'play.resume': 'Continue',
		'play.records': 'Your records',
		'play.recordsNote': 'Records are stored in your browser.',
		'play.all': 'All',
		'play.note': 'No sign-up, no global ranking and no invented data.'
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
