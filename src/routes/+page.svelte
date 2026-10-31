<script lang="ts">
	import TopBar from '#lib/components/navigation/TopBar.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { brand } from '#lib/brand';
	import { countries, indicatorKeys } from '#lib/data/countries';
	import { games } from '#lib/engines/game-engine/registry';
	import { mapLayers } from '#lib/configurations/map-layers';
	import { worldOutline } from '#lib/data/world-silhouette';
	import { locale } from '#lib/locale.svelte';
	import { t } from '#lib/i18n';

	const text = $derived(locale.value);

	const choices = $derived([
		{
			index: '01',
			href: '/explore',
			label: t('landing.explore', text),
			desc: t('landing.exploreDesc', text),
			icon: 'globe'
		},
		{
			index: '02',
			href: '/play',
			label: t('landing.play', text),
			desc: t('landing.playDesc', text),
			icon: 'gamepad'
		},
		{
			index: '03',
			href: '/paises',
			label: t('landing.countries', text),
			desc: t('landing.countriesDesc', text),
			icon: 'dossier'
		},
		{
			index: '04',
			href: '/sobre',
			label: t('landing.about', text),
			desc: t('landing.aboutDesc', text),
			icon: 'info'
		}
	]);

	const stats = $derived([
		{ value: countries.length, label: t('landing.territories', text) },
		{ value: indicatorKeys.length, label: t('landing.indicators', text) },
		{ value: games.length, label: t('landing.games', text) },
		{ value: mapLayers.length, label: t('landing.layers', text) }
	]);
</script>

<svelte:head>
	<title>{brand.name} — {brand.tagline}</title>
	<meta
		name="description"
		content="Atlas interativo de geografia e geopolítica: mapa em camadas, dossiês com fontes, séries temporais e jogos com dados reais."
	/>
</svelte:head>

<TopBar />

