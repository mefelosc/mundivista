/**
 * Sons sintetizados (WebAudio), sem arquivos externos.
 * O contexto só nasce no primeiro gesto do usuário.
 */
const KEY = 'mundivista:sound';
let enabled = $state(true);
let context: AudioContext | null = null;
let started = false;

type Tone = {
	type?: OscillatorType;
	gain?: number;
	delay?: number;
	slideTo?: number;
};

function audio(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!context) {
		const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!Ctor) return null;
		context = new Ctor();
	}
	if (context.state === 'suspended') void context.resume();
	return context;
}

function tone(frequency: number, duration: number, options: Tone = {}) {
	if (!enabled) return;
	const ctx = audio();
	if (!ctx) return;
	const { type = 'sine', gain = 0.035, delay = 0, slideTo } = options;
	const start = ctx.currentTime + delay;
	const oscillator = ctx.createOscillator();
	const envelope = ctx.createGain();
	oscillator.type = type;
	oscillator.frequency.setValueAtTime(frequency, start);
	if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
	envelope.gain.setValueAtTime(0.0001, start);
	envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
	envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
	oscillator.connect(envelope);
	envelope.connect(ctx.destination);
	oscillator.start(start);
	oscillator.stop(start + duration + 0.02);
}

export const sound = {
	get enabled(): boolean {
		return enabled;
	},
	init() {
		if (started || typeof window === 'undefined') return;
		started = true;
		try {
			const stored = localStorage.getItem(KEY);
			if (stored === 'off') enabled = false;
		} catch {
			/* storage bloqueado */
		}
	},
	toggle() {
		enabled = !enabled;
		try {
			localStorage.setItem(KEY, enabled ? 'on' : 'off');
		} catch {
			/* storage bloqueado */
		}
		if (enabled) this.click();
	},
	click() {
		tone(540, 0.07, { type: 'triangle', gain: 0.025, slideTo: 390 });
	},
	correct() {
		tone(660, 0.12, { type: 'sine', gain: 0.035 });
		tone(880, 0.18, { type: 'sine', gain: 0.03, delay: 0.09 });
	},
	wrong() {
		tone(240, 0.16, { type: 'triangle', gain: 0.03, slideTo: 170 });
		tone(170, 0.2, { type: 'sine', gain: 0.02, delay: 0.08 });
	},
	finish() {
		tone(523.25, 0.16, { type: 'sine', gain: 0.03 });
		tone(659.25, 0.16, { type: 'sine', gain: 0.03, delay: 0.12 });
		tone(783.99, 0.28, { type: 'sine', gain: 0.03, delay: 0.24 });
	}
};
