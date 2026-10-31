import { countries, indicatorMeta } from '#lib/data/countries';
import { capitalInPortuguese } from '#lib/data/capitals-pt';
import { organizations, organizationById } from '#lib/data/organizations';
import { formatIndicatorLong } from '#lib/format';
import type { Country, IndicatorKey } from '#lib/types';
import type { GameDefinition, GameRound } from './types';
import { createRng, pick, sample, shuffle, type Rng } from './random';
import { normalizeText } from './validate';

const sovereign = countries.filter((c) => c.unMember === true);
const withPopulation = countries.filter((c) => c.indicators.population);

function topBy(key: IndicatorKey, n: number): Country[] {
	const rows = countries
		.map((country) => ({ country, value: country.indicators[key] }))
		.filter((row) => row.value)
		.sort((a, b) => b.value!.v - a.value!.v);
	const out: Country[] = [];
	let last = Number.POSITIVE_INFINITY;
	for (const row of rows) {
		if (out.length >= n) break;
		if (row.value!.v === last) continue;
		out.push(row.country);
		last = row.value!.v;
	}
	return out;
}

function capitalOf(country: Country): string {
	return capitalInPortuguese(country.code, country.capital) ?? '';
}

const CAPITAL_ALIASES: Record<string, string[]> = {
	'Washington, D.C.': ['Washington', 'Washington DC'],
	'Sri Jayawardenepura Kotte': ['Kotte', 'Sri Jayawardenepura'],
	Naypyidaw: ['Nay Pyi Taw'],
	Astana: ['Nur-Sultan'],
	Bern: ['Berna'],
	Brazavile: ['Brazzaville'],
	Duchambe: ['Dushanbe'],
	'Erevan': ['Yerevan'],
	Kiev: ['Kyiv'],
	'Adis Abeba': ['Addis Ababa'],
	'Mogadíscio': ['Mogadishu'],
	'Nairóbi': ['Nairobi'],
	'Uagadugu': ['Ouagadougou'],
	'Bamaco': ['Bamako'],
	'Conacri': ['Conakry'],
	'Dacar': ['Dakar'],
	'Tóquio': ['Tokyo'],
	'Pequim': ['Beijing'],
	'Moscou': ['Moscow'],
	'Londres': ['London'],
	'Roma': ['Rome'],
	'Atenas': ['Athens'],
	'Copenhague': ['Copenhagen'],
	'Bruxelas': ['Brussels'],
	'Varsóvia': ['Warsaw'],
	'Praga': ['Prague'],
	'Viena': ['Vienna'],
	'Bucareste': ['Bucharest'],
	'Sófia': ['Sofia'],
	'Belgrado': ['Belgrade'],
	'Liubliana': ['Ljubljana'],
	'Escópia': ['Skopje'],
	'Teerã': ['Tehran'],
	'Bagdá': ['Baghdad'],
	'Damasco': ['Damascus'],
	'Beirute': ['Beirut'],
	'Cabul': ['Kabul'],
	'Riad': ['Riyadh'],
	'Cidade do Kuwait': ['Kuwait City'],
	'Mascate': ['Muscat'],
	'Amã': ['Amman'],
	'Ancara': ['Ankara'],
	'Nicósia': ['Nicosia'],
	'Argel': ['Algiers'],
	'Túnis': ['Tunis'],
	'Trípoli': ['Tripoli'],
	'Cartum': ['Khartoum'],
	'Djibuti': ['Djibouti'],
	'Acra': ['Accra'],
	'Jamena': ["N'Djamena"],
	'Cidade do México': ['Mexico City'],
	'Cidade da Guatemala': ['Guatemala City'],
	'Cidade do Panamá': ['Panama City'],
	'Porto Príncipe': ['Port-au-Prince'],
	'Assunção': ['Asuncion'],
	'Montevidéu': ['Montevideo'],
	'Camberra': ['Canberra'],
	'Porto Moresby': ['Port Moresby'],
	'Nova Delhi': ['New Delhi'],
	'Katmandu': ['Kathmandu'],
	'Timpu': ['Thimphu'],
	'Dacca': ['Dhaka'],
	'Jacarta': ['Jakarta'],
	'Hanói': ['Hanoi'],
	'Seul': ['Seoul'],
	'Ulan Bator': ['Ulaanbaatar'],
};

