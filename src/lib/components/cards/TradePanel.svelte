<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import { formatCompact } from '#lib/format';
	import { tradeFor, tradeSource } from '#lib/data/trade';
	import { locale } from '#lib/locale.svelte';
	import { localizeTradeTerm } from '#lib/i18n-data-en';
	import type { Country } from '#lib/types';

	interface Props {
		country: Country;
	}
	let { country }: Props = $props();
	const isEn = $derived(locale.value === 'en');
	const tr = (pt: string, en: string) => (isEn ? en : pt);
	const countryName = $derived(isEn ? country.nameEn : country.name);

	const profile = $derived(tradeFor(country.code));
	const exportsShare = $derived(country.indicators.exportsShare);
	const importsShare = $derived(country.indicators.importsShare);
	const gdp = $derived(country.indicators.gdp);

	const values = $derived.by(() => {
		const exp = exportsShare && gdp ? (gdp.v * exportsShare.v) / 100 : null;
		const imp = importsShare && gdp ? (gdp.v * importsShare.v) / 100 : null;
		const max = Math.max(exp ?? 0, imp ?? 0) || 1;
		return {
			exports: exp,
			imports: imp,
			balance: exp !== null && imp !== null ? exp - imp : null,
			max,
			exportsWidth: exp !== null ? (exp / max) * 100 : 0,
			importsWidth: imp !== null ? (imp / max) * 100 : 0
		};
	});

	function money(value: number | null): string {
		if (value === null) return '—';
		return `US$ ${formatCompact(value)}`;
	}

	function pct(value: number | null): string {
		if (value === null) return '—';
		return `${value.toLocaleString(isEn ? 'en-US' : 'pt-BR', { maximumFractionDigits: 1 })}%`;
	}

	const oecUrl = $derived(
		`https://oec.world/en/profile/country/${(country.iso3 ?? country.code).toLowerCase()}`
	);
</script>

