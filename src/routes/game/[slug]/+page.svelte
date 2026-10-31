<script lang="ts">
	import GameRunner from '#lib/components/games/GameRunner.svelte';
	import { gameBySlug } from '#lib/engines/game-engine/registry';

	let { data }: { data: { slug: string } } = $props();
	const game = $derived(gameBySlug.get(data.slug));
</script>

<svelte:head>
	<title>{game ? `${game.title} — Mundivista` : 'Jogo — Mundivista'}</title>
	<meta
		name="description"
		content={game?.description ?? 'Minigame de geografia e geopolítica da Mundivista.'}
	/>
</svelte:head>

{#if game}
	<GameRunner {game} />
{:else}
	<div id="conteudo" class="missing">
		<p>Jogo não encontrado.</p>
		<a href="/play">Voltar à biblioteca</a>
	</div>
{/if}

<style>
	.missing {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		text-align: center;
		gap: 0.5rem;
		color: var(--color-mist-300);
	}
	.missing a {
		color: var(--color-gold-300);
	}
</style>
