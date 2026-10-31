<script lang="ts">
	interface Props {
		label: string;
		value: string;
		year?: number | null;
		note?: string | null;
		percentile?: number | null;
		comparison?: string | null;
		accent?: string;
	}
	let {
		label,
		value,
		year,
		note,
		percentile = null,
		comparison = null,
		accent = 'var(--accent-1)'
	}: Props = $props();
</script>

<div class="stat">
	<div class="line">
		<span class="label">{label}</span>
		<span class="value">
			{value}
			{#if year}<em>{year}</em>{/if}
		</span>
	</div>
	{#if percentile !== null}
		<div class="bar" aria-hidden="true">
			<span style:width={`${Math.max(2, Math.min(100, percentile * 100))}%`} style:background={accent}></span>
		</div>
		<div class="meta">
			{#if comparison}<span>{comparison}</span>{/if}
			<span class="pct">percentil {Math.round(percentile * 100)}</span>
		</div>
	{:else if comparison}
		<div class="meta"><span>{comparison}</span></div>
	{/if}
	{#if note}<p class="note">{note}</p>{/if}
</div>

<style>
	.stat {
		padding: 0.45rem 0.3rem;
		margin: 0 -0.3rem;
		border-bottom: 1px solid var(--line);
		transition: background 0.16s ease;
	}
	.stat:hover {
		background: color-mix(in oklab, var(--accent-1) 5%, transparent);
	}
	.stat:last-child {
		border-bottom: 0;
	}
	.line {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.label {
		font-size: 0.69rem;
		color: var(--text-3);
		line-height: 1.3;
	}
	.value {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-1);
		text-align: right;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.value em {
		font-style: normal;
		font-size: 0.52rem;
		color: var(--text-4);
		margin-left: 0.25rem;
	}
	.bar {
		margin-top: 0.26rem;
		height: 2px;
		background: var(--line);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		opacity: 0.75;
		transition: width 0.7s var(--ease-out-soft);
		animation: bar-in 0.7s var(--ease-out-soft) both;
	}
	@keyframes bar-in {
		from {
			opacity: 0;
		}
	}
	.meta {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.2rem;
		font-size: 0.5rem;
		color: var(--text-4);
	}
	.pct {
		font-family: var(--font-mono);
		letter-spacing: 0.03em;
		white-space: nowrap;
	}
	.note {
		margin: 0.28rem 0 0;
		font-size: 0.58rem;
		line-height: 1.4;
		color: var(--text-4);
	}
</style>
