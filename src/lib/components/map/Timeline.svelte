<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import {
		eventForYear,
		membershipAt,
		TIMELINE_END,
		TIMELINE_START,
		timelineEvents
	} from '#lib/data/timeline';

	interface Props {
		year: number | null;
		onchange: (year: number | null) => void;
		onfly?: (center: [number, number], zoom: number) => void;
	}
	let { year, onchange, onfly }: Props = $props();

	const activeYear = $derived(year ?? 1989);
	const event = $derived(year ? eventForYear(year) : null);
	const members = $derived(year ? membershipAt(year).length : 0);
	const position = (value: number) => ((value - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100;
</script>

<section class="timeline panel" aria-label="Linha do tempo histórica">
	<header>
		<div>
			<span class="eyebrow">Linha do tempo · 1945–2026</span>
			<strong>{year ? `${year} · ${members} países em blocos` : 'Escolha um ano'}</strong>
		</div>
		{#if year}
			<button type="button" class="clear" onclick={() => onchange(null)} aria-label="Limpar recorte histórico">
				<Icon name="close" size={12} /> Limpar
			</button>
		{/if}
	</header>

	<div class="rail">
		<input
			type="range"
			min={TIMELINE_START}
			max={TIMELINE_END}
			value={activeYear}
			step="1"
			oninput={(event) => onchange(Number((event.currentTarget as HTMLInputElement).value))}
			aria-label="Ano do recorte histórico"
		/>
		<div class="marks" aria-hidden="true">
			{#each [1945, 1960, 1980, 2000, 2020, 2026] as mark (mark)}
				<span style:left={`${position(mark)}%`}>{mark}</span>
			{/each}
		</div>
		<div class="events" aria-hidden="true">
			{#each timelineEvents as item (item.year)}
				<button
					type="button"
					tabindex="-1"
					class:active={year === item.year}
					style:left={`${position(item.year)}%`}
					title={`${item.year} — ${item.title}`}
					onclick={() => onchange(item.year)}
				></button>
			{/each}
		</div>
	</div>

	{#if event}
		<div class="event">
			<div class="event-head">
				<span class="year">{event.year}</span>
				<strong>{event.title}</strong>
			</div>
			<p>{event.detail}</p>
			<div class="event-foot">
				<a href={event.source.url} target="_blank" rel="noopener noreferrer">
					{event.source.name} <Icon name="external" size={10} />
				</a>
				{#if event.center && onfly}
					<button type="button" onclick={() => onfly(event.center!, event.zoom ?? 2.5)}>
						Ver região <Icon name="arrowUpRight" size={11} />
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<p class="empty">
			Arraste para ver quais blocos existiam em cada ano. O destaque usa a composição curada e os
			polígonos atuais como aproximação — não são fronteiras históricas.
		</p>
	{/if}
</section>

<style>
	.timeline {
		position: fixed;
		left: 50%;
		bottom: 0.75rem;
		transform: translateX(-50%);
		z-index: 26;
		width: min(38rem, calc(100vw - 1.5rem));
		padding: 0.55rem 0.7rem 0.6rem;
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}
	header strong {
		display: block;
		margin-top: 0.18rem;
		font-family: var(--font-display);
		font-size: 0.96rem;
		font-weight: 600;
	}
	header .eyebrow {
		font-size: 0.5rem;
	}
	.clear {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		border: 1px solid var(--line);
		background: transparent;
		color: var(--text-4);
		font-size: 0.64rem;
		padding: 0.2rem 0.36rem;
	}
	.clear:hover {
		color: var(--text-1);
	}
	.rail {
		position: relative;
		margin: 0.55rem 0 0.2rem;
		padding-top: 0.4rem;
	}
	input[type='range'] {
		appearance: none;
		width: 100%;
		height: 3px;
		background: var(--line-strong);
		outline: none;
		margin: 0;
	}
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 11px;
		height: 16px;
		background: var(--accent-1);
		border: 1px solid var(--accent-0);
		cursor: ew-resize;
	}
	input[type='range']::-moz-range-thumb {
		width: 10px;
		height: 15px;
		background: var(--accent-1);
		border: 1px solid var(--accent-0);
		border-radius: 0;
		cursor: ew-resize;
	}
	.marks {
		position: relative;
		height: 0.85rem;
		margin-top: 0.15rem;
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--text-4);
	}
	.marks span {
		position: absolute;
		transform: translateX(-50%);
	}
	.marks span:first-child {
		transform: none;
	}
	.marks span:last-child {
		transform: translateX(-100%);
	}
	.events {
		position: absolute;
		top: 0.34rem;
		left: 0;
		right: 0;
		height: 16px;
		pointer-events: none;
	}
	.events button {
		position: absolute;
		top: 0;
		width: 5px;
		height: 16px;
		transform: translateX(-50%);
		border: 0;
		background: transparent;
		border-left: 1px solid color-mix(in oklab, var(--accent-1) 55%, transparent);
		pointer-events: auto;
		cursor: pointer;
		padding: 0;
	}
	.events button.active {
		border-left-color: var(--accent-0);
		border-left-width: 2px;
	}
	.event {
		margin-top: 0.35rem;
		padding-top: 0.4rem;
		border-top: 1px solid var(--line);
	}
	.event-head {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
	}
	.year {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		color: var(--accent-0);
	}
	.event-head strong {
		font-family: var(--font-display);
		font-size: 0.94rem;
		font-weight: 600;
	}
	.event p {
		margin: 0.2rem 0 0.3rem;
		font-size: 0.64rem;
		line-height: 1.5;
		color: var(--text-3);
	}
	.event-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.event-foot a,
	.event-foot button {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-family: var(--font-mono);
		font-size: 0.5rem;
		color: var(--text-4);
		text-decoration: none;
		border: 0;
		background: transparent;
		padding: 0;
	}
	.event-foot a:hover,
	.event-foot button:hover {
		color: var(--text-2);
	}
	.empty {
		margin: 0.35rem 0 0;
		font-size: 0.64rem;
		line-height: 1.5;
		color: var(--text-4);
	}
	@media (max-width: 900px) {
		.timeline {
			bottom: calc(7.4rem + env(safe-area-inset-bottom));
			width: calc(100vw - 0.8rem);
			padding: 0.45rem 0.5rem;
		}
		.event p,
		.empty {
			display: none;
		}
	}
</style>
