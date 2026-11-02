import countriesRaw from './generated/countries.json';
import indicatorsRaw from './generated/indicators.json';
import sourcesRaw from './generated/sources.json';
import type {
	Country,
	DataManifest,
	IndicatorKey,
	IndicatorMeta,
	IndicatorValue
} from '#lib/types';

const data = countriesRaw as unknown as { retrieved: string; countries: Country[] };
const indicatorData = indicatorsRaw as unknown as {
	retrieved: string;
	indicators: Record<IndicatorKey, IndicatorMeta>;
	coverage: Record<IndicatorKey, number>;
};

export const retrievedAt = data.retrieved;
export const countries: Country[] = data.countries;
export const indicatorMeta = indicatorData.indicators;
export const indicatorCoverage = indicatorData.coverage;
export const manifest = sourcesRaw as unknown as DataManifest;

export const indicatorKeys = Object.keys(indicatorMeta) as IndicatorKey[];

/** Códigos adicionais que apontam para o mesmo polígono/registro. */
const aliases: Record<string, string> = {
	XKX: 'KOS',
	UNK: 'KOS',
	SSD: 'SDS',
	PSE: 'PSX',
	ESH: 'SAH'
};

export const countryByCode: ReadonlyMap<string, Country> = new Map(
	countries.map((c) => [c.code, c])
);
for (const [alias, target] of Object.entries(aliases)) {
	const country = countryByCode.get(target);
	if (country) (countryByCode as Map<string, Country>).set(alias, country);
}

export function getCountry(code: string | null | undefined): Country | null {
	if (!code) return null;
	return countryByCode.get(aliases[code] ?? code) ?? null;
}


/**
 * Entidades que não são membros ou observadores da ONU mas aparecem como país
 * no atlas: Taiwan, Kosovo e Palestina. Os demais estatutos especiais
 * (dependências, territórios disputados e separatistas) contam como território.
 */
const EXTRA_COUNTRY_CODES = new Set(['TWN', 'KOS', 'PSX']);

/** País = Estado soberano, observador da ONU ou entidade listada acima. */
export function isCountry(country: Country): boolean {
	return (
		country.status !== 'Dependency' &&
		(country.unMember === true || EXTRA_COUNTRY_CODES.has(country.code))
	);
}

export const countryCount = countries.filter(isCountry).length;
export const territoryCount = countries.length - countryCount;

/** País soberano associado a um território dependente (Natural Earth). */
export function sovereignCountry(country: Country): Country | null {
	const name = country.sovereign;
	if (!name) return null;
	const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
	const match = countries.find((candidate) => {
		const en = candidate.nameEn.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
		const pt = candidate.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
		return en === normalized || pt === normalized;
	});
	return match?.code === country.code ? null : (match ?? null);
}

/** Rótulo de dependência para cabeçalhos e fichas. */
export function dependencyLabel(country: Country): string | null {
	const sovereign = sovereignCountry(country);
	if (!sovereign || country.unMember !== false) return null;
	return `Território dependente de ${sovereign.name}`;
}

export function countryName(code: string): string {
	return getCountry(code)?.name ?? code;
}

export function valueOf(code: string, key: IndicatorKey): IndicatorValue | null {
	return getCountry(code)?.indicators[key] ?? null;
}

/** Países com dado disponível para um indicador, ordenados do maior para o menor. */
export function rankedBy(key: IndicatorKey): { country: Country; value: IndicatorValue }[] {
	return countries
		.map((country) => ({ country, value: country.indicators[key] }))
		.filter((row): row is { country: Country; value: IndicatorValue } => Boolean(row.value))
		.sort((a, b) => b.value.v - a.value.v);
}

export function countriesWith(key: IndicatorKey): Country[] {
	const dir = indicatorMeta[key]?.dir ?? 'higher';
	const rows = countries.filter((c) => c.indicators[key]);
	return rows.sort((a, b) => {
		const av = a.indicators[key]!.v;
		const bv = b.indicators[key]!.v;
		return dir === 'higher' ? bv - av : av - bv;
	});
}

export interface RankInfo {
	rank: number;
	total: number;
	percentile: number;
}

/** Posição do país no ranking (1 = melhor, respeitando a direção do indicador). */
export function rankOf(code: string, key: IndicatorKey): RankInfo | null {
	const value = valueOf(code, key);
	if (!value) return null;
	const dir = indicatorMeta[key]?.dir ?? 'higher';
	const all = countries
		.map((c) => c.indicators[key]?.v)
		.filter((v): v is number => typeof v === 'number');
	const better = all.filter((v) => (dir === 'higher' ? v > value.v : v < value.v)).length;
	const total = all.length;
	// posição média em caso de empate
	const equal = all.filter((v) => v === value.v).length;
	return {
		rank: better + 1,
		total,
		percentile: total > 1 ? 1 - (better + equal / 2) / total : 0
	};
}

export function worldStats(key: IndicatorKey): { median: number; max: number; min: number; n: number } | null {
	const values = countries
		.map((c) => c.indicators[key]?.v)
		.filter((v): v is number => typeof v === 'number')
		.sort((a, b) => a - b);
	if (!values.length) return null;
	const mid = Math.floor(values.length / 2);
	return {
		median: values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2,
		max: values[values.length - 1],
		min: values[0],
		n: values.length
	};
}

export function neighborsOf(code: string): Country[] {
	const country = getCountry(code);
	if (!country) return [];
	return country.borders.map((b) => getCountry(b)).filter((c): c is Country => Boolean(c));
}

export function countriesByContinent(): Map<string, Country[]> {
	const map = new Map<string, Country[]>();
	for (const country of countries) {
		const key = country.continent ?? 'Outros';
		map.set(key, [...(map.get(key) ?? []), country]);
	}
	return map;
}

/** Busca tolerante a acentos, usada na paleta de comandos. */
export function searchCountries(query: string, limit = 8): Country[] {
	const q = query
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
	if (!q) return [];
	return countries
		.map((country) => {
			const name = country.name
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase();
			const en = country.nameEn.toLowerCase();
			const iso = country.code.toLowerCase();
			let score = -1;
			if (name === q || en === q || iso === q) score = 0;
			else if (name.startsWith(q) || en.startsWith(q)) score = 1;
			else if (name.includes(q) || en.includes(q)) score = 2;
			return { country, score };
		})
		.filter((x) => x.score >= 0)
		.sort((a, b) => a.score - b.score || a.country.name.localeCompare(b.country.name, 'pt-BR'))
		.slice(0, limit)
		.map((x) => x.country);
}
