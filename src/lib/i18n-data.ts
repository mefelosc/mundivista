import type { IndicatorKey } from '#lib/types';
import type { Locale } from './i18n';
import { dependencyLabel, indicatorMeta, sovereignCountry } from './data/countries';

/** Traduções de dados curados. O português permanece a fonte editorial. */

export const continentNames: Record<string, string> = {
	Ásia: 'Asia',
	África: 'Africa',
	Europa: 'Europe',
	'América do Norte': 'North America',
	'América do Sul': 'South America',
	Oceania: 'Oceania',
	'Oceano aberto': 'Open ocean'
};

export const subregionNames: Record<string, string> = {
	'África Austral': 'Southern Africa',
	'Europa Setentrional': 'Northern Europe',
	'Sudeste Europeu': 'Southeast Europe',
	'Europa Ocidental': 'Western Europe',
	'Europa Meridional': 'Southern Europe',
	'África Central': 'Central Africa',
	Caribe: 'Caribbean',
	'Ásia Ocidental': 'Western Asia',
	'África Setentrional': 'Northern Africa',
	'Europa Central': 'Central Europe',
	'América Central': 'Central America',
	'África Ocidental': 'Western Africa',
	'Europa Oriental': 'Eastern Europe',
	'África Oriental': 'Eastern Africa',
	'Ásia Central': 'Central Asia',
	Melanésia: 'Melanesia',
	Micronésia: 'Micronesia',
	Polinésia: 'Polynesia'
};

export const typeNames: Record<string, string> = {
	'Estado soberano': 'Sovereign state',
	País: 'Country',
	'Território dependente': 'Dependent territory',
	'Estatuto indeterminado': 'Indeterminate status',
	'Território disputado': 'Disputed territory',
	'Território separatista': 'Separatist territory',
	Sovereignty: 'Sovereignty'
};

export const languageNames: Record<string, string> = {
	Africâner: 'Afrikaans',
	Aimará: 'Aymara',
	Albanês: 'Albanian',
	Alemão: 'German',
	Amárico: 'Amharic',
	Armênio: 'Armenian',
	Bielorrusso: 'Belarusian',
	Birmanês: 'Burmese',
	Bósnio: 'Bosnian',
	Búlgaro: 'Bulgarian',
	Catalão: 'Catalan',
	Cazaque: 'Kazakh',
	Chinês: 'Chinese',
	Cingalês: 'Sinhala',
	Coreano: 'Korean',
	Croata: 'Croatian',
	Dinamarquês: 'Danish',
	Eslovaco: 'Slovak',
	Espanhol: 'Spanish',
	Estoniano: 'Estonian',
	Finlandês: 'Finnish',
	Francês: 'French',
	Georgiano: 'Georgian',
	Grego: 'Greek',
	Groenlandês: 'Greenlandic',
	Hebraico: 'Hebrew',
	Híndi: 'Hindi',
	Húngaro: 'Hungarian',
	Indonésio: 'Indonesian',
	Inglês: 'English',
	Irlandês: 'Irish',
	Islandês: 'Icelandic',
	Italiano: 'Italian',
	Japonês: 'Japanese',
	Laosiano: 'Lao',
	Letão: 'Latvian',
	Lituano: 'Lithuanian',
	Luxemburguês: 'Luxembourgish',
	Macedônio: 'Macedonian',
	Malaio: 'Malay',
	Malgaxe: 'Malagasy',
	Maltês: 'Maltese',
	Moldavian: 'Moldovan',
	Mongol: 'Mongolian',
	Neerlandês: 'Dutch',
	Nepalês: 'Nepali',
	Polonês: 'Polish',
	Português: 'Portuguese',
	Quíchua: 'Quechua',
	Romeno: 'Romanian',
	Russo: 'Russian',
	Sérvio: 'Serbian',
	Suaíli: 'Swahili',
	Sueco: 'Swedish',
	Tailandês: 'Thai',
	Tcheco: 'Czech',
	Turco: 'Turkish',
	Tâmil: 'Tamil',
	Tétum: 'Tetum',
	Ucraniano: 'Ukrainian',
	Uzbeque: 'Uzbek',
	Vietnamita: 'Vietnamese',
	Árabe: 'Arabic'
};

