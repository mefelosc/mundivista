<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { brand } from '#lib/brand';
	import { theme } from '#lib/theme.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => theme.init());
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<meta name="theme-color" content={theme.isDark ? '#12100d' : '#f4efe4'} />
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
