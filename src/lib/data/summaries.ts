import type { Country, IndicatorKey } from '#lib/types';
import type { Locale } from '#lib/i18n';
import { formatArea, formatIndicatorValue, formatRank } from '#lib/format';
import { getCountry, rankOf } from './countries';
import { disputedInfo } from './disputed';
import { getHistorical } from './historical';
import { organizationsForCountry } from './organizations';
import { capitalInPortuguese } from './capitals-pt';
import { localizeContinent, localizeDependency } from '#lib/i18n-data';
import { localizedDisputed, localizedHistorical, localizedOrganization } from '#lib/i18n-data-en';

type Metric = { text: string; value: number; year: number };

function metric(country: Country, key: IndicatorKey): Metric | null {
	const value = country.indicators[key];
	if (!value) return null;
	return {
		text: formatIndicatorValue(key, value),
		value: value.v,
		year: value.y
	};
}

function join(parts: (string | null | undefined | false)[]): string {
	return parts.filter(Boolean).join(' ');
}

function noData(locale: Locale, theme: 'demography' | 'economy' | 'geography' | 'governance'): string {
	const pt = {
		demography: 'Sem dados demográficos disponíveis para este território.',
		economy: 'Sem dados econômicos disponíveis para este território.',
		geography: 'Sem dados geográficos disponíveis para este território.',
		governance: 'Sem dados de governança disponíveis para este território.'
	};
	const en = {
		demography: 'No demographic data available for this territory.',
		economy: 'No economic data available for this territory.',
		geography: 'No geographic data available for this territory.',
		governance: 'No governance data available for this territory.'
	};
	return locale === 'en' ? en[theme] : pt[theme];
}

const DEPENDENCY_LIKE = new Set<string | null>(['Dependency', 'Country']);

function safeDependency(country: Country, locale: Locale): string | null {
	if (!DEPENDENCY_LIKE.has(country.status)) return null;
	return localizeDependency(country, locale);
}

function capitalName(country: Country, locale: Locale): string | null {
	if (!country.capital) return null;
	return locale === 'pt' ? (capitalInPortuguese(country.code, country.capital) ?? country.capital) : country.capital;
}

function neighborName(code: string, locale: Locale): string {
	const neighbor = getCountry(code);
	if (neighbor) return localizedName(neighbor, locale);
	const fallbacks: Record<string, { pt: string; en: string }> = {
		GUF: { pt: 'Guiana Francesa', en: 'French Guiana' },
		GIB: { pt: 'Gibraltar', en: 'Gibraltar' }
	};
	const fallback = fallbacks[code];
	if (fallback) return locale === 'en' ? fallback.en : fallback.pt;
	return code;
}

function localizedName(country: Country, locale: Locale): string {
	return locale === 'en' ? country.nameEn : country.name;
}

function locationSentence(country: Country, locale: Locale): string {
	const name = localizedName(country, locale);
	const continent = localizeContinent(country.continent, locale);
	if (!continent) {
		return locale === 'en'
			? `${name} has no continental classification.`
			: `${name} não tem classificação continental.`;
	}
	const place = locale === 'en' ? `is in ${continent}` : `está na ${continent}`;
	return `${name} ${place}.`;
}