<section class="trade" aria-label={isEn ? `Foreign trade of ${countryName}` : `Comércio exterior de ${countryName}`}>
	<header class="panel-head">
		<div>
			<span class="eyebrow">Fluxos</span>
			<h3>Comércio exterior</h3>
		</div>
		<span class="year">{exportsShare?.y ?? importsShare?.y ?? '—'}</span>
	</header>

	{#if exportsShare || importsShare}
		<div class="trade-stats">
			<div class="stat exports">
				<span class="stat-label"><Icon name="arrowUpRight" size={14} /> {tr('Exportações', 'Exports')}</span>
				<strong>{pct(exportsShare?.v ?? null)}</strong>
				<span class="stat-value">{money(values.exports)}</span>
				<span class="stat-note">{tr('do PIB · valor estimado', 'of GDP · estimated value')}</span>
			</div>
			<div class="stat imports">
				<span class="stat-label"><Icon name="arrowRight" size={14} /> {tr('Importações', 'Imports')}</span>
				<strong>{pct(importsShare?.v ?? null)}</strong>
				<span class="stat-value">{money(values.imports)}</span>
				<span class="stat-note">{tr('do PIB · valor estimado', 'of GDP · estimated value')}</span>
			</div>
		</div>

		<div class="balance">
			<div class="balance-head">
				<span>{tr('Balança comercial', 'Trade balance')}</span>
				<strong class:negative={(values.balance ?? 0) < 0}>
					{values.balance === null
						? '—'
						: `${values.balance >= 0 ? '+' : '−'}US$ ${formatCompact(Math.abs(values.balance))}`}
				</strong>
			</div>
			<div class="bars">
				<div class="bar-line">
					<span class="bar exports" style:width={`${values.exportsWidth}%`}></span>
					<em>{tr('exportações', 'exports')}</em>
				</div>
				<div class="bar-line">
					<span class="bar imports" style:width={`${values.importsWidth}%`}></span>
					<em>{tr('importações', 'imports')}</em>
				</div>
			</div>
		</div>

		{#if profile}
			<div class="profile-grid">
				<div class="profile-block">
					<h4><Icon name="layers" size={14} /> {tr('Principais exportações', 'Main exports')}</h4>
					<ul>
						{#each profile.exports as item (item)}
							<li>{localizeTradeTerm(item, locale.value)}</li>
						{/each}
					</ul>
					<p class="partners">
						<Icon name="pin" size={12} />
						{profile.exportPartners.map((item) => localizeTradeTerm(item, locale.value)).join(' · ')}
					</p>
				</div>
				<div class="profile-block">
					<h4><Icon name="layers" size={14} /> {tr('Principais importações', 'Main imports')}</h4>
					<ul>
						{#each profile.imports as item (item)}
							<li>{localizeTradeTerm(item, locale.value)}</li>
						{/each}
					</ul>
					<p class="partners">
						<Icon name="pin" size={12} />
						{profile.importPartners.map((item) => localizeTradeTerm(item, locale.value)).join(' · ')}
					</p>
				</div>
			</div>
			<p class="source-note">
				{tr('Produtos e parceiros: recorte curado', 'Products and partners: curated snapshot')} {profile.year} ·
				<a href={oecUrl} target="_blank" rel="noopener noreferrer">
					OEC <Icon name="external" size={10} />
				</a>
				· {tradeSource.name}
			</p>
		{:else}
			<div class="empty">
				<Icon name="globe" size={20} />
				<p>{tr(`Produtos e parceiros ainda não têm recorte curado para ${countryName}.`, `Products and partners do not yet have a curated snapshot for ${countryName}.`)}</p>
				<a href={oecUrl} target="_blank" rel="noopener noreferrer">
					Ver comércio no OEC <Icon name="external" size={11} />
				</a>
			</div>
			<p class="source-note">{tr('Percentuais do World Bank', 'World Bank percentages')} · {tradeSource.note}</p>
		{/if}
	{:else}
		<div class="empty">
			<Icon name="wave" size={20} />
			<p>{tr('Sem dados de comércio exterior para este território.', 'No foreign trade data for this territory.')}</p>
		</div>
	{/if}
</section>

<style>
	.trade {
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
	.year {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-4);
	}
	.trade-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin-top: 0.7rem;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.12rem;
		padding: 0.7rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}
	.stat-label {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-4);
	}
	.stat.exports .stat-label {
		color: var(--positive);
	}
	.stat.imports .stat-label {
		color: var(--accent-2);
	}
	.stat strong {
		font-family: var(--font-display);
		font-size: 1.65rem;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.04em;
		font-variant-numeric: tabular-nums;
	}
	.stat-value {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--text-2);
	}
	.stat-note {
		font-size: 0.68rem;
		color: var(--text-4);
	}
	.balance {
		margin-top: 0.65rem;
	}
	.balance-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.78rem;
		color: var(--text-3);
	}
	.balance-head strong {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--positive);
	}
	.balance-head strong.negative {
		color: var(--negative);
	}
	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.35rem;
	}
	.bar-line {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.bar-line em {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		font-style: normal;
		color: var(--text-4);
	}
	.bar {
		display: block;
		height: 8px;
		border-radius: 999px;
	}
	.bar.exports {
		background: var(--positive);
	}
	.bar.imports {
		background: var(--accent-2);
	}
	.profile-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
		margin-top: 0.75rem;
	}
	.profile-block {
		padding: 0.65rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}
	.profile-block h4 {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		margin: 0 0 0.35rem;
		font-size: 0.78rem;
		font-weight: 650;
		color: var(--text-2);
	}
	.profile-block ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.22rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.profile-block li {
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.2rem 0.45rem;
		font-size: 0.7rem;
		color: var(--text-3);
		background: var(--surface-1);
	}
	.partners {
		display: flex;
		align-items: flex-start;
		gap: 0.25rem;
		margin: 0.4rem 0 0;
		font-size: 0.68rem;
		line-height: 1.4;
		color: var(--text-4);
	}
	.source-note {
		margin: 0.55rem 0 0;
		font-size: 0.68rem;
		line-height: 1.45;
		color: var(--text-4);
	}
	.source-note a {
		color: var(--text-3);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.35rem;
		padding: 0.9rem 0 0.2rem;
		color: var(--text-3);
	}
	.empty p {
		margin: 0;
		font-size: 0.84rem;
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
	@media (max-width: 620px) {
		.trade-stats,
		.profile-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
