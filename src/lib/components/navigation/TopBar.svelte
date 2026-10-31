<script lang="ts">
	import type { Component } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { brand } from '#lib/brand';
	import Icon from '#lib/components/ui/Icon.svelte';
	import ThemeToggle from '#lib/components/ui/ThemeToggle.svelte';
	import { locale } from '#lib/locale.svelte';
	import { preferences } from '#lib/preferences.svelte';
	import { t } from '#lib/i18n';
	import { sound } from '#lib/sound.svelte';

	interface Props {
		compact?: boolean;
	}
	let { compact = false }: Props = $props();

	let paletteOpen = $state(false);
	let settingsOpen = $state(false);
	let settingsButton = $state<HTMLButtonElement | null>(null);
	let settingsPanel = $state<HTMLElement | null>(null);
	let Palette = $state<Component<Record<string, unknown>> | null>(null);

	const path = $derived(page.url.pathname);
	const text = $derived(locale.value);
	const isExplore = $derived(path.startsWith('/explore') || path.startsWith('/country'));
	const isPlay = $derived(path.startsWith('/play') || path.startsWith('/game'));

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
		if (event.key === 'Escape' && settingsOpen) closeSettings();
	}

	function openSettings() {
		settingsOpen = true;
		requestAnimationFrame(() => settingsPanel?.querySelector<HTMLElement>('button')?.focus());
	}

	function closeSettings() {
		settingsOpen = false;
		settingsButton?.focus();
	}
</script>

<svelte:window onkeydown={onShortcut} />

<header class:compact class="topbar">
	<a class="brand" href="/">
		<span class="mark" aria-hidden="true">
			<svg viewBox="0 0 32 32" width="27" height="27" fill="none">
				<circle cx="16" cy="16" r="12.6" stroke="currentColor" stroke-width="1" opacity=".55" />
				<path d="M16 2.5v3M16 26.5v3M2.5 16h3M26.5 16h3" stroke="currentColor" stroke-width="1.1" opacity=".7" />
				<path d="m16 6.5 3 8.1 8.2 1.4-8.2 1.4-3 8.1-3-8.1-8.2-1.4 8.2-1.4 3-8.1Z" stroke="currentColor" stroke-width="1" />
				<circle cx="16" cy="16" r="1.6" fill="currentColor" />
			</svg>
		</span>
		<span class="wordmark">
			{brand.name}
			<span class="sub">{t('nav.atlas', text)}</span>
		</span>
	</a>

	<nav aria-label="Navegação principal">
		<a href="/explore" class:active={isExplore} aria-current={isExplore ? 'page' : undefined}>
			<span class="num">01</span>{t('nav.explore', text)}
		</a>
		<a href="/play" class:active={isPlay} aria-current={isPlay ? 'page' : undefined}>
			<span class="num">02</span>{t('nav.play', text)}
		</a>
	</nav>

	<div class="actions">
		<button class="search" type="button" onclick={openSearch}>
			<Icon name="search" size={16} />
			<span class="search-label">{t('nav.search', text).split(',')[0]}</span>
			<kbd aria-hidden="true">⌘K</kbd>
		</button>
		<button
			bind:this={settingsButton}
			class="settings-toggle"
			type="button"
			onclick={() => (settingsOpen ? closeSettings() : openSettings())}
			aria-expanded={settingsOpen}
			aria-haspopup="dialog"
			aria-label={t('nav.settings', text)}
			title={t('nav.settings', text)}
		>
			<Icon name="settings" size={17} />
		</button>
		<a class="cta" href="/play">
			<span>{t('nav.playNow', text)}</span>
			<Icon name="arrowRight" size={14} />
		</a>
	</div>
</header>