/** Resumo geral do país, montado apenas com dados observados no dossiê. */
export function countrySummary(country: Country, locale: Locale): string {
	const en = locale === 'en';
	const parts: (string | null)[] = [locationSentence(country, locale)];

	if (country.areaKm2 && country.areaKm2 >= 1) {
		parts.push(en ? `The territory covers ${formatArea(country.areaKm2)}.` : `O território cobre ${formatArea(country.areaKm2)}.`);
	}

	const population = metric(country, 'population');
	if (population) {
		const rank = rankOf(country.code, 'population');
		parts.push(
			en
				? `The population is ${population.text} (${population.year})${rank ? `, ${formatRank(rank)} worldwide` : ''}.`
				: `A população é de ${population.text} habitantes (${population.year})${rank ? `, ${formatRank(rank)} no mundo` : ''}.`
		);
	}
	const capital = capitalName(country, locale);
	if (capital) {
		parts.push(en ? `The capital is ${capital}.` : `A capital é ${capital}.`);
	}

	const gdpPerCapita = metric(country, 'gdpPerCapita');
	const life = metric(country, 'lifeExpectancy');
	if (gdpPerCapita || life) {
		parts.push(
			join([
				gdpPerCapita &&
					(en
						? `GDP per capita is ${gdpPerCapita.text} (${gdpPerCapita.year}).`
						: `O PIB per capita é de ${gdpPerCapita.text} (${gdpPerCapita.year}).`),
				life &&
					(en
						? `Life expectancy at birth is ${life.text} years (${life.year}).`
						: `A expectativa de vida ao nascer é de ${life.text} anos (${life.year}).`)
			])
		);
	}

	const dependency = safeDependency(country, locale);
	if (dependency) parts.push(`${dependency}.`);
	const disputed = localizedDisputed(disputedInfo(country.code), locale);
	if (disputed) parts.push(en ? `Status: ${disputed.label}.` : `Situação: ${disputed.label}.`);

	return join(parts);
}

export function demographySummary(country: Country, locale: Locale): string {
	const en = locale === 'en';
	const population = metric(country, 'population');
	const density = metric(country, 'popDensity');
	const growth = metric(country, 'popGrowth');
	const urban = metric(country, 'urbanShare');
	const life = metric(country, 'lifeExpectancy');
	const fertility = metric(country, 'fertility');
	const school = metric(country, 'schoolEnrollment');
	if (!population && !density && !growth && !urban && !life && !fertility && !school) {
		return noData(locale, 'demography');
	}
	const parts: (string | null)[] = [];
	if (population) {
		const rank = rankOf(country.code, 'population');
		parts.push(
			en
				? `The population is ${population.text} (${population.year})${rank ? `, ${formatRank(rank)} worldwide` : ''}.`
				: `A população é de ${population.text} habitantes (${population.year})${rank ? `, ${formatRank(rank)} no mundo` : ''}.`
		);
	}
	if (density) {
		parts.push(en ? `Density is ${density.text} inhabitants per km².` : `A densidade é de ${density.text} habitantes por km².`);
	}
	if (growth || urban) {
		parts.push(
			join([
				growth && (en ? `Annual growth is ${growth.text}%.` : `O crescimento anual é de ${growth.text}%.`),
				urban && (en ? `${urban.text}% of the population lives in urban areas.` : `${urban.text}% da população vive em áreas urbanas.`)
			])
		);
	}
	if (life || fertility) {
		parts.push(
			join([
				life && (en ? `Life expectancy is ${life.text} years.` : `A expectativa de vida é de ${life.text} anos.`),
				fertility && (en ? `Fertility is ${fertility.text} children per woman.` : `A fecundidade é de ${fertility.text} filhos por mulher.`)
			])
		);
	}
	if (school) {
		parts.push(
			en
				? `Secondary school enrolment reaches ${school.text}% of the age group.`
				: `A matrícula no ensino médio alcança ${school.text}% do grupo etário.`
		);
	}
	return join(parts);
}

