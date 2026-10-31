<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import { silhouettes } from '#lib/data/silhouettes';
	import { worldOutline } from '#lib/data/world-silhouette';

	interface Props {
		slug: string;
		icon: string;
	}

	let { slug, icon }: Props = $props();
</script>

<div class="cover" aria-hidden="true">
	{#if slug === 'flags'}
		<div class="flags">
			<span class="fi fi-br"></span>
			<span class="fi fi-jp"></span>
			<span class="fi fi-za"></span>
		</div>
	{:else if slug === 'silhouettes'}
		<div class="silhouette-art">
			<svg viewBox="0 0 100 100"><path d={silhouettes['BRA']} /></svg>
			<span class="mark">?</span>
		</div>
	{:else if slug === 'country-finder'}
		<div class="world-art">
			<svg viewBox="0 0 100 100"><path d={worldOutline} /></svg>
			<span class="mark"><Icon name="pin" size={16} /></span>
		</div>
	{:else if slug === 'capital-match'}
		<div class="type-art">
			<span>A</span><em>a</em><i></i>
		</div>
	{:else if slug === 'world-rankings'}
		<div class="bars-art">
			{#each [42, 66, 32, 84, 54, 96, 72] as height (height)}
				<span style:height={`${height}%`}></span>
			{/each}
		</div>
	{:else if slug === 'blocs'}
		<div class="bloc-art">
			<span class="dot d1"></span>
			<span class="dot d2"></span>
			<span class="dot d3"></span>
			<span class="dot d4"></span>
			<span class="ring"></span>
			<Icon name="shield" size={22} />
		</div>
	{:else if slug === 'landlocked'}
		<div class="coast-art">
			<span class="land"></span>
			<span class="water"><Icon name="wave" size={26} /></span>
		</div>
	{:else if slug === 'borders'}
		<div class="border-art">
			<span class="shape a"></span>
			<span class="shape b"></span>
			<i class="frontier"></i>
		</div>
	{:else if slug === 'economy-quiz'}
		<div class="economy-art">
			<svg viewBox="0 0 100 38" preserveAspectRatio="none">
				<polyline points="0,32 14,24 28,27 42,15 56,19 70,9 84,12 100,3" />
				<polyline class="ghost" points="0,36 14,30 28,33 42,26 56,28 70,22 84,25 100,18" />
			</svg>
			<span class="coin"><Icon name="coins" size={16} /></span>
		</div>
	{:else}
		<span class="glyph"><Icon name={icon} size={30} /></span>
	{/if}
</div>

<style>
	.cover {
		position: relative;
		height: 82px;
		display: grid;
		place-items: center;
		overflow: hidden;
		background:
			linear-gradient(120deg, color-mix(in oklab, var(--cat, var(--accent-1)) 13%, var(--surface-2)), var(--surface-1) 70%);
		border-bottom: 1px solid var(--line);
	}
	.cover::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(var(--line) 1px, transparent 1px),
			linear-gradient(90deg, var(--line) 1px, transparent 1px);
		background-size: 18px 18px;
		opacity: 0.5;
		mask-image: radial-gradient(80% 120% at 20% 0%, #000 0%, transparent 75%);
		pointer-events: none;
	}
	.cover > * {
		position: relative;
		z-index: 1;
	}
	.mark {
		display: grid;
		place-items: center;
		width: 27px;
		height: 27px;
		border: 1px solid color-mix(in oklab, var(--cat, var(--accent-1)) 55%, transparent);
		border-radius: 50%;
		background: var(--surface-2);
		color: var(--cat, var(--accent-1));
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		line-height: 1;
	}
	.flags {
		display: flex;
		align-items: center;
	}
	.flags span {
		width: 48px;
		height: 33px;
		background-size: cover;
		border: 1px solid var(--line-strong);
		box-shadow: 0 8px 16px -12px rgb(0 0 0 / 0.7);
	}
	.flags span:first-child {
		transform: translateX(10px) rotate(-9deg);
	}
	.flags span:last-child {
		transform: translateX(-10px) rotate(9deg);
	}
	.flags span:nth-child(2) {
		z-index: 2;
		transform: scale(1.08);
	}
	.silhouette-art {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}
	.silhouette-art svg {
		width: 68px;
		height: 68px;
		fill: color-mix(in oklab, var(--cat, var(--accent-1)) 55%, var(--text-4));
		opacity: 0.88;
	}
	.world-art {
		position: relative;
		display: grid;
		place-items: center;
	}
	.world-art svg {
		width: 176px;
		height: 68px;
		fill: color-mix(in oklab, var(--cat, var(--accent-1)) 34%, transparent);
		stroke: color-mix(in oklab, var(--cat, var(--accent-1)) 62%, transparent);
		stroke-width: 0.45;
	}
	.world-art .mark {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	.type-art {
		display: flex;
		align-items: baseline;
		gap: 0.1rem;
		font-family: var(--font-display);
		color: var(--cat, var(--accent-1));
		line-height: 0.9;
	}
	.type-art span {
		font-size: 2.9rem;
		font-weight: 600;
	}
	.type-art em {
		font-size: 1.5rem;
		font-style: italic;
	}
	.type-art i {
		width: 2px;
		height: 2rem;
		margin-left: 0.2rem;
		background: currentColor;
		animation: pulse-soft 1.4s ease-in-out infinite;
	}
	.bars-art {
		display: flex;
		align-items: flex-end;
		gap: 5px;
		height: 54px;
	}
	.bars-art span {
		width: 9px;
		min-height: 8px;
		background: color-mix(in oklab, var(--cat, var(--accent-1)) 64%, transparent);
		border-top: 2px solid var(--cat, var(--accent-1));
	}
	.bars-art span:nth-child(3n) {
		background: color-mix(in oklab, var(--cat, var(--accent-1)) 38%, transparent);
	}
	.bloc-art {
		position: relative;
		display: grid;
		place-items: center;
		width: 74px;
		height: 74px;
		color: var(--cat, var(--accent-1));
	}
	.bloc-art .ring {
		position: absolute;
		inset: 4px;
		border: 1px solid color-mix(in oklab, var(--cat, var(--accent-1)) 35%, transparent);
		border-radius: 50%;
	}
	.bloc-art .dot {
		position: absolute;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
	}
	.bloc-art .d1 {
		top: 2px;
		left: 50%;
		transform: translateX(-50%);
	}
	.bloc-art .d2 {
		right: 4px;
		top: 50%;
		transform: translateY(-50%);
	}
	.bloc-art .d3 {
		bottom: 2px;
		left: 50%;
		transform: translateX(-50%);
	}
	.bloc-art .d4 {
		left: 4px;
		top: 50%;
		transform: translateY(-50%);
	}
	.coast-art {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--cat, var(--accent-1));
	}
	.coast-art .land {
		width: 54px;
		height: 38px;
		border: 1px solid color-mix(in oklab, currentColor 55%, transparent);
		border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%;
		background: color-mix(in oklab, currentColor 18%, transparent);
	}
	.coast-art .water {
		display: grid;
		place-items: center;
		opacity: 0.85;
	}
	.border-art {
		position: relative;
		display: flex;
		align-items: center;
	}
	.border-art .shape {
		width: 52px;
		height: 42px;
		border: 1px solid color-mix(in oklab, var(--cat, var(--accent-1)) 60%, transparent);
		background: color-mix(in oklab, var(--cat, var(--accent-1)) 12%, transparent);
	}
	.border-art .a {
		border-radius: 8px 0 0 8px;
		clip-path: polygon(0 0, 100% 8%, 92% 48%, 100% 92%, 0 100%);
	}
	.border-art .b {
		border-radius: 0 8px 8px 0;
		clip-path: polygon(8% 8%, 100% 0, 100% 100%, 0 92%, 8% 48%);
	}
	.border-art .frontier {
		position: absolute;
		left: 50%;
		top: 4px;
		bottom: 4px;
		width: 0;
		border-left: 1px dashed var(--cat, var(--accent-1));
		transform: translateX(-50%);
	}
	.economy-art {
		position: relative;
		display: grid;
		place-items: center;
		width: 150px;
		height: 62px;
		color: var(--cat, var(--accent-1));
	}
	.economy-art svg {
		width: 140px;
		height: 52px;
		overflow: visible;
	}
	.economy-art polyline {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.economy-art polyline.ghost {
		stroke: color-mix(in oklab, currentColor 35%, transparent);
		stroke-width: 1;
		stroke-dasharray: 3 4;
	}
	.economy-art .coin {
		position: absolute;
		right: -2px;
		bottom: -2px;
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border: 1px solid color-mix(in oklab, currentColor 55%, transparent);
		border-radius: 50%;
		background: var(--surface-2);
	}
	.glyph {
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border: 1px solid color-mix(in oklab, var(--cat, var(--accent-1)) 50%, transparent);
		color: var(--cat, var(--accent-1));
	}
</style>