{#if settingsOpen}
	<button class="settings-scrim" type="button" aria-label={t('settings.close', text)} onclick={closeSettings}></button>
	<div
		bind:this={settingsPanel}
		class="settings-panel"
		role="dialog"
		aria-modal="true"
		aria-label={t('settings.title', text)}
	>
		<header>
			<div>
				<span class="eyebrow">{t('nav.settings', text)}</span>
				<strong>{t('settings.title', text)}</strong>
			</div>
			<button type="button" class="close" onclick={closeSettings} aria-label={t('settings.close', text)}>
				<Icon name="close" size={16} />
			</button>
		</header>

		<div class="setting">
			<span class="setting-label">{t('settings.language', text)}</span>
			<div class="segmented" role="group" aria-label={t('settings.language', text)}>
				<button type="button" class:active={text === 'pt'} onclick={() => locale.set('pt')}>
					{t('settings.portuguese', text)}
				</button>
				<button type="button" class:active={text === 'en'} onclick={() => locale.set('en')}>
					{t('settings.english', text)}
				</button>
			</div>
		</div>

		<div class="setting">
			<span class="setting-label">{t('settings.appearance', text)}</span>
			<ThemeToggle />
		</div>

		<div class="setting">
			<span class="setting-label">{t('settings.sound', text)}</span>
			<button
				class="sound-toggle"
				type="button"
				onclick={() => sound.toggle()}
				aria-label={sound.enabled ? t('settings.soundOff', text) : t('settings.soundOn', text)}
				aria-pressed={sound.enabled}
			>
				<Icon name={sound.enabled ? 'volume' : 'volumeOff'} size={16} />
				<span>{sound.enabled ? t('settings.soundOn', text) : t('settings.soundOff', text)}</span>
			</button>
		</div>

		<div class="setting">
			<span class="setting-label">{t('settings.text', text)}</span>
			<div class="segmented" role="group" aria-label={t('settings.text', text)}>
				<button
					type="button"
					class:active={preferences.textScale === 'normal'}
					onclick={() => preferences.setTextScale('normal')}
				>
					{t('settings.textNormal', text)}
				</button>
				<button
					type="button"
					class:active={preferences.textScale === 'large'}
					onclick={() => preferences.setTextScale('large')}
				>
					{t('settings.textLarge', text)}
				</button>
			</div>
		</div>

		<a class="sources" href="/sobre">
			<Icon name="info" size={15} /> {t('settings.sources', text)}
			<Icon name="arrowUpRight" size={13} />
		</a>
		<p class="note">{t('settings.note', text)}</p>
	</div>
{/if}

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
		font-size: 1.22rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
	.sub {
		font-family: var(--font-mono);
		font-size: 0.54rem;
		letter-spacing: 0.16em;
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
		padding: 0.45rem 0.65rem;
		color: var(--text-3);
		font-size: 0.84rem;
		font-weight: 500;
		text-decoration: none;
		transition: color 0.16s ease;
	}
	nav .num {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.08em;
		color: var(--text-4);
	}
	nav a:hover,
	nav a.active {
		color: var(--text-1);
	}
	nav a.active .num {
		color: var(--accent-1);
	}
	nav a.active::after {
		content: '';
		position: absolute;
		left: 0.65rem;
		right: 0.65rem;
		bottom: 0.08rem;
		height: 2px;
		background: var(--accent-1);
	}
	.actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-3);
		border-radius: 0.2rem;
		padding: 0.42rem 0.5rem 0.42rem 0.6rem;
		font-size: 0.78rem;
		transition: border-color 0.16s ease, color 0.16s ease;
	}
	.search:hover {
		border-color: var(--line-strong);
		color: var(--text-1);
	}
	kbd {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		color: var(--text-4);
		border: 1px solid var(--line);
		border-radius: 0.12rem;
		padding: 0.08rem 0.24rem;
		margin-left: 0.15rem;
	}
	.settings-toggle {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-2);
		border-radius: 0.2rem;
	}
	.settings-toggle:hover,
	.settings-toggle[aria-expanded='true'] {
		color: var(--text-1);
		border-color: var(--line-strong);
		background: var(--surface-2);
	}
	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid color-mix(in oklab, var(--accent-1) 55%, transparent);
		color: var(--accent-0);
		background: color-mix(in oklab, var(--accent-1) 10%, var(--surface-2));
		border-radius: 0.2rem;
		padding: 0.48rem 0.7rem;
		font-size: 0.78rem;
		font-weight: 600;
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
	.settings-scrim {
		position: fixed;
		inset: 0;
		z-index: 54;
		border: 0;
		background: color-mix(in oklab, var(--surface-0) 28%, transparent);
	}
	.settings-panel {
		position: fixed;
		top: calc(var(--header-h) + 0.55rem);
		right: 0.75rem;
		z-index: 55;
		width: min(22rem, calc(100vw - 1.5rem));
		padding: 0.95rem 1rem 1rem;
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		border-radius: 0.3rem;
		box-shadow: 0 28px 60px -30px rgb(0 0 0 / 0.55);
	}
	.settings-panel header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		padding-bottom: 0.7rem;
		margin-bottom: 0.35rem;
		border-bottom: 1px solid var(--line);
	}
	.settings-panel header strong {
		display: block;
		margin-top: 0.15rem;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
	}
	.settings-panel .close {
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-3);
		padding: 0.3rem;
		display: grid;
		place-items: center;
	}
	.settings-panel .close:hover {
		color: var(--text-1);
		border-color: var(--line);
	}
	.setting {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--line);
	}
	.setting-label {
		font-size: 0.78rem;
		color: var(--text-3);
	}
	.segmented {
		display: inline-flex;
		border: 1px solid var(--line);
		border-radius: 0.2rem;
		background: var(--surface-1);
		overflow: hidden;
	}
	.segmented button {
		border: 0;
		background: transparent;
		color: var(--text-3);
		padding: 0.35rem 0.55rem;
		font-size: 0.7rem;
	}
	.segmented button + button {
		border-left: 1px solid var(--line);
	}
	.segmented button.active {
		color: var(--accent-0);
		background: color-mix(in oklab, var(--accent-1) 15%, var(--surface-2));
	}
	.sound-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-2);
		border-radius: 0.2rem;
		padding: 0.38rem 0.5rem;
		font-size: 0.7rem;
	}
	.sound-toggle:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
	.sources {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.75rem;
		padding-top: 0.7rem;
		border-top: 1px solid var(--line);
		color: var(--text-2);
		text-decoration: none;
		font-size: 0.8rem;
	}
	.sources:hover {
		color: var(--accent-0);
	}
	.sources :global(svg:last-child) {
		margin-left: auto;
	}
	.note {
		margin: 0.65rem 0 0;
		font-size: 0.68rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	@media (max-width: 900px) {
		.sub {
			display: none;
		}
	}
	@media (max-width: 760px) {
		.topbar {
			gap: 0.7rem;
			padding: 0 0.7rem;
		}
		.wordmark {
			font-size: 1.05rem;
		}
		nav a {
			padding: 0.4rem 0.45rem;
			font-size: 0.78rem;
		}
		nav .num,
		.search-label,
		kbd,
		.cta span {
			display: none;
		}
		.cta {
			padding: 0.45rem;
		}
		.search {
			padding: 0.4rem;
		}
		.settings-panel {
			left: 0.4rem;
			right: 0.4rem;
			width: auto;
			max-height: calc(100dvh - var(--header-h) - 1rem);
			overflow-y: auto;
		}
	}
</style>
