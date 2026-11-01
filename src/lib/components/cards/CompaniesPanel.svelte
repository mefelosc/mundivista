<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import { companiesFor, companiesRetrieved, companiesSource } from '#lib/data/companies';
	import { locale } from '#lib/locale.svelte';
	import { companiesSourceEn, localizeSector } from '#lib/i18n-data-en';
	import type { Country } from '#lib/types';

	interface Props {
		country: Country;
		compact?: boolean;
	}
	let { country, compact = false }: Props = $props();
	const isEn = $derived(locale.value === 'en');
	const tr = (pt: string, en: string) => (isEn ? en : pt);
	const countryName = $derived(isEn ? country.nameEn : country.name);
	const source = $derived(isEn ? companiesSourceEn : companiesSource);

	const companies = $derived(companiesFor(country.code));
	const max = $derived(companies[0]?.marketCap ?? 1);

	const SECTOR_ICONS: Record<string, string> = {
		Semicondutores: 'layers',
		Tecnologia: 'grid',
		Software: 'grid',
		Internet: 'globe',
		Bancos: 'coins',
		Energia: 'wave',
		Mineração: 'peak',
		Automóveis: 'compass',
		Farmacêutica: 'shield',
		Luxo: 'sparkle',
		Telecom: 'globe',
		Alimentos: 'terrain',
		Bebidas: 'terrain',
		Varejo: 'coins',
		Industrial: 'layers',
		Seguros: 'shield',
		Saúde: 'shield',
		Logística: 'river',
		Aviação: 'compass',
		Jogos: 'gamepad',
		Música: 'wave',
		Cosméticos: 'sparkle',
		Petroquímica: 'layers',
		Baterias: 'sparkle',
		'Energia eólica': 'wave',
		Conglomerado: 'alliance',
		Investimentos: 'coins',
		Consultoria: 'book',
		Consumo: 'users',
		'Comércio digital': 'globe',
		'Eletrônicos': 'grid',
		'Comércio e nuvem': 'globe'
	};

	function sectorIcon(sector: string): string {
		return SECTOR_ICONS[sector] ?? 'coins';
	}

	function formatCap(value: number): string {
		if (value >= 1000) {
			return `US$ ${(value / 1000).toLocaleString(isEn ? 'en-US' : 'pt-BR', { maximumFractionDigits: 1 })} ${isEn ? 'T' : 'tri'}`;
		}
		return `US$ ${value.toLocaleString(isEn ? 'en-US' : 'pt-BR', { maximumFractionDigits: 0 })} ${isEn ? 'B' : 'bi'}`;
	}

	function wiki(company: string): string {
		return `https://pt.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(company)}`;
	}
</script>

<section class="companies" aria-label={isEn ? `Largest companies in ${countryName}` : `Maiores empresas de ${countryName}`}>
	<header class="panel-head">
		<div>
			<span class="eyebrow">{tr('Mercado', 'Market')}</span>
			<h3>{tr('Maiores empresas', 'Largest companies')}</h3>
		</div>
		<span class="count">{companies.length ? `${companies.length} ${tr('listadas', 'listed')}` : tr('cobertura em expansão', 'coverage expanding')}</span>
	</header>

	{#if companies.length}
		<ol class="company-list">
			{#each companies as company, index (company.name)}
				<li>
					<a href={wiki(company.name)} target="_blank" rel="noopener noreferrer">
						<span class="rank">{String(index + 1).padStart(2, '0')}</span>
						<span class="sector-icon"><Icon name={sectorIcon(company.sector)} size={16} /></span>
						<span class="company-body">
							<strong>{company.name}</strong>
							<span>{localizeSector(company.sector, locale.value)}</span>
							<span class="cap-bar" aria-hidden="true">
								<span style:width={`${Math.max(4, (company.marketCap / max) * 100)}%`}></span>
							</span>
						</span>
						<span class="cap">{formatCap(company.marketCap)}</span>
					</a>
				</li>
			{/each}
		</ol>
		<p class="source-note">
			{tr('Valores de mercado aproximados', 'Approximate market values')} · {companiesRetrieved} ·
			<a href={source.url} target="_blank" rel="noopener noreferrer">
				{source.name} <Icon name="external" size={10} />
			</a>
		</p>
	{:else}
		<div class="empty">
			<Icon name="coins" size={22} />
			<p>{tr(`Ainda não há uma amostra curada de empresas para ${countryName}.`, `There is no curated company sample for ${countryName} yet.`)}</p>
			<a href={source.url} target="_blank" rel="noopener noreferrer">
				{tr('Consultar o ranking global', 'Open the global ranking')} <Icon name="external" size={11} />
			</a>
		</div>
	{/if}
</section>

<style>
	.companies {
		padding: 1rem 1.05rem 0.95rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface-1);
	}
	.panel-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.6rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid var(--line);
	}
	.panel-head h3 {
		margin: 0.2rem 0 0;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.03em;
	}
	.count {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
		white-space: nowrap;
	}
	.company-list {
		list-style: none;
		margin: 0.4rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.company-list a {
		display: grid;
		grid-template-columns: 1.5rem 2.1rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.55rem;
		padding: 0.5rem 0.3rem;
		border-bottom: 1px solid var(--line);
		color: inherit;
		text-decoration: none;
		transition: background 0.16s ease, padding 0.16s ease;
	}
	.company-list li:last-child a {
		border-bottom: 0;
	}
	.company-list a:hover {
		background: color-mix(in oklab, var(--accent-1) 6%, transparent);
		padding-left: 0.5rem;
	}
	.rank {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--accent-0);
	}
	.sector-icon {
		display: grid;
		place-items: center;
		width: 2.1rem;
		height: 2.1rem;
		border-radius: 0.55rem;
		background: color-mix(in oklab, var(--accent-1) 10%, var(--surface-2));
		color: var(--accent-0);
	}
	.company-body {
		display: flex;
		flex-direction: column;
		gap: 0.12rem;
		min-width: 0;
	}
	.company-body strong {
		font-size: 0.94rem;
		font-weight: 650;
		color: var(--text-1);
	}
	.company-body > span {
		font-size: 0.74rem;
		color: var(--text-4);
	}
	.cap-bar {
		display: block;
		height: 4px;
		margin-top: 0.12rem;
		border-radius: 999px;
		background: var(--line);
		overflow: hidden;
	}
	.cap-bar span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
	}
	.cap {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-2);
		white-space: nowrap;
	}
	.source-note {
		margin: 0.55rem 0 0;
		font-size: 0.7rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	.source-note a {
		color: var(--text-3);
		text-decoration: none;
	}
	.source-note a:hover {
		color: var(--accent-0);
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.4rem;
		padding: 1rem 0 0.2rem;
		color: var(--text-3);
	}
	.empty p {
		margin: 0;
		font-size: 0.86rem;
		line-height: 1.5;
	}
	.empty a {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.78rem;
		color: var(--accent-0);
		text-decoration: none;
	}
</style>