const CAPITAL_EXCLUDE = new Set([
	'ZAF', // três capitais
	'BOL', // capital constitucional x sede do governo
	'LKA', // nome oficial extenso e sede em Sri Jayawardenepura Kotte
	'ISR', // estatuto de Jerusalém disputado
	'PSE', // estatuto disputado
	'TWN', // estatuto disputado
	'BEN', // capital oficial x sede do governo
	'CIV' // capital oficial x sede do governo
]);

const capitalPool = sovereign.filter((c) => {
	if (!c.capital || CAPITAL_EXCLUDE.has(c.code)) return false;
	if ((c.indicators.population?.v ?? 0) < 1_000_000) return false;
	return normalizeText(capitalOf(c)) !== normalizeText(c.name);
});

function textVariants(capital: string): string[] {
	const variants = new Set<string>([capital]);
	const beforeComma = capital.split(',')[0]?.trim();
	if (beforeComma) variants.add(beforeComma);
	if (capital.startsWith('Cidade do ')) variants.add(capital.slice(10));
	if (capital.startsWith('Cidade da ')) variants.add(capital.slice(10));
	for (const alias of CAPITAL_ALIASES[capital] ?? []) variants.add(alias);
	return [...variants].filter(Boolean);
}

function countryExplanation(country: Country): string {
	const pop = country.indicators.population;
	const parts = [
		`Continente: ${country.continent ?? 'não classificado'}.`,
		country.capital ? `Capital: ${capitalOf(country)}.` : '',
		pop ? `População: ${formatIndicatorLong('population', pop)} (${pop.y}).` : ''
	];
	return parts.filter(Boolean).join(' ');
}

const finderPool = sovereign.filter((c) => (c.areaKm2 ?? 0) >= 90_000);

function buildCountryFinder(seed?: number): GameRound[] {
	const rng = createRng(seed);
	const targets = sample(finderPool, 8, rng);
	return targets.map((country, i) => ({
		id: `finder-${i}-${country.code}`,
		prompt: `Encontre no mapa: ${country.name}`,
		hint: `Dica: ${country.continent ?? 'localização não classificada'}.`,
		interaction: 'map-single',
		answerKind: 'code',
		rule: { type: 'code', code: country.code },
		explanation: countryExplanation(country),
		source: { name: 'Natural Earth / World Bank', url: 'https://www.naturalearthdata.com/' }
	}));
}

function buildCapitalMatch(seed?: number): GameRound[] {
	const rng = createRng(seed);
	const targets = sample(capitalPool, 8, rng);
	return targets.map((country, i) => {
		const capital = capitalOf(country);
		return {
			id: `capital-${i}-${country.code}`,
			prompt: `Qual é a capital? País: ${country.name}.`,
			hint: `Dica: ${country.continent ?? ''}.`,
			interaction: 'text',
			answerKind: 'text',
			rule: { type: 'text', accepted: textVariants(capital) },
			explanation: `${capital} é a capital. ${capital === country.capital ? '' : `A grafia em inglês é ${country.capital}.`}`.trim(),
			source: { name: 'mledoze/countries', url: 'https://github.com/mledoze/countries' },
			camera: country.latlng ? { center: [country.latlng[1], country.latlng[0]], zoom: 3.1 } : undefined
		};
	});
}

const rankingIndicators: { key: IndicatorKey; label: string }[] = [
	{ key: 'population', label: 'população total' },
	{ key: 'gdp', label: 'PIB nominal' },
	{ key: 'gdpPerCapita', label: 'PIB per capita' },
	{ key: 'lifeExpectancy', label: 'expectativa de vida ao nascer' },
	{ key: 'forestShare', label: 'área florestal' }
];

function buildRankings(seed?: number): GameRound[] {
	const rng = createRng(seed);
	const chosen = shuffle(rankingIndicators, rng);
	return chosen.map((indicator, i) => {
		const top = topBy(indicator.key, 5);
		const codes = top.map((c) => c.code);
		const explanation = top
			.map((c, idx) => {
				const value = c.indicators[indicator.key];
				return value ? `${idx + 1}. ${c.name}: ${formatIndicatorLong(indicator.key, value)} (${value.y})` : '';
			})
			.filter(Boolean)
			.join(' · ');
		return {
			id: `ranking-${i}-${indicator.key}`,
			prompt: `Ordene do maior para o menor: ${indicator.label}.`,
			hint: 'Arraste as linhas ou use as setas para reordenar.',
			interaction: 'order',
			answerKind: 'order',
			rule: { type: 'order', codes },
			items: shuffle(codes, rng),
			explanation,
			source: {
				name: indicatorMeta[indicator.key].source,
				url: indicatorMeta[indicator.key].sourceUrl
			}
		};
	});
}

