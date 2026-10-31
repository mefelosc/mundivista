<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { brand } from '#lib/brand';
	import { theme } from '#lib/theme.svelte';
	import { locale } from '#lib/locale.svelte';
	import { preferences } from '#lib/preferences.svelte';
	import { sound } from '#lib/sound.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => {
		theme.init();
		sound.init();
		locale.init();
		preferences.init();
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<meta name="theme-color" content={theme.isDark ? '#0f1411' : '#f3f6f2'} />
	<meta property="og:site_name" content={brand.name} />
	<meta property="og:type" content="website" />
</svelte:head>

<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

{@render children()}

<style>
	.skip-link {
		position: fixed;
		top: -100px;
		left: 0.75rem;
		z-index: 100;
		padding: 0.45rem 0.7rem;
		background: var(--surface-2);
		border: 1px solid var(--accent-1);
		color: var(--text-1);
		font-size: 0.72rem;
		text-decoration: none;
		transition: top 0.15s ease;
	}
	.skip-link:focus {
		top: 0.5rem;
	}
</style>
