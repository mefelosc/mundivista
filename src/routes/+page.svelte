<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { brand } from '#lib/brand';

	onMount(() => {
		goto('/explore', { replaceState: true });
	});
</script>

<svelte:head>
	<title>{brand.name} — o mundo em camadas</title>
</svelte:head>

<main>
	<div class="mark" aria-hidden="true">
		<svg viewBox="0 0 32 32" width="42" height="42" fill="none">
			<circle cx="16" cy="16" r="12.5" stroke="currentColor" stroke-width="1" opacity=".6" />
			<ellipse cx="16" cy="16" rx="6" ry="12.5" stroke="currentColor" stroke-width="0.9" opacity=".4" />
			<path d="M3.8 16h24.4M5.6 9.2h20.8M5.6 22.8h20.8" stroke="currentColor" stroke-width="0.9" opacity=".4" />
			<circle cx="22.4" cy="10.2" r="1.9" fill="var(--color-gold-400)" />
		</svg>
	</div>
	<p class="eyebrow">{brand.name}</p>
	<p class="loading">Desenhando o mundo<span class="dots">…</span></p>
	<noscript>
		<p><a href="/explore">Abrir o mapa</a></p>
	</noscript>
</main>

<style>
	main {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: radial-gradient(80% 60% at 50% 40%, #0d1520 0%, #06090e 70%);
	}
	.mark {
		color: var(--color-gold-300);
		margin-bottom: 0.6rem;
		animation: fade-up 0.8s var(--ease-out-soft) both;
	}
	.eyebrow {
		font-size: 0.6rem;
		letter-spacing: 0.3em;
	}
	.loading {
		font-size: 0.8rem;
		color: var(--color-mist-400);
		margin: 0;
	}
	.dots {
		animation: pulse-soft 1.4s ease-in-out infinite;
	}
	a {
		color: var(--color-gold-300);
	}
</style>
