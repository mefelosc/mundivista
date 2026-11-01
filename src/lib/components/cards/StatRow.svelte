<script lang="ts">
	import Sparkline from './Sparkline.svelte';
	import { locale } from '#lib/locale.svelte';

	interface Props {
		label: string;
		value: string;
		year?: number | null;
		note?: string | null;
		percentile?: number | null;
		comparison?: string | null;
		accent?: string;
		/** 'fact' = rótulo/valor; 'metric' = cartão de indicador. */
		variant?: 'fact' | 'metric';
		/** Versão enxuta usada no card do mapa. */
		compact?: boolean;
		series?: [number, number][] | null;
		format?: (value: number) => string;
		delta?: 'percent' | 'points';
	}
	let {
		label,
		value,
		year,
		note,
		percentile = null,
		comparison = null,
		accent = 'var(--accent-1)',
		variant = 'fact',
		compact = false,
		series = null,
		format,
		delta = 'percent'
	}: Props = $props();
	const isEn = $derived(locale.value === 'en');
</script>

{#if variant === 'fact'}
	<div class="fact" class:compact>
		<span class="fact-label">{label}</span>
		<span class="fact-value">
			{value}
			{#if year}<em>{year}</em>{/if}
		</span>
		{#if note}<p class="note">{note}</p>{/if}
	</div>
{:else}
	<div class="metric" class:compact title={comparison ?? undefined}>
		<div class="metric-head">
			<span class="metric-label">{label}</span>
			{#if year}<span class="metric-year">{year}</span>{/if}
		</div>
		<strong class="metric-value">{value}</strong>

		{#if percentile !== null}
			<div class="meter" aria-hidden="true">
				<span style:width={`${Math.max(2, Math.min(100, percentile * 100))}%`} style:background={accent}></span>
			</div>
			<div class="metric-meta">
				<span class="pct">{isEn ? 'percentile' : 'percentil'} {Math.round(percentile * 100)}</span>
				{#if !compact && comparison}<span class="comparison">{comparison}</span>{/if}
			</div>
		{:else if !compact && comparison}
			<p class="comparison">{comparison}</p>
		{/if}

		{#if note}<p class="note">{note}</p>{/if}

		{#if series && series.length > 2 && format}
			<Sparkline
				{series}
				label={label}
				{format}
				{delta}
				height={compact ? 28 : 46}
				{compact}
			/>
		{/if}
	</div>
{/if}

<style>
	.fact {
		display: flex;
		flex-direction: column;
		gap: 0.14rem;
		min-width: 0;
		padding-top: 0.45rem;
		border-top: 1px solid var(--line);
	}
	.fact-label {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.fact-value {
		font-size: 0.95rem;
		font-weight: 500;
		line-height: 1.35;
		color: var(--text-1);
		overflow-wrap: anywhere;
	}
	.fact-value em {
		margin-left: 0.3rem;
		font-style: normal;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
	}
	.metric {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 0.7rem 0.75rem 0.65rem;
		background: var(--surface-1);
		border: 1px solid var(--line);
		border-radius: 0.2rem;
	}
	.metric.compact {
		padding: 0.52rem 0.58rem 0.5rem;
	}
	.metric-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.metric-label {
		min-width: 0;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		line-height: 1.3;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.metric.compact .metric-label {
		font-size: 0.68rem;
		letter-spacing: 0.04em;
	}
	.metric-year {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
	}
	.metric-value {
		margin-top: 0.2rem;
		font-family: var(--font-display);
		font-size: 1.38rem;
		font-weight: 600;
		line-height: 1.05;
		color: var(--text-1);
		font-variant-numeric: tabular-nums;
	}
	.metric.compact .metric-value {
		font-size: 1.16rem;
		margin-top: 0.14rem;
	}
	.meter {
		height: 3px;
		margin-top: 0.42rem;
		background: var(--line);
		overflow: hidden;
	}
	.meter span {
		display: block;
		height: 100%;
		opacity: 0.8;
		transition: width 0.7s var(--ease-out-soft);
	}
	.metric-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.2rem 0.5rem;
		margin-top: 0.24rem;
		font-size: 0.68rem;
		color: var(--text-4);
	}
	.pct {
		font-family: var(--font-mono);
		letter-spacing: 0.03em;
		white-space: nowrap;
	}
	.comparison {
		margin: 0.26rem 0 0;
		font-size: 0.72rem;
		line-height: 1.4;
		color: var(--text-4);
	}
	.metric-meta .comparison {
		margin: 0;
		flex: 1;
		text-align: right;
	}
	.note {
		margin: 0.3rem 0 0;
		font-size: 0.72rem;
		line-height: 1.4;
		color: var(--text-4);
	}
	.fact.compact {
		padding-top: 0.35rem;
	}
	.fact.compact .fact-value {
		font-size: 0.9rem;
	}
</style>