export const indicatorNamesEn: Record<IndicatorKey, string> = {
	population: 'Total population',
	popDensity: 'Population density',
	popGrowth: 'Population growth',
	lifeExpectancy: 'Life expectancy at birth',
	urbanShare: 'Urban population',
	fertility: 'Fertility rate',
	gdp: 'Nominal GDP',
	gdpPerCapita: 'GDP per capita',
	gdpGrowth: 'GDP growth',
	exportsShare: 'Exports of goods and services',
	importsShare: 'Imports of goods and services',
	militaryShare: 'Military expenditure',
	internetShare: 'Internet users',
	forestShare: 'Forest area',
	renewableShare: 'Renewable energy',
	electricityAccess: 'Access to electricity',
	industryShare: 'Industry value added',
	agriShare: 'Agriculture value added',
	co2PerCapita: 'CO₂ emissions per capita',
	researchShare: 'Research and development',
	gini: 'Gini index',
	unemployment: 'Unemployment',
	inflation: 'Inflation (CPI)',
	debtShare: 'Government debt',
	co2Total: 'CO₂ emissions',
	energyUse: 'Energy use',
	tourism: 'Tourist arrivals',
	schoolEnrollment: 'Secondary school enrolment',
	healthShare: 'Health expenditure',
	govEffectiveness: 'Government effectiveness (WGI)',
	controlCorruption: 'Control of corruption (WGI)',
	ruleOfLaw: 'Rule of law (WGI)'
};

export const indicatorUnitsEn: Record<IndicatorKey, string> = {
	population: 'people',
	popDensity: 'people/km²',
	popGrowth: '% per year',
	lifeExpectancy: 'years',
	urbanShare: '% of population',
	fertility: 'births per woman',
	gdp: 'current US$',
	gdpPerCapita: 'current US$',
	gdpGrowth: '% per year',
	exportsShare: '% of GDP',
	importsShare: '% of GDP',
	militaryShare: '% of GDP',
	internetShare: '% of population',
	forestShare: '% of land',
	renewableShare: '% of final consumption',
	electricityAccess: '% of population',
	industryShare: '% of GDP',
	agriShare: '% of GDP',
	co2PerCapita: 't CO₂ per person',
	researchShare: '% of GDP',
	gini: 'index 0–100',
	unemployment: '% of labour force',
	inflation: '% per year',
	debtShare: '% of GDP',
	co2Total: 'Mt CO₂',
	energyUse: 'kg oil equivalent per person',
	tourism: 'arrivals per year',
	schoolEnrollment: '% of age group',
	healthShare: '% of GDP',
	govEffectiveness: 'score −2.5 to 2.5',
	controlCorruption: 'score −2.5 to 2.5',
	ruleOfLaw: 'score −2.5 to 2.5'
};

export function indicatorName(key: IndicatorKey, locale: Locale): string {
	return locale === 'en' ? (indicatorNamesEn[key] ?? key) : (indicatorMeta[key]?.name ?? key);
}

export function indicatorUnit(key: IndicatorKey, locale: Locale): string {
	return locale === 'en'
		? (indicatorUnitsEn[key] ?? '')
		: (indicatorMeta[key]?.unit ?? '');
}

export function localizeCountryName(
	country: { name: string; nameEn: string },
	locale: Locale
): string {
	return locale === 'en' ? country.nameEn || country.name : country.name;
}

export function localizeContinent(value: string | null | undefined, locale: Locale): string {
	if (!value) return '';
	return locale === 'en' ? (continentNames[value] ?? value) : value;
}

export function localizeSubregion(value: string | null | undefined, locale: Locale): string {
	if (!value) return '';
	return locale === 'en' ? (subregionNames[value] ?? value) : value;
}

export function localizeType(value: string | null | undefined, locale: Locale): string {
	if (!value) return '';
	return locale === 'en' ? (typeNames[value] ?? value) : value;
}

export function localizeLanguage(value: string, locale: Locale): string {
	return locale === 'en' ? (languageNames[value] ?? value) : value;
}

export function localizeDependency(
	country: { code: string; name: string; nameEn: string } | null | undefined,
	locale: Locale
): string | null {
	if (!country) return null;
	const label = dependencyLabel(country as never);
	if (!label) return null;
	if (locale === 'pt') return label;
	const sovereign = sovereignCountry(country as never);
	return sovereign ? `Dependent territory of ${sovereign.nameEn}` : label;
}

export const historicalSourceEn = {
	name: 'Encyclopaedia Britannica — country entries',
	url: 'https://www.britannica.com',
	accessed: '2025-10',
	note: 'Dates of independence, state formation and name changes. In disputed cases, the note states the criterion used.'
};

