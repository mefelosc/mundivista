<script lang="ts">
	import { page } from '$app/state';
	import { brand } from '#lib/brand';
	import Icon from '#lib/components/ui/Icon.svelte';

	interface Props {
		onSearch?: () => void;
		compact?: boolean;
	}
	let { onSearch, compact = false }: Props = $props();

	const path = $derived(page.url.pathname);
	const isExplore = $derived(path.startsWith('/explore'));
	const isPlay = $derived(path.startsWith('/play') || path.startsWith('/game'));
</script>

<header class:compact class="topbar">
	<a class="brand" href="/explore" aria-label={`${brand.name} — início`}>
		<span class="mark" aria-hidden="true">
			<svg viewBox="0 0 32 32" width="26" height="26" fill="none">
				<circle cx="16" cy="16" r="12.5" stroke="currentColor" stroke-width="1.1" opacity=".65" />
				<ellipse cx="16" cy="16" rx="6" ry="12.5" stroke="currentColor" stroke-width="1" opacity=".45" />
				<path d="M3.8 16h24.4M5.6 9.2h20.8M5.6 22.8h20.8" stroke="currentColor" stroke-width="1" opacity=".45" />
				<circle cx="22.4" cy="10.2" r="1.9" fill="var(--color-gold-400)" />
			</svg>
		</span>
		<span class="wordmark">{brand.name}</span>
		<span class="beta">beta</span>
	</a>

	<nav aria-label="Navegação principal">
		<a href="/explore" class:active={isExplore}>Explorar</a>
		<a href="/play" class:active={isPlay}>Jogar</a>
	</nav>

	<div class="actions">
		{#if onSearch}
			<button class="search" type="button" onclick={onSearch} aria-label="Buscar país">
				<Icon name="search" size={15} />
				<span class="search-label">Buscar país</span>
				<kbd>⌘K</kbd>
			</button>
		{/if}
		<a class="cta" href="/play">
			<Icon name="play" size={13} />
			<span>Jogar</span>
		</a>
	</div>
</header>

<style>
	.topbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 40;
		height: var(--header-h);
		display: flex;
		align-items: center;
		gap: 1.75rem;
		padding: 0 1.1rem 0 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		background: color-mix(in oklab, #06090e 78%, transparent);
		backdrop-filter: blur(20px) saturate(130%);
	}
	.compact {
		background: color-mix(in oklab, #06090e 60%, transparent);
		border-bottom-color: rgba(255, 255, 255, 0.045);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		color: var(--color-mist-100);
		text-decoration: none;
		flex-shrink: 0;
	}
	.mark {
		display: grid;
		place-items: center;
		color: var(--color-gold-300);
	}
	.wordmark {
		font-size: 0.94rem;
		font-weight: 650;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.beta {
		font-family: var(--font-mono);
		font-size: 0.55rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-mist-500);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 999px;
		padding: 0.12rem 0.4rem;
		transform: translateY(-1px);
	}
	nav {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	nav a {
		position: relative;
		padding: 0.45rem 0.7rem;
		border-radius: 0.4rem;
		color: var(--color-mist-400);
		font-size: 0.83rem;
		font-weight: 500;
		text-decoration: none;
		transition: color 0.18s ease, background 0.18s ease;
	}
	nav a:hover {
		color: var(--color-mist-100);
		background: rgba(255, 255, 255, 0.04);
	}
	nav a.active {
		color: var(--color-mist-100);
	}
	nav a.active::after {
		content: '';
		position: absolute;
		left: 0.7rem;
		right: 0.7rem;
		bottom: 0.1rem;
		height: 1px;
		background: var(--color-gold-400);
	}
	.actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.09);
		background: rgba(255, 255, 255, 0.025);
		color: var(--color-mist-400);
		border-radius: 0.45rem;
		padding: 0.38rem 0.55rem 0.38rem 0.6rem;
		font-size: 0.76rem;
		transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
	}
	.search:hover {
		border-color: rgba(255, 255, 255, 0.18);
		color: var(--color-mist-200);
		background: rgba(255, 255, 255, 0.045);
	}
	kbd {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--color-mist-500);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.25rem;
		padding: 0.1rem 0.25rem;
		margin-left: 0.15rem;
	}
	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid color-mix(in oklab, var(--color-gold-400) 45%, transparent);
		color: var(--color-gold-300);
		background: color-mix(in oklab, var(--color-gold-400) 9%, transparent);
		border-radius: 0.45rem;
		padding: 0.4rem 0.7rem;
		font-size: 0.76rem;
		font-weight: 550;
		text-decoration: none;
		transition: background 0.18s ease, border-color 0.18s ease;
	}
	.cta:hover {
		background: color-mix(in oklab, var(--color-gold-400) 16%, transparent);
		border-color: color-mix(in oklab, var(--color-gold-400) 65%, transparent);
	}
	@media (max-width: 720px) {
		.topbar {
			gap: 0.75rem;
			padding: 0 0.75rem;
		}
		.wordmark {
			font-size: 0.8rem;
			letter-spacing: 0.12em;
		}
		.beta,
		.search-label,
		kbd,
		.cta {
			display: none;
		}
		.search {
			padding: 0.4rem;
		}
		nav a {
			padding: 0.4rem 0.5rem;
			font-size: 0.78rem;
		}
	}
</style>
