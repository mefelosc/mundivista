<script lang="ts">
	import { page } from '$app/state';
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';

	const notFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{page.status} — Mundivista</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<TopBar />

<main id="conteudo" class="error-page">
	<div class="card panel">
		<span class="eyebrow">Erro {page.status}</span>
		<h1>{notFound ? 'Página fora do mapa' : 'Algo saiu do mapa'}</h1>
		<p>
			{notFound
				? 'O endereço que você abriu não existe neste atlas.'
				: (page.error?.message ?? 'Não foi possível carregar esta página.')}
		</p>
		<div class="actions">
			<a class="primary" href="/explore">
				<Icon name="globe" size={15} /> Abrir o atlas
			</a>
			<a href="/">
				<Icon name="arrowLeft" size={14} /> Voltar ao início
			</a>
		</div>
		{#if !notFound}
			<p class="hint">
				Se você estiver rodando o projeto localmente, reinicie o servidor e recarregue. O erro
				técnico aparece no terminal.
			</p>
		{/if}
	</div>
</main>

<style>
	.error-page {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: calc(var(--header-h) + 2rem) 1rem 2rem;
		background:
			radial-gradient(110% 80% at 50% 0%, color-mix(in oklab, var(--accent-1) 8%, transparent), transparent 60%),
			var(--surface-0);
	}
	.card {
		width: min(34rem, 100%);
		padding: clamp(1.4rem, 4vw, 2.2rem);
		border-top: 3px solid var(--accent-1);
	}
	h1 {
		margin: 0.45rem 0 0.5rem;
		font-family: var(--font-display);
		font-size: clamp(2.4rem, 6vw, 3.6rem);
		font-weight: 600;
		line-height: 0.95;
		letter-spacing: -0.04em;
	}
	p {
		margin: 0;
		max-width: 30rem;
		font-size: 0.94rem;
		line-height: 1.55;
		color: var(--text-3);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-top: 1.2rem;
	}
	.actions a {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid var(--line);
		border-radius: 0.2rem;
		padding: 0.5rem 0.7rem;
		color: var(--text-2);
		text-decoration: none;
		font-size: 0.78rem;
	}
	.actions a.primary {
		border-color: color-mix(in oklab, var(--accent-1) 55%, transparent);
		background: color-mix(in oklab, var(--accent-1) 12%, var(--surface-2));
		color: var(--accent-0);
	}
	.actions a:hover {
		border-color: var(--line-strong);
		color: var(--text-1);
	}
	.hint {
		margin-top: 1rem;
		padding-top: 0.8rem;
		border-top: 1px solid var(--line);
		font-size: 0.72rem;
		color: var(--text-4);
	}
</style>
