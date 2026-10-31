<script lang="ts">
	interface Props {
		name: string;
		size?: number;
		stroke?: number;
		class?: string;
	}

	let { name, size = 20, stroke = 1.6, class: className = '' }: Props = $props();

	const paths: Record<string, string> = {
		globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.3 4-5.4 4-9s-1.5-6.7-4-9c-2.5 2.3-4 5.4-4 9s1.5 6.7 4 9ZM3.5 9h17M3.5 15h17',
		terrain: 'm3 19 6.5-11 4 6 2.5-4L21 19H3Zm12.5-11.5.9-1.6.9 1.6 1.7.2-1.2 1.2.3 1.7-1.7-.9-1.6.9.3-1.7-1.3-1.2 1.7-.2Z',
		users:
			'M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19M9 9.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 3.3a4 4 0 0 1 0 7.4M22 19v-1.5a4 4 0 0 0-3-3.8',
		coins:
			'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3Zm8-3v14c0 1.7-3.6 3-8 3s-8-1.3-8-3V5m16 7c0 1.7-3.6 3-8 3s-8-1.3-8-3',
		shield: 'M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Zm-3.2-10 2.2 2.2 4.2-4.4',
		clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2',
		search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3',
		close: 'M6 6l12 12M18 6 6 18',
		plus: 'M12 5v14M5 12h14',
		minus: 'M5 12h14',
		reset: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5',
		arrowRight: 'M5 12h14m-6-6 6 6-6 6',
		arrowLeft: 'M19 12H5m6 6-6-6 6-6',
		chevronDown: 'm6 9 6 6 6-6',
		external: 'M14 4h6v6M20 4 10 14M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5',
		play: 'M8 5.5v13l11-6.5-11-6.5Z',
		check: 'm5 12 4.5 4.5L19 7',
		x: 'M6 6l12 12M18 6 6 18',
		sort: 'M8 5v14m0 0-3-3m3 3 3-3M16 19V5m0 0-3 3m3-3 3 3',
		pin: 'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
		type: 'M4 6h16M9 6v13m6-13v13M7 19h4m2 0h4',
		wave: 'M3 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 3-2M3 13c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 3-2M3 18c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 3-2',
		sparkle: 'M12 3 13.8 9 20 11l-6.2 2L12 19l-1.8-6L4 11l6.2-2L12 3Z',
		layers: 'm12 3 9 5-9 5-9-5 9-5Zm9 9-9 5-9-5m18 5-9 5-9-5',
		info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-10v.5',
		menu: 'M4 7h16M4 12h16M4 17h16',
		grid: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
		compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 6-6 2 2-6 6-2Z',
		book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Zm0 16A2.5 2.5 0 0 1 6.5 19H20',
		refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
		trophy: 'M8 21h8m-4-4v4M7 4h10v6a5 5 0 0 1-10 0V4Zm10 2h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3',
		flag: 'M5 21V4m0 0h11l-2 4 2 4H5'
	};

	const d = $derived(paths[name] ?? paths.globe);
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	<path d={d} />
</svg>
