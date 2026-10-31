import type { Locale } from './i18n';

const browser = typeof window !== 'undefined';

const STORAGE_KEY = 'mundivista:locale';

let current = $state<Locale>('pt');

export const locale = {
	get value(): Locale {
		return current;
	},
	set(value: Locale) {
		current = value;
		if (browser) {
			localStorage.setItem(STORAGE_KEY, value);
			document.documentElement.lang = value === 'en' ? 'en' : 'pt-BR';
		}
	},
	init() {
		if (!browser) return;
		const fromUrl = new URLSearchParams(window.location.search).get('lang');
		const saved = localStorage.getItem(STORAGE_KEY);
		const next = fromUrl === 'en' || fromUrl === 'pt' ? fromUrl : saved === 'en' ? 'en' : 'pt';
		locale.set(next);
	}
};