<div class="portal" id="conteudo">
	<div class="map-bg" aria-hidden="true">
		<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
			<path d={worldOutline} />
		</svg>
	</div>
	<div class="grain" aria-hidden="true"></div>

	<main>
		<header class="hero">
			<div class="kicker">
				<span class="eyebrow">{t('landing.eyebrow', text)}</span>
				<span class="line"></span>
				<span class="edition">Natural Earth · World Bank</span>
			</div>
			<h1>
				{t('landing.titleA', text)}<br />
				<em>{t('landing.titleB', text)}</em>
			</h1>
			<p class="lede">{t('landing.lede', text)}</p>
		</header>

		<nav class="choices" aria-label={t('nav.home', text)}>
			{#each choices as choice (choice.href)}
				<a class="choice" href={choice.href}>
					<span class="index">{choice.index}</span>
					<span class="body">
						<span class="label">{choice.label}</span>
						<span class="desc">{choice.desc}</span>
					</span>
					<span class="arrow"><Icon name="arrowUpRight" size={20} /></span>
				</a>
			{/each}
		</nav>

		<footer class="portal-foot">
			<dl class="stats">
				{#each stats as stat (stat.label)}
					<div>
						<dt>{stat.label}</dt>
						<dd>{stat.value}</dd>
					</div>
				{/each}
			</dl>
			<div class="foot-links">
				<span>{t('landing.footer', text)}</span>
				<a href="/sobre">{t('landing.sources', text)}</a>
			</div>
		</footer>
	</main>
</div>

<style>
	.portal {
		position: relative;
		min-height: 100dvh;
		overflow: hidden;
		background:
			radial-gradient(120% 100% at 50% 0%, color-mix(in oklab, var(--accent-1) 8%, transparent), transparent 55%),
			var(--surface-0);
	}
	.map-bg {
		position: fixed;
		inset: -6% -4%;
		z-index: 0;
		pointer-events: none;
		opacity: 0.62;
		animation: map-drift 26s ease-in-out infinite alternate;
	}
	.map-bg svg {
		width: 100%;
		height: 100%;
	}
	.map-bg path {
		fill: color-mix(in oklab, var(--accent-1) 5%, transparent);
		stroke: color-mix(in oklab, var(--accent-1) 30%, var(--line-strong));
		stroke-width: 0.14;
		vector-effect: non-scaling-stroke;
	}
	.grain {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background-image:
			linear-gradient(var(--line) 1px, transparent 1px),
			linear-gradient(90deg, var(--line) 1px, transparent 1px);
		background-size: 80px 80px;
		mask-image: radial-gradient(80% 70% at 50% 45%, transparent 35%, #000 100%);
		opacity: 0.35;
	}
	main {
		position: relative;
		z-index: 1;
		width: min(78rem, calc(100% - 2rem));
		margin: 0 auto;
		padding: calc(var(--header-h) + clamp(2rem, 7vh, 5rem)) 0 1.4rem;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}
	.hero {
		max-width: 62rem;
	}
	.kicker {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}
	.kicker .eyebrow {
		font-size: 0.68rem;
	}
	.kicker .line {
		width: 3rem;
		height: 1px;
		background: var(--line-strong);
	}
	.edition {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.04em;
		color: var(--text-4);
	}
	h1 {
		margin: 0.7rem 0 0;
		font-family: var(--font-display);
		font-size: clamp(3.6rem, 9vw, 8.4rem);
		font-weight: 600;
		line-height: 0.82;
		letter-spacing: -0.055em;
		text-transform: uppercase;
		color: var(--text-1);
	}
	h1 em {
		font-style: italic;
		font-weight: 500;
		color: color-mix(in oklab, var(--accent-1) 82%, var(--text-1));
	}
	.lede {
		max-width: 34rem;
		margin: 1rem 0 0;
		font-size: 1rem;
		line-height: 1.55;
		color: var(--text-3);
	}
	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		margin-top: clamp(1.8rem, 5vh, 3.2rem);
		border-top: 1px solid var(--line-strong);
	}
	.choice {
		display: grid;
		grid-template-columns: 2.4rem 1fr 2.8rem;
		align-items: center;
		gap: 0.8rem;
		padding: clamp(0.9rem, 2.2vh, 1.35rem) 1rem;
		border-bottom: 1px solid var(--line);
		text-decoration: none;
		color: var(--text-1);
		transition: background 0.18s ease, padding 0.18s ease;
	}
	.choice:nth-child(odd) {
		border-right: 1px solid var(--line);
	}
	.choice:hover,
	.choice:focus-visible {
		background: color-mix(in oklab, var(--accent-1) 7%, transparent);
		padding-left: 1.4rem;
	}
	.choice .index {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		color: var(--accent-1);
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 0.18rem;
		min-width: 0;
	}
	.label {
		font-family: var(--font-display);
		font-size: clamp(1.7rem, 3.2vw, 2.7rem);
		font-weight: 600;
		line-height: 0.95;
		letter-spacing: -0.03em;
		text-transform: uppercase;
	}
	.desc {
		font-size: 0.8rem;
		line-height: 1.4;
		color: var(--text-3);
	}
	.arrow {
		display: grid;
		place-items: center;
		width: 2.6rem;
		height: 2.6rem;
		border: 1px solid var(--line-strong);
		border-radius: 50%;
		color: var(--text-3);
		transition: transform 0.2s var(--ease-out-soft), color 0.2s ease, border-color 0.2s ease;
	}
	.choice:hover .arrow {
		transform: translate(2px, -2px);
		color: var(--accent-0);
		border-color: var(--accent-1);
	}
	.portal-foot {
		margin-top: auto;
		padding-top: 1.4rem;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
	}
	.stats {
		display: flex;
		gap: 1.8rem;
		margin: 0;
	}
	.stats div {
		display: flex;
		flex-direction: column-reverse;
		gap: 0.1rem;
	}
	.stats dt {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.stats dd {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1;
		color: var(--text-1);
	}
	.foot-links {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.58rem;
		color: var(--text-4);
		text-align: right;
	}
	.foot-links a {
		color: var(--text-3);
		text-decoration: none;
	}
	.foot-links a:hover {
		color: var(--accent-0);
	}
	@keyframes map-drift {
		from {
			transform: scale(1) translate3d(0, 0, 0);
		}
		to {
			transform: scale(1.035) translate3d(-1.2%, -0.8%, 0);
		}
	}
	@media (max-width: 760px) {
		main {
			width: calc(100% - 1.2rem);
			padding-top: calc(var(--header-h) + 1.6rem);
		}
		h1 {
			font-size: clamp(3.2rem, 16vw, 4.8rem);
		}
		.choices {
			grid-template-columns: 1fr;
		}
		.choice:nth-child(odd) {
			border-right: 0;
		}
		.choice {
			grid-template-columns: 2rem 1fr 2.4rem;
			padding: 0.95rem 0.4rem;
		}
		.choice:hover {
			padding-left: 0.6rem;
		}
		.label {
			font-size: clamp(1.6rem, 8vw, 2.1rem);
		}
		.desc {
			font-size: 0.74rem;
		}
		.portal-foot {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		.foot-links {
			align-items: flex-start;
			text-align: left;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.map-bg {
			animation: none;
		}
	}
</style>
