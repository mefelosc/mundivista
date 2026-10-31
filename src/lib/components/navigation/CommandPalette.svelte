<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import { searchCountries } from '#lib/data/countries';
	import { mapLayers } from '#lib/configurations/map-layers';
	import { games } from '#lib/engines/game-engine/registry';
	import type { LayerId } from '#lib/types';

	interface Props {
		open?: boolean;
		onclose?: () => void;
		oncountry?: (code: string) => void;
		onlayer?: (id: LayerId) => void;
	}
	let { open = $bindable(false), onclose, oncountry, onlayer }: Props = $props();

	type Item =
		| { kind: 'country'; id: string; label: string; sub: string; flag?: string; action: () => void }
		| { kind: 'layer'; id: string; label: string; sub: string; icon: string; action: () => void }
		| { kind: 'game'; id: string; label: string; sub: string; icon: string; action: () => void }
		| { kind: 'nav'; id: string; label: string; sub: string; icon: string; action: () => void };

	let query = $state('');
	let active = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	const items = $derived.by(() => {
		const q = query.trim();
		const out: Item[] = [];

		if (!q) {
			out.push({
				kind: 'nav',
				id: 'explore',
				label: 'Explorar o mapa',
				sub: 'Atlas interativo',
				icon: 'globe',
				action: () => (location.href = '/explore')
			});
			out.push({
				kind: 'nav',
				id: 'play',
				label: 'Jogar',
				sub: `${games.length} jogos com dados reais`,
				icon: 'gamepad',
				action: () => (location.href = '/play')
			});
			out.push({
				kind: 'nav',
				id: 'about',
				label: 'Fontes e métodos',
				sub: 'Licenças, cobertura e limitações',
				icon: 'info',
				action: () => (location.href = '/sobre')
			});
		}

		for (const country of searchCountries(q, 6)) {
			out.push({
				kind: 'country',
				id: country.code,
				label: country.name,
				sub: [country.continent, country.subregion].filter(Boolean).join(' · '),
				flag: country.iso2,
				action: () => oncountry?.(country.code)
			});
		}

		const normalized = q
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
		for (const layer of mapLayers) {
			const text = `${layer.label} ${layer.short} ${layer.description}`
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase();
			if (q && !text.includes(normalized)) continue;
			out.push({
				kind: 'layer',
				id: layer.id,
				label: `Camada ${layer.label}`,
				sub: layer.description,
				icon: layer.icon,
				action: () => onlayer?.(layer.id)
			});
		}

		for (const game of games) {
			const text = `${game.title} ${game.tagline} ${game.category}`
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase();
			if (q && !text.includes(normalized)) continue;
			out.push({
				kind: 'game',
				id: game.slug,
				label: game.title,
				sub: `${game.category} · ${game.minutes} min`,
				icon: game.icon,
				action: () => (location.href = `/game/${game.slug}`)
			});
		}

		return out.slice(0, 14);
	});

	$effect(() => {
		active = 0;
		void query;
	});

	$effect(() => {
		if (open) {
			query = '';
			active = 0;
			setTimeout(() => inputEl?.focus(), 20);
		}
	});

	function close() {
		open = false;
		onclose?.();
	}

	function run(item: Item) {
		item.action();
		close();
	}

	function onKeydown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			active = Math.min(items.length - 1, active + 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			active = Math.max(0, active - 1);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const item = items[active];
			if (item) run(item);
		}
	}

</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="backdrop" role="presentation" onclick={close}></div>
	<div class="palette" role="dialog" aria-modal="true" aria-label="Busca rápida">
		<div class="input-row">
			<Icon name="search" size={16} />
			<input
				bind:this={inputEl}
				bind:value={query}
				type="text"
				placeholder="País, camada ou jogo…"
				autocomplete="off"
				spellcheck="false"
				aria-label="Buscar país, camada ou jogo"
			/>
			<kbd>esc</kbd>
		</div>
		<div class="results" role="listbox" aria-label="Resultados">
			{#if !items.length}
				<p class="empty">Nada encontrado para “{query}”.</p>
			{/if}
			{#each items as item, i (item.kind + item.id)}
				<button
					type="button"
					role="option"
					aria-selected={i === active}
					class:active={i === active}
					onmouseenter={() => (active = i)}
					onclick={() => run(item)}
				>
					{#if item.kind === 'country'}
						{#if item.flag}<span class={`fi fi-${item.flag} flag`}></span>{:else}<span class="flag mono">{item.id}</span>{/if}
					{:else}
						<span class="glyph"><Icon name={item.icon} size={15} /></span>
					{/if}
					<span class="text">
						<strong>{item.label}</strong>
						<small>{item.sub}</small>
					</span>
					<span class="kind">{item.kind === 'country' ? 'país' : item.kind === 'layer' ? 'camada' : item.kind === 'game' ? 'jogo' : 'ir'}</span>
				</button>
			{/each}
		</div>
		<footer>
			<span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
			<span><kbd>enter</kbd> abrir</span>
			<span><kbd>⌘K</kbd> alternar</span>
		</footer>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 70;
		background: color-mix(in oklab, var(--surface-0) 58%, transparent);
	}
	.palette {
		position: fixed;
		top: calc(var(--header-h) + 0.9rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 71;
		width: min(34rem, calc(100vw - 1.4rem));
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		box-shadow: 0 34px 70px -30px rgb(0 0 0 / 0.55);
		animation: fade-up 0.2s var(--ease-out-soft) both;
	}
	.input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 0.7rem;
		border-bottom: 1px solid var(--line);
		color: var(--text-3);
	}
	input {
		flex: 1;
		min-width: 0;
		border: 0;
		outline: none;
		background: transparent;
		color: var(--text-1);
		font-size: 0.86rem;
	}
	input::placeholder {
		color: var(--text-4);
	}
	kbd {
		font-family: var(--font-mono);
		font-size: 0.52rem;
		color: var(--text-4);
		border: 1px solid var(--line);
		padding: 0.1rem 0.25rem;
	}
	.results {
		max-height: min(24rem, 55dvh);
		overflow-y: auto;
		padding: 0.25rem;
	}
	.results button {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		border: 0;
		background: transparent;
		color: var(--text-2);
		padding: 0.42rem 0.5rem;
		text-align: left;
		border-left: 2px solid transparent;
	}
	.results button.active {
		background: var(--surface-3);
		border-left-color: var(--accent-1);
		color: var(--text-1);
	}
	.flag {
		width: 1.35rem;
		height: 0.95rem;
		background-size: cover;
		border: 1px solid var(--line);
		flex-shrink: 0;
	}
	.flag.mono {
		display: grid;
		place-items: center;
		font-family: var(--font-mono);
		font-size: 0.45rem;
	}
	.glyph {
		display: grid;
		place-items: center;
		width: 1.35rem;
		height: 1.35rem;
		color: var(--text-4);
		flex-shrink: 0;
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 0.08rem;
		min-width: 0;
		flex: 1;
	}
	.text strong {
		font-size: 0.74rem;
		font-weight: 550;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.text small {
		font-size: 0.56rem;
		color: var(--text-4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.kind {
		font-family: var(--font-mono);
		font-size: 0.44rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.empty {
		margin: 0;
		padding: 1rem;
		font-size: 0.7rem;
		color: var(--text-4);
	}
	footer {
		display: flex;
		gap: 0.9rem;
		padding: 0.4rem 0.7rem;
		border-top: 1px solid var(--line);
		font-size: 0.5rem;
		color: var(--text-4);
	}
	footer span {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
	}
</style>