export function economySummary(country: Country, locale: Locale): string {
	const en = locale === 'en';
	const gdp = metric(country, 'gdp');
	const gdpPerCapita = metric(country, 'gdpPerCapita');
	const growth = metric(country, 'gdpGrowth');
	const unemployment = metric(country, 'unemployment');
	const inflation = metric(country, 'inflation');
	const exportsShare = metric(country, 'exportsShare');
	const importsShare = metric(country, 'importsShare');
	const industry = metric(country, 'industryShare');
	const agriculture = metric(country, 'agriShare');
	const gini = metric(country, 'gini');
	if (!gdp && !gdpPerCapita && !growth && !unemployment && !inflation && !exportsShare && !importsShare && !industry && !agriculture && !gini) {
		return noData(locale, 'economy');
	}
	const parts: (string | null)[] = [];
	if (gdp || gdpPerCapita) {
		parts.push(
			join([
				gdp && (en ? `Nominal GDP is ${gdp.text} (${gdp.year}).` : `O PIB nominal é de ${gdp.text} (${gdp.year}).`),
				gdpPerCapita && (en ? `GDP per capita is ${gdpPerCapita.text} (${gdpPerCapita.year}).` : `O PIB per capita é de ${gdpPerCapita.text} (${gdpPerCapita.year}).`)
			])
		);
	}
	if (growth || unemployment || inflation) {
		parts.push(
			join([
				growth && (en ? `The economy grew ${growth.text}%.` : `A economia cresceu ${growth.text}%.`),
				unemployment && (en ? `Unemployment is ${unemployment.text}%.` : `O desemprego está em ${unemployment.text}%.`),
				inflation && (en ? `Inflation is ${inflation.text}% per year.` : `A inflação é de ${inflation.text}% ao ano.`)
			])
		);
	}
	if (exportsShare || importsShare) {
		parts.push(
			join([
				exportsShare && (en ? `Exports account for ${exportsShare.text}% of GDP.` : `As exportações representam ${exportsShare.text}% do PIB.`),
				importsShare && (en ? `Imports account for ${importsShare.text}% of GDP.` : `As importações representam ${importsShare.text}% do PIB.`)
			])
		);
	}
	if (industry || agriculture) {
		parts.push(
			join([
				industry && (en ? `Industry adds ${industry.text}% of value added.` : `A indústria responde por ${industry.text}% do valor adicionado.`),
				agriculture && (en ? `Agriculture adds ${agriculture.text}%.` : `A agricultura responde por ${agriculture.text}%.`)
			])
		);
	}
	if (gini) {
		parts.push(en ? `The Gini index is ${gini.text} (${gini.year}).` : `O índice de Gini é ${gini.text} (${gini.year}).`);
	}
	return join(parts);
}

export function geographySummary(country: Country, locale: Locale): string {
	const en = locale === 'en';
	const forest = metric(country, 'forestShare');
	const renewable = metric(country, 'renewableShare');
	const co2 = metric(country, 'co2PerCapita');
	const electricity = metric(country, 'electricityAccess');
	const internet = metric(country, 'internetShare');
	const parts: (string | null)[] = [];
	if (country.areaKm2 && country.areaKm2 >= 1) {
		parts.push(en ? `The territory covers ${formatArea(country.areaKm2)}.` : `O território cobre ${formatArea(country.areaKm2)}.`);
	}
	if (country.borders.length) {
		const names = country.borders.slice(0, 6).map((code) => neighborName(code, locale));
		parts.push(
			en
				? `It borders ${country.borders.length} ${country.borders.length === 1 ? 'country' : 'countries'}: ${names.join(', ')}${country.borders.length > 6 ? ' and others' : ''}.`
				: `Faz fronteira com ${country.borders.length} ${country.borders.length === 1 ? 'país' : 'países'}: ${names.join(', ')}${country.borders.length > 6 ? ' e outros' : ''}.`
		);
	} else {
		parts.push(en ? 'It has no land borders.' : 'Não tem fronteiras terrestres.');
	}
	if (country.landlocked === true) parts.push(en ? 'The country is landlocked.' : 'O país não tem litoral.');
	if (forest || renewable) {
		parts.push(
			join([
				forest && (en ? `Forest covers ${forest.text}% of the territory.` : `A cobertura florestal é de ${forest.text}% do território.`),
				renewable && (en ? `Renewables supply ${renewable.text}% of final energy consumption.` : `As renováveis respondem por ${renewable.text}% do consumo final de energia.`)
			])
		);
	}
	if (co2) {
		parts.push(en ? `Per-capita emissions are ${co2.text} t of CO₂.` : `As emissões per capita são de ${co2.text} t de CO₂.`);
	}
	if (electricity || internet) {
		parts.push(
			join([
				electricity && (en ? `Electricity reaches ${electricity.text}% of the population.` : `A eletricidade alcança ${electricity.text}% da população.`),
				internet && (en ? `${internet.text}% of people use the internet.` : `${internet.text}% das pessoas usam a internet.`)
			])
		);
	}
	if (!parts.length) return noData(locale, 'geography');
	return join(parts);
}

