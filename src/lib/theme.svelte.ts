export type ThemePref = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const KEY = 'mundivista:theme';
const ORDER: ThemePref[] = ['system', 'light', 'dark'];

let pref = $state<ThemePref>('system');
let resolved = $state<ResolvedTheme>('light');
let media: MediaQueryList | null = null;
let started = false;

function systemTheme(): ResolvedTheme {
	if (typeof window === 'undefined' || !window.matchMedia) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply() {
	if (typeof document === 'undefined') return;
	resolved = pref === 'system' ? systemTheme() : pref;
	const root = document.documentElement;
	root.dataset.theme = resolved;
	root.style.colorScheme = resolved;
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', resolved === 'dark' ? '#12100d' : '#f4efe4');
}

function start() {
	if (started || typeof window === 'undefined') return;
	started = true;
	try {
		const stored = localStorage.getItem(KEY);
		if (stored === 'light' || stored === 'dark' || stored === 'system') pref = stored;
	} catch {
		/* localStorage bloqueado: segue o sistema */
	}
	media = window.matchMedia('(prefers-color-scheme: dark)');
	media.addEventListener('change', () => {
		if (pref === 'system') apply();
	});
	apply();
}

export const theme = {
	get pref(): ThemePref {
		return pref;
	},
	get resolved(): ResolvedTheme {
		return resolved;
	},
	get isDark(): boolean {
		return resolved === 'dark';
	},
	init: start,
	set(next: ThemePref) {
		pref = next;
		try {
			localStorage.setItem(KEY, next);
		} catch {
			/* noop */
		}
		apply();
	},
	/** system → light → dark → system */
	cycle() {
		const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
		this.set(next);
	}
};