const BLOC_CAMERAS: Record<string, { center: [number, number]; zoom: number }> = {
	brics: { center: [20, 8], zoom: 1.1 },
	asean: { center: [110, 5], zoom: 2.7 },
	opec: { center: [30, 24], zoom: 1.3 },
	ussr: { center: [80, 55], zoom: 1.2 },
	yugoslavia: { center: [18, 44], zoom: 3.6 },
	nato: { center: [12, 50], zoom: 2.1 },
	eu: { center: [10, 50], zoom: 2.6 }
};

function buildBlocs(seed?: number): GameRound[] {
	const rng = createRng(seed);
	const setOrganizations = ['brics', 'asean', 'opec', 'ussr', 'yugoslavia']
		.map((id) => organizationById.get(id)!)
		.filter(Boolean);

	const rounds: GameRound[] = setOrganizations.map((org, i) => ({
		id: `bloc-${org.id}-${i}`,
		prompt: `Selecione todos os países que fazem parte de: ${org.name}${org.name.includes(org.short) ? '' : ` (${org.short})`}.`,
		hint: org.note,
		interaction: 'map-multi',
		answerKind: 'codes',
		rule: { type: 'set', codes: org.members },
		explanation: `${org.note} Membros: ${org.members
			.map((code) => countries.find((c) => c.code === code)?.name ?? code)
			.join(', ')}.`,
		source: org.source,
		camera: BLOC_CAMERAS[org.id]
	}));

	const oddOrgs = ['nato', 'eu'].map((id) => organizationById.get(id)!);
	const europeans = countries.filter((c) => c.continent === 'Europa');

	const oddRounds = oddOrgs.map((org, i): GameRound => {
		const members = sample(
			org.members.map((code) => countries.find((c) => c.code === code)).filter((c): c is Country => Boolean(c)),
			4,
			rng
		);
		const nonMembers = europeans.filter((c) => !org.members.includes(c.code));
		const odd = pick(nonMembers, rng);
		const choices = shuffle([...members.map((c) => c.code), odd.code], rng);
		return {
			id: `bloc-odd-${org.id}-${i}`,
			prompt: `Qual destes países NÃO é membro da ${org.short}?`,
			hint: 'Clique em um dos países destacados.',
			interaction: 'map-single',
			answerKind: 'code',
			rule: { type: 'code', code: odd.code },
			choices,
			focus: choices,
			camera: BLOC_CAMERAS[org.id],
			explanation: `${odd.name} não faz parte deste bloco (${org.short}). Os outros quatro países destacados são membros.`,
			source: org.source
		};
	});

	return [...rounds, ...oddRounds];
}

const LANDLOCKED_GROUPS = ['América do Sul', 'Europa', 'África', 'Ásia'];

function cameraFor(codes: string[]): { center: [number, number]; zoom: number } {
	const points = codes
		.map((code) => countries.find((c) => c.code === code)?.latlng)
		.filter((p): p is [number, number] => Boolean(p));
	if (!points.length) return { center: [0, 20], zoom: 1.6 };
	const lats = points.map((p) => p[0]);
	const lngs = points.map((p) => p[1]);
	const center: [number, number] = [
		lats.reduce((a, b) => a + b, 0) / lats.length,
		lngs.reduce((a, b) => a + b, 0) / lngs.length
	];
	const span = Math.max(
		Math.max(...lats) - Math.min(...lats),
		Math.max(...lngs) - Math.min(...lngs),
		6
	);
	const zoom = Math.min(4.8, Math.max(1.3, Math.log2(420 / span) - 0.2));
	return { center, zoom };
}

