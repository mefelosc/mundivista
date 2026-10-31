// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '*?url' {
	const src: string;
	export default src;
}

declare module '*?worker&url' {
	const src: string;
	export default src;
}

export {};
