const STORAGE_KEY = 'mundivista:text-scale';
const browser = typeof window !== 'undefined';

export type TextScale = 'normal' | 'large';

let scale = $state<TextScale>('normal');

function apply(value: TextScale) {
	if (!browser) return;
	document.documentElement.dataset.textScale = value;
	document.documentElement.style.fontSize = value === 'large' ? '17.5px' : '16px';
}

export const preferences = {
	get textScale(): TextScale {
		return scale;
	},
	setTextScale(value: TextScale) {
		scale = value;
		if (browser) localStorage.setItem(STORAGE_KEY, value);
		apply(value);
	},
	toggleTextScale() {
		preferences.setTextScale(scale === 'large' ? 'normal' : 'large');
	},
	init() {
		if (!browser) return;
		const saved = localStorage.getItem(STORAGE_KEY);
		scale = saved === 'large' ? 'large' : 'normal';
		apply(scale);
	}
};