export function geopoliticsSummary(country: Country, locale: Locale): string {
	const en = locale === 'en';
	const military = metric(country, 'militaryShare');
	const effectiveness = metric(country, 'govEffectiveness');
	const corruption = metric(country, 'controlCorruption');
	const ruleOfLaw = metric(country, 'ruleOfLaw');
	const orgs = organizationsForCountry(country.code)
		.filter((org) => org.era === 'current')
		.map((org) => localizedOrganization(org, locale));
	const parts: (string | null)[] = [];
	if (military) {
		parts.push(en ? `Military spending is ${military.text}% of GDP.` : `O gasto militar é de ${military.text}% do PIB.`);
	}
	if (effectiveness || corruption || ruleOfLaw) {
		const scores = [
			effectiveness &&
				(en
					? `government effectiveness ${effectiveness.text}`
					: `efetividade do governo ${effectiveness.text}`),
			corruption &&
				(en ? `control of corruption ${corruption.text}` : `controle da corrupção ${corruption.text}`),
			ruleOfLaw && (en ? `rule of law ${ruleOfLaw.text}` : `Estado de direito ${ruleOfLaw.text}`)
		].filter(Boolean);
		parts.push(
			en
				? `World Bank governance scores (scale −2.5 to 2.5): ${scores.join('; ')}.`
				: `Escores de governança do Banco Mundial (escala −2,5 a 2,5): ${scores.join('; ')}.`
		);
	}
	if (orgs.length) {
		const names = orgs.slice(0, 5).map((org) => org.short);
		parts.push(
			en ? `It takes part in ${names.join(', ')}.` : `Participa de ${names.join(', ')}.`
		);
	}
	const dependency = safeDependency(country, locale);
	if (dependency) parts.push(`${dependency}.`);
	const disputed = localizedDisputed(disputedInfo(country.code), locale);
	if (disputed) parts.push(en ? `Status: ${disputed.label}.` : `Situação: ${disputed.label}.`);
	if (!parts.length) return noData(locale, 'governance');
	return join(parts);
}

export function historySummary(country: Country, locale: Locale): string {
	const en = locale === 'en';
	const historical = localizedHistorical(getHistorical(country.code), locale);
	if (!historical) {
		return en
			? 'No curated historical record is available for this country.'
			: 'Sem registro histórico curado para este país.';
	}
	const parts: (string | null)[] = [];
	if (historical.independence) {
		parts.push(
			historical.independenceFrom
				? en
					? `Independence or state formation is dated to ${historical.independence}, from ${historical.independenceFrom}.`
					: `A independência ou formação do Estado é datada em ${historical.independence}, de ${historical.independenceFrom}.`
				: en
					? `Independence or state formation is dated to ${historical.independence}.`
					: `A independência ou formação do Estado é datada em ${historical.independence}.`
		);
	}
	if (historical.formerNames?.length) {
		const names = historical.formerNames
			.slice(0, 4)
			.map((former) => `${former.name}${former.to ? ` (${en ? 'until' : 'até'} ${former.to})` : ''}`);
		parts.push(en ? `Former names: ${names.join(', ')}.` : `Nomes anteriores: ${names.join(', ')}.`);
	}
	if (historical.note) parts.push(historical.note);
	const historicalOrgs = organizationsForCountry(country.code)
		.filter((org) => org.era === 'historical')
		.map((org) => localizedOrganization(org, locale));
	if (historicalOrgs.length) {
		const names = historicalOrgs
			.slice(0, 3)
			.map((org) => `${org.short} (${org.founded}–${org.dissolved ?? (en ? 'present' : 'hoje')})`);
		parts.push(
			en ? `Historical organisations: ${names.join(', ')}.` : `Organizações históricas: ${names.join(', ')}.`
		);
	}
	return join(parts);
}
