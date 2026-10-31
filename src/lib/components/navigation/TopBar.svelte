<script lang="ts">
	import type { Component } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { brand } from '#lib/brand';
	import Icon from '#lib/components/ui/Icon.svelte';
	import ThemeToggle from '#lib/components/ui/ThemeToggle.svelte';
	import { localeFromUrl, t } from '#lib/i18n';
	import { sound } from '#lib/sound.svelte';

	interface Props {
		compact?: boolean;
	}
	let { compact = false }: Props = $props();

	let paletteOpen = $state(false);
	let Palette = $state<Component<Record<string, unknown>> | null>(null);

	async function openSearch() {
		paletteOpen = true;
		if (!Palette) {
			const module = await import('./CommandPalette.svelte');
			Palette = module.default as Component<Record<string, unknown>>;
		}
	}

	function onShortcut(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			if (paletteOpen) paletteOpen = false;
			else openSearch();
		}
	}

	const path = $derived(page.url.pathname);
	const locale = $derived(typeof window === 'undefined' ? 'pt' : localeFromUrl(page.url));
	const isExplore = $derived(path.startsWith('/explore') || path.startsWith('/country'));
	const isPlay = $derived(path.startsWith('/play') || path.startsWith('/game'));
</script>

<svelte:window onkeydown={onShortcut} />

<header class:compact class="topbar">
	<a class="brand" href="/explore">
		<span class="mark" aria-hidden="true">
			<svg viewBox="0 0 32 32" width="25" height="25" fill="none">
				<circle cx="16" cy="16" r="12.6" stroke="currentColor" stroke-width="1" opacity=".55" />
				<path d="M16 2.5v3M16 26.5v3M2.5 16h3M26.5 16h3" stroke="currentColor" stroke-width="1.1" opacity=".7" />
				<path d="m16 6.5 3 8.1 8.2 1.4-8.2 1.4-3 8.1-3-8.1-8.2-1.4 8.2-1.4 3-8.1Z" stroke="currentColor" stroke-width="1" />
				<circle cx="16" cy="16" r="1.6" fill="currentColor" />
			</svg>
		</span>
		<span class="wordmark">
			{brand.name}
			<span class="sub">{t('nav.atlas', locale)}</span>
		</span>
	</a>

	<nav aria-label="Navegação principal">
		<a href="/explore" class:active={isExplore} aria-current={isExplore ? 'page' : undefined}><span class="num">01</span>{t('nav.explore', locale)}</a>
		<a href="/play" class:active={isPlay} aria-current={isPlay ? 'page' : undefined}><span class="num">02</span>{t('nav.play', locale)}</a>
		<a href="/sobre" class:active={path.startsWith('/sobre')} aria-current={path.startsWith('/sobre') ? 'page' : undefined}><span class="num">03</span>{t('nav.sources', locale)}</a>
	</nav>

	<div class="actions">
		<button class="search" type="button" onclick={openSearch}>
			<Icon name="search" size={14} />
			<span class="search-label">{t('nav.search', locale).split(',')[0]}</span>
			<span class="sr-only">{t('nav.search', locale)}</span>
			<kbd aria-hidden="true">⌘K</kbd>
		</button>
		<button
			class="sound-toggle"
			type="button"
			onclick={() => sound.toggle()}
			aria-label={sound.enabled ? 'Desativar sons' : 'Ativar sons'}
			aria-pressed={sound.enabled}
			title={sound.enabled ? 'Sons ativados' : 'Sons desativados'}
		>
			<Icon name={sound.enabled ? 'volume' : 'volumeOff'} size={15} />
		</button>
		<span class="theme-full"><ThemeToggle /></span>
		<span class="theme-compact"><ThemeToggle compact /></span>
		<a class="cta" href="/play">
			<span>{t('nav.playNow', locale)}</span>
			<Icon name="arrowRight" size={13} />
		</a>
	</div>
</header>

