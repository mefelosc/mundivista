<script lang="ts">
	interface Props {
		label: string;
		value: string;
		year?: number | null;
		note?: string | null;
		percentile?: number | null;
		accent?: string;
	}
	let { label, value, year, note, percentile = null, accent = 'var(--color-gold-400)' }: Props =
		$props();
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
	{/if}
	{#if note}<p class="note">{note}</p>{/if}
</div>

<style>
	.stat {
		padding: 0.42rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.045);
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
		font-size: 0.7rem;
		color: var(--color-mist-400);
		line-height: 1.3;
	}
	.value {
		font-family: var(--font-mono);
		font-size: 0.73rem;
		color: var(--color-mist-100);
		text-align: right;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.value em {
		font-style: normal;
		font-size: 0.55rem;
		color: var(--color-mist-500);
		margin-left: 0.25rem;
	}
	.bar {
		margin-top: 0.3rem;
		height: 2px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 999px;
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		border-radius: 999px;
		opacity: 0.7;
	}
	.note {
		margin: 0.3rem 0 0;
		font-size: 0.6rem;
		line-height: 1.4;
		color: var(--color-mist-500);
	}
</style>
