<script lang="ts">
	import Icon from './Icon.svelte';
	import { theme, type ThemePref } from '#lib/theme.svelte';

	interface Props {
		compact?: boolean;
	}
	let { compact = false }: Props = $props();

	const options: { id: ThemePref; label: string; icon: string }[] = [
		{ id: 'system', label: 'Tema do sistema', icon: 'system' },
		{ id: 'light', label: 'Tema claro', icon: 'sun' },
		{ id: 'dark', label: 'Tema escuro', icon: 'moon' }
	];

	const current = $derived(options.find((o) => o.id === theme.pref) ?? options[0]);
</script>

{#if compact}
	<button
		type="button"
		class="cycle"
		onclick={() => theme.cycle()}
		title={`${current.label} — clique para alternar`}
		aria-label={`${current.label}. Alternar tema`}
	>
		<Icon name={current.icon} size={16} />
	</button>
{:else}
	<div class="toggle" role="group" aria-label="Tema da interface">
		{#each options as option (option.id)}
			<button
				type="button"
				class:active={theme.pref === option.id}
				onclick={() => theme.set(option.id)}
				title={option.label}
				aria-label={option.label}
				aria-pressed={theme.pref === option.id}
			>
				<Icon name={option.icon} size={13} />
			</button>
		{/each}
	</div>
{/if}

<style>
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 1px;
		padding: 2px;
		border: 1px solid var(--line);
		border-radius: 0.15rem;
		background: var(--surface-1);
	}
	.toggle button {
		display: grid;
		place-items: center;
		width: 1.65rem;
		height: 1.55rem;
		border: 0;
		background: transparent;
		color: var(--text-4);
		border-radius: 0.08rem;
		transition: color 0.16s ease, background 0.16s ease;
	}
	.toggle button:hover {
		color: var(--text-1);
		background: var(--surface-3);
	}
	.toggle button.active {
		color: var(--accent-0);
		background: color-mix(in oklab, var(--accent-1) 18%, var(--surface-2));
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--accent-1) 45%, transparent);
	}
	.cycle {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--line);
		background: var(--surface-1);
		color: var(--text-2);
		border-radius: 0.15rem;
	}
	.cycle:hover {
		color: var(--text-1);
		border-color: var(--line-strong);
	}
</style>