{#if Palette}
	<Palette
		bind:open={paletteOpen}
		oncountry={(code: string) => goto(`/explore?country=${code}`)}
		onlayer={(id: string) => goto(`/explore?layer=${id}`)}
		onclose={() => (paletteOpen = false)}
	/>
{/if}

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
		gap: 2rem;
		padding: 0 1rem 0 1.1rem;
		border-bottom: 1px solid var(--line);
		background: color-mix(in oklab, var(--surface-0) 96%, transparent);
	}
	.topbar::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -4px;
		height: 4px;
		background-image: repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 9px);
		pointer-events: none;
		opacity: 0.7;
	}
	.compact {
		background: color-mix(in oklab, var(--surface-0) 88%, transparent);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--text-1);
		text-decoration: none;
		flex-shrink: 0;
	}
	.mark {
		display: grid;
		place-items: center;
		color: var(--accent-1);
	}
	.wordmark {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
		font-family: var(--font-display);
		font-optical-sizing: auto;
		font-size: 1.12rem;
		font-weight: 600;
		letter-spacing: 0.035em;
	}
	.sub {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		font-weight: 400;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	nav {
		display: flex;
		align-items: center;
		gap: 0.15rem;
	}
	nav a {
		position: relative;
		display: inline-flex;
		align-items: baseline;
		gap: 0.32rem;
		padding: 0.42rem 0.62rem;
		color: var(--text-3);
		font-size: 0.79rem;
		font-weight: 500;
		text-decoration: none;
		transition: color 0.16s ease;
	}
	nav .num {
		font-family: var(--font-mono);
		font-size: 0.46rem;
		letter-spacing: 0.08em;
		color: var(--text-4);
		transition: color 0.16s ease;
	}
	nav a:hover {
		color: var(--text-1);
	}
	nav a.active {
		color: var(--text-1);
	}
	nav a.active .num {
		color: var(--accent-1);
	}
	nav a.active::after {
		content: '';
		position: absolute;
		left: 0.62rem;
		right: 0.62rem;
		bottom: 0.1rem;
		height: 1px;
		background: var(--accent-1);
	}
	.actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}
	.theme-compact {
		display: none;
	}
	.sound-toggle {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-3);
		border-radius: 0.15rem;
	}
	.sound-toggle:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
	.sound-toggle[aria-pressed='false'] {
		color: var(--text-4);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-3);
		border-radius: 0.15rem;
		padding: 0.34rem 0.45rem 0.34rem 0.55rem;
		font-size: 0.73rem;
		transition: border-color 0.16s ease, color 0.16s ease;
	}
	.search:hover {
		border-color: var(--line-strong);
		color: var(--text-1);
	}
	kbd {
		font-family: var(--font-mono);
		font-size: 0.56rem;
		color: var(--text-4);
		border: 1px solid var(--line);
		border-radius: 0.1rem;
		padding: 0.08rem 0.22rem;
		margin-left: 0.15rem;
	}
	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid color-mix(in oklab, var(--accent-1) 55%, transparent);
		color: var(--accent-0);
		background: color-mix(in oklab, var(--accent-1) 10%, var(--surface-2));
		border-radius: 0.15rem;
		padding: 0.42rem 0.62rem;
		font-size: 0.74rem;
		font-weight: 550;
		text-decoration: none;
		transition: background 0.16s ease;
	}
	.cta:hover {
		background: color-mix(in oklab, var(--accent-1) 18%, var(--surface-2));
	}
	.cta :global(svg) {
		transition: transform 0.2s var(--ease-out-soft);
	}
	.cta:hover :global(svg) {
		transform: translateX(2px);
	}
	@media (max-width: 900px) {
		.sub {
			display: none;
		}
	}
	@media (max-width: 760px) {
		.topbar {
			gap: 0.8rem;
			padding: 0 0.7rem;
		}
		.wordmark {
			font-size: 1rem;
		}
		nav a {
			padding: 0.38rem 0.45rem;
			font-size: 0.74rem;
		}
		nav .num,
		.search-label,
		kbd,
		.cta span {
			display: none;
		}
		.cta {
			padding: 0.42rem;
		}
		.search {
			padding: 0.38rem;
		}
		.theme-full {
			display: none;
		}
		.theme-compact {
			display: block;
		}
	}
</style>