function buildLandlocked(seed?: number): GameRound[] {
	const rng = createRng(seed);
	const rounds: GameRound[] = [];
	const used = new Set<string>();

	for (const continent of LANDLOCKED_GROUPS) {
		const group = sovereign.filter((c) => c.continent === continent && typeof c.landlocked === 'boolean');
		const landlockedAll = group.filter((c) => c.landlocked === true);
		const coastalAll = group.filter((c) => c.landlocked === false);
		if (landlockedAll.length < 1 || coastalAll.length < 3) continue;

		for (const targetIsLandlocked of [true, false]) {
			const targetPool = (targetIsLandlocked ? landlockedAll : coastalAll).filter(
				(c) => !used.has(c.code)
			);
			const otherPool = targetIsLandlocked ? coastalAll : landlockedAll;
			if (!targetPool.length || otherPool.length < 2) continue;
			const target = pick(targetPool, rng);
			const others = sample(otherPool, Math.min(3, otherPool.length), rng);
			const choices = shuffle([target.code, ...others.map((c) => c.code)], rng);
			used.add(target.code);

			rounds.push({
				id: `landlocked-${continent}-${target.code}`,
				prompt: targetIsLandlocked
					? 'Qual destes países NÃO tem saída para o mar?'
					: 'Qual destes países tem litoral?',
				hint: 'Os países candidatos estão destacados no mapa.',
				interaction: 'map-single',
				answerKind: 'code',
				rule: { type: 'code', code: target.code },
				choices,
				focus: choices,
				camera: cameraFor(choices),
				explanation: `${target.name} ${targetIsLandlocked ? 'é um país sem litoral' : 'tem saída para o mar'}. Os demais destacados são ${targetIsLandlocked ? 'costeiros' : 'sem litoral'}.`,
				source: { name: 'mledoze/countries', url: 'https://github.com/mledoze/countries' }
			});
		}
	}

	return rounds.slice(0, 8);
}

export const games: GameDefinition[] = [
	{
		slug: 'country-finder',
		title: 'Países do Mundo',
		tagline: 'Clique no país certo',
		description:
			'O nome aparece, o mapa espera. Encontre o país no lugar certo — sem dicas de fronteira.',
		category: 'Geografia',
		interaction: 'map-single',
		rounds: 8,
		minutes: 4,
		mechanic: 'Clique no mapa',
		icon: 'pin',
		build: buildCountryFinder
	},
	{
		slug: 'capital-match',
		title: 'Capitais',
		tagline: 'Do nome à capital',
		description:
			'Digite a capital de cada país. Aceita a grafia em português e em inglês, com ou sem acento.',
		category: 'Geografia',
		interaction: 'text',
		rounds: 8,
		minutes: 5,
		mechanic: 'Resposta digitada',
		icon: 'type',
		build: buildCapitalMatch
	},
	{
		slug: 'world-rankings',
		title: 'Rankings do Mundo',
		tagline: 'Quem está no topo?',
		description:
			'Ordene os cinco primeiros em população, PIB, expectativa de vida e mais. Os dados são do Banco Mundial.',
		category: 'Dados',
		interaction: 'order',
		rounds: 5,
		minutes: 4,
		mechanic: 'Ordenar',
		icon: 'sort',
		build: buildRankings
	},
	{
		slug: 'blocs',
		title: 'Blocos e Alianças',
		tagline: 'Quem está dentro?',
		description:
			'OTAN, União Europeia, BRICS, OPEP, URSS e Iugoslávia. Selecione os membros ou ache o intruso.',
		category: 'Geopolítica',
		interaction: 'map-multi',
		rounds: 7,
		minutes: 6,
		mechanic: 'Seleção múltipla',
		icon: 'shield',
		build: buildBlocs
	},
	{
		slug: 'landlocked',
		title: 'Sem Litoral',
		tagline: 'Mar ou terra?',
		description:
			'Quatro países destacados, uma pergunta: qual deles não tem costa? Ou qual é o único que tem?',
		category: 'Geografia',
		interaction: 'map-single',
		rounds: 8,
		minutes: 3,
		mechanic: 'Escolha no mapa',
		icon: 'wave',
		build: buildLandlocked
	}
];

export const gameBySlug = new Map(games.map((g) => [g.slug, g]));

export function buildRounds(slug: string, seed?: number): GameRound[] {
	const game = gameBySlug.get(slug);
	return game ? game.build(seed) : [];
}

export const organizationCount = organizations.length;
export const populationPoolSize = withPopulation.length;
export const finderPoolSize = finderPool.length;
export const capitalPoolSize = capitalPool.length;
