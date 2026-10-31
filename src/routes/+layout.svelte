<script lang="ts">
	import '../app.css';
	import { brand } from '#lib/brand';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<meta name="theme-color" content="#070a0f" />
	<meta property="og:site_name" content={brand.name} />
	<meta property="og:type" content="website" />
</svelte:head>

{@render children()}
