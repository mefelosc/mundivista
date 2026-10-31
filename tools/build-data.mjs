#!/usr/bin/env node
/**
 * Gera os dados estáticos do app a partir de fontes públicas verificáveis.
 *
 * Uso:  node tools/build-data.mjs [--refresh]
 *
 * Fontes:
 *  - Natural Earth 1:50m (domínio público)      -> fronteiras, nomes em pt-BR
 *  - mledoze/countries (ODbL)                    -> capital, moeda, área, vizinhos
 *  - World Bank Open Data (CC BY 4.0)            -> indicadores socioeconômicos
 *
 * O script nunca inventa valores: indicadores ausentes ficam como null e o
 * ano de referência é sempre preservado.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, '.cache');
const OUT = path.join(ROOT, 'src/lib/data/generated');
const REFRESH = process.argv.includes('--refresh');
const RETRIEVED = new Date().toISOString().slice(0, 10);

const SOURCES = {
	boundaries: {
		name: 'Natural Earth — Admin 0 Countries (1:50m)',
		url: 'https://www.naturalearthdata.com/downloads/110m-cultural-vectors/',
		license: 'Domínio público',
		scale: '1:50m',
		note: 'Recorte generalizado. Microestados podem não estar representados. Fronteiras disputadas não expressam posição política.'
	},
	facts: {
		name: 'mledoze/countries (base do projeto REST Countries)',
		url: 'https://github.com/mledoze/countries',
		license: 'ODbL 1.0',
		note: 'Capital, moeda, área, idiomas e países vizinhos.'
	},
	physical: {
		name: 'Natural Earth — Rios e lagos (1:110m)',
		url: 'https://www.naturalearthdata.com/downloads/110m-physical-vectors/',
		license: 'Domínio público',
		scale: '1:110m',
		note: 'Apenas as feições principais. O relevo é representado por rótulos curados, não por um modelo digital de elevação.'
	},
	indicators: {
		name: 'World Bank Open Data',
		url: 'https://data.worldbank.org',
		license: 'CC BY 4.0',
		note: 'Série mais recente disponível por país dentro da janela consultada.'
	}
};

const INDICATORS = [
	{ key: 'population', code: 'SP.POP.TOTL', name: 'População total', unit: 'habitantes', format: 'int', dir: 'higher' },
	{ key: 'popDensity', code: 'EN.POP.DNST', name: 'Densidade populacional', unit: 'hab/km²', format: 'dec1', dir: 'higher' },
	{ key: 'popGrowth', code: 'SP.POP.GROW', name: 'Crescimento populacional', unit: '% ao ano', format: 'dec2', dir: 'higher' },
	{ key: 'lifeExpectancy', code: 'SP.DYN.LE00.IN', name: 'Expectativa de vida ao nascer', unit: 'anos', format: 'dec1', dir: 'higher' },
	{ key: 'urbanShare', code: 'SP.URB.TOTL.IN.ZS', name: 'População urbana', unit: '% da população', format: 'dec1', dir: 'higher' },
	{ key: 'fertility', code: 'SP.DYN.TFRT.IN', name: 'Taxa de fecundidade', unit: 'filhos por mulher', format: 'dec2', dir: 'higher' },
	{ key: 'gdp', code: 'NY.GDP.MKTP.CD', name: 'PIB nominal', unit: 'US$ correntes', format: 'usd', dir: 'higher' },
	{ key: 'gdpPerCapita', code: 'NY.GDP.PCAP.CD', name: 'PIB per capita', unit: 'US$ correntes', format: 'usd', dir: 'higher' },
	{ key: 'gdpGrowth', code: 'NY.GDP.MKTP.KD.ZG', name: 'Crescimento do PIB', unit: '% ao ano', format: 'dec1', dir: 'higher' },
	{ key: 'exportsShare', code: 'NE.EXP.GNFS.ZS', name: 'Exportações de bens e serviços', unit: '% do PIB', format: 'dec1', dir: 'higher' },
	{ key: 'importsShare', code: 'NE.IMP.GNFS.ZS', name: 'Importações de bens e serviços', unit: '% do PIB', format: 'dec1', dir: 'higher' },
	{ key: 'militaryShare', code: 'MS.MIL.XPND.GD.ZS', name: 'Gastos militares', unit: '% do PIB', format: 'dec1', dir: 'higher' },
	{ key: 'internetShare', code: 'IT.NET.USER.ZS', name: 'Pessoas com acesso à internet', unit: '% da população', format: 'dec1', dir: 'higher' },
	{ key: 'forestShare', code: 'AG.LND.FRST.ZS', name: 'Área florestal', unit: '% do território', format: 'dec1', dir: 'higher' },
	{ key: 'renewableShare', code: 'EG.FEC.RNEW.ZS', name: 'Energia renovável no consumo final', unit: '% do consumo', format: 'dec1', dir: 'higher' },
	{ key: 'electricityAccess', code: 'EG.ELC.ACCS.ZS', name: 'Acesso à eletricidade', unit: '% da população', format: 'dec1', dir: 'higher' },
	{ key: 'industryShare', code: 'NV.IND.TOTL.ZS', name: 'Indústria no valor adicionado', unit: '% do PIB', format: 'dec1', dir: 'higher' },
	{ key: 'agriShare', code: 'NV.AGR.TOTL.ZS', name: 'Agricultura no valor adicionado', unit: '% do PIB', format: 'dec1', dir: 'higher' },
	{ key: 'co2PerCapita', code: 'EN.GHG.CO2.PC.CE.AR5', name: 'Emissões de CO₂ per capita', unit: 't CO₂ por pessoa', format: 'dec2', dir: 'lower' },
	{ key: 'researchShare', code: 'GB.XPD.RSDV.GD.ZS', name: 'Investimento em P&D', unit: '% do PIB', format: 'dec2', dir: 'higher' }
];

const WB_YEARS = '2016:2025';

/* Códigos divergentes entre Natural Earth e World Bank / mledoze. */
const CODE_ALIASES = {
	KOS: { wb: 'XKX', rc: 'XKX' },
	SDS: { wb: 'SSD', rc: 'SSD' },
	SOL: { wb: 'SOM', rc: 'SOM' }, // Somalilândia: sem série própria no WB
	SAH: { wb: null, rc: null }, // Saara Ocidental
	ATA: { wb: null, rc: null },
	NCL: { wb: 'NCL', rc: 'NCL' },
	CYN: { wb: null, rc: null }
};

const REGION_PT = {
	Americas: 'Américas',
	Europe: 'Europa',
	Asia: 'Ásia',
	Africa: 'África',
	Oceania: 'Oceania',
	Antarctic: 'Antártida',
	'North America': 'América do Norte',
	'South America': 'América do Sul',
	'Central America': 'América Central',
	Caribbean: 'Caribe',
	'Western Europe': 'Europa Ocidental',
	'Eastern Europe': 'Europa Oriental',
	'Northern Europe': 'Europa Setentrional',
	'Southern Europe': 'Europa Meridional',
	'Central Europe': 'Europa Central',
	'Southeast Europe': 'Sudeste Europeu',
	'Western Asia': 'Ásia Ocidental',
	'Central Asia': 'Ásia Central',
	'South Asia': 'Ásia Meridional',
	'East Asia': 'Ásia Oriental',
	'Southeast Asia': 'Sudeste Asiático',
	'Northern Africa': 'África Setentrional',
	'Western Africa': 'África Ocidental',
	'Middle Africa': 'África Central',
	'Eastern Africa': 'África Oriental',
	'Southern Africa': 'África Austral',
	Australasia: 'Australásia',
	Melanesia: 'Melanésia',
	Micronesia: 'Micronésia',
	Polynesia: 'Polinésia',
	'Seven seas (open ocean)': 'Oceano aberto',
	Antarctica: 'Antártida'
};

const LANGUAGE_PT = {
	Portuguese: 'Português', Spanish: 'Espanhol', English: 'Inglês', French: 'Francês',
	German: 'Alemão', Italian: 'Italiano', Dutch: 'Neerlandês', Russian: 'Russo',
	Arabic: 'Árabe', Chinese: 'Chinês', Mandarin: 'Mandarim', Japanese: 'Japonês',
	Korean: 'Coreano', Hindi: 'Híndi', Bengali: 'Bengali', Urdu: 'Urdu',
	Indonesian: 'Indonésio', Malay: 'Malaio', Thai: 'Tailandês', Vietnamese: 'Vietnamita',
	Turkish: 'Turco', Persian: 'Persa', Hebrew: 'Hebraico', Greek: 'Grego',
	Polish: 'Polonês', Czech: 'Tcheco', Slovak: 'Eslovaco', Hungarian: 'Húngaro',
	Romanian: 'Romeno', Bulgarian: 'Búlgaro', Serbian: 'Sérvio', Croatian: 'Croata',
	Bosnian: 'Bósnio', Slovenian: 'Esloveno', Macedonian: 'Macedônio', Albanian: 'Albanês',
	Ukrainian: 'Ucraniano', Belarusian: 'Bielorrusso', Lithuanian: 'Lituano',
	Latvian: 'Letão', Estonian: 'Estoniano', Finnish: 'Finlandês', Swedish: 'Sueco',
	Norwegian: 'Norueguês', Danish: 'Dinamarquês', Icelandic: 'Islandês', Irish: 'Irlandês',
	Welsh: 'Galês', Catalan: 'Catalão', Basque: 'Basco', Galician: 'Galego',
	Swahili: 'Suaíli', Amharic: 'Amárico', Somali: 'Somali', Hausa: 'Hauçá',
	Yoruba: 'Iorubá', Zulu: 'Zulu', Afrikaans: 'Africâner', Malagasy: 'Malgaxe',
	Burmese: 'Birmanês', Khmer: 'Khmer', Lao: 'Laosiano', Nepali: 'Nepalês',
	Sinhala: 'Cingalês', Tamil: 'Tâmil', Telugu: 'Télugo', Kazakh: 'Cazaque',
	Uzbek: 'Uzbeque', Azerbaijani: 'Azerbaijani', Armenian: 'Armênio', Georgian: 'Georgiano',
	Mongolian: 'Mongol', Tibetan: 'Tibetano', Dzongkha: 'Dzongkha', Pashto: 'Pashto',
	Dari: 'Dari', Kurdish: 'Curdo', Tagalog: 'Tagalo', Filipino: 'Filipino',
	Māori: 'Maori', Samoan: 'Samoano', Tongan: 'Tongan', Fijian: 'Fijiano',
	Haitian: 'Haitiano', Quechua: 'Quíchua', Aymara: 'Aimará', Guarani: 'Guarani',
	Greenlandic: 'Groenlandês', Luxembourgish: 'Luxemburguês', Maltese: 'Maltês',
	Moldovan: 'Moldavo', Romansh: 'Romanche', Tetum: 'Tétum', Tokelauan: 'Toquelauano'
};

const TYPE_PT = {
	'Sovereign country': 'Estado soberano',
	Country: 'País',
	Dependency: 'Território dependente',
	'Indeterminate': 'Estatuto indeterminado',
	Disputed: 'Território disputado',
	'Lease': 'Território arrendado',
	'Breakaway': 'Território separatista'
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCached(url, file, { json = true, attempts = 4 } = {}) {
	if (!existsSync(CACHE)) await mkdir(CACHE, { recursive: true });
	const p = path.join(CACHE, file);
	if (existsSync(p) && !REFRESH) return json ? JSON.parse(await readFile(p, 'utf8')) : await readFile(p);

	let lastError;
	for (let i = 1; i <= attempts; i++) {
		try {
			const res = await fetch(url, { headers: { 'user-agent': 'mundivista-data-pipeline/1.0' } });
			if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
			const text = await res.text();
			await writeFile(p, text);
			return json ? JSON.parse(text) : text;
		} catch (err) {
			lastError = err;
			if (i < attempts) await sleep(1500 * i);
		}
	}
	throw lastError;
}

const norm = (s) =>
	(s || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

async function main() {
	console.log('› fronteiras (Natural Earth)');
	const ne = await fetchCached(
		'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson',
		'ne_50m_countries.geojson'
	);

	console.log('› fatos dos países (mledoze/countries)');
	const rc = await fetchCached(
		'https://raw.githubusercontent.com/mledoze/countries/master/countries.json',
		'countries.json'
	);
	const rcBy3 = new Map(rc.filter((c) => c.cca3 && c.cca3.length === 3).map((c) => [c.cca3, c]));
	const rcByName = new Map(rc.map((c) => [norm(c.name.common), c]));

	console.log('› coordenadas de capitais (Natural Earth)');
	const places = await fetchCached(
		'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_populated_places.geojson',
		'ne_110m_populated_places.geojson'
	);
	const capitalCoords = new Map();
	for (const f of places.features) {
		if (f.properties.ADM0CAP !== 1) continue;
		const code = f.properties.ADM0_A3;
		if (!code || capitalCoords.has(code)) continue;
		const [lng, lat] = f.geometry.coordinates;
		capitalCoords.set(code, [lat, lng]);
	}

	/* ---------- indicadores: World Bank ---------- */
	console.log('› indicadores (World Bank)');
	const wb = {};
	const wbMeta = {};
	for (const ind of INDICATORS) {
		const url = `https://api.worldbank.org/v2/country/all/indicator/${ind.code}?format=json&per_page=20000&date=${WB_YEARS}`;
		let rows = [];
		try {
			const payload = await fetchCached(url, `wb_${ind.code}.json`);
			wbMeta[ind.key] = {
				...ind,
				source: SOURCES.indicators.name,
				sourceUrl: `https://data.worldbank.org/indicator/${ind.code}`,
				license: SOURCES.indicators.license,
				lastUpdated: payload?.[0]?.lastupdated ?? null
			};
			rows = Array.isArray(payload?.[1]) ? payload[1] : [];
		} catch (err) {
			console.warn(`  ! ${ind.code}: ${err.message}`);
			wbMeta[ind.key] = { ...ind, unavailable: true };
			await sleep(2000);
			continue;
		}

		const byIso = new Map();
		for (const r of rows) {
			if (r.value == null) continue;
			const iso = r.countryiso3code;
			if (!iso || iso.length !== 3) continue;
			const year = Number(r.date);
			const prev = byIso.get(iso);
			// mantém o ano mais recente disponível
			if (!prev || year > prev.y) byIso.set(iso, { v: r.value, y: year });
		}
		wb[ind.key] = byIso;
		const coverage = byIso.size;
		console.log(`  · ${ind.key.padEnd(18)} ${String(coverage).padStart(3)} países`);
		await sleep(1200);
	}

	/* ---------- países ---------- */
	const used = new Set();
	const usedRc = new Set();
	const countries = [];
	const features = [];

	const sorted = [...ne.features].sort((a, b) => {
		const pa = a.properties;
		const pb = b.properties;
		return (pa.POP_EST || 0) - (pb.POP_EST || 0);
	});

	for (const f of sorted) {
		const p = f.properties;
		const code = p.ADM0_A3;
		if (!code || code === '-99' || code === 'ATA') continue;
		if (p.TYPE === 'Indeterminate' && !p.ISO_A3_EH) continue;

		const alias = CODE_ALIASES[code] || {};
		const rcCode = alias.rc ?? (p.ISO_A3_EH !== '-99' ? p.ISO_A3_EH : null) ?? code;
		let fact = rcBy3.get(rcCode) || rcBy3.get(code) || rcByName.get(norm(p.NAME_EN)) || rcByName.get(norm(p.NAME)) || null;

		// fallback por nome em português
		if (!fact) {
			fact = rc.find((c) => norm(c.translations?.por?.common) === norm(p.NAME_PT)) || null;
		}

		const wbCode = alias.wb ?? (p.WB_A3 && p.WB_A3 !== '-99' ? p.WB_A3 : null);

		const namePt = (p.NAME_PT || '').trim() || p.NAME || p.NAME_EN;
		const iso2 = fact?.cca2 || (p.ISO_A2 !== '-99' ? p.ISO_A2 : '') || '';
		const iso3 = fact?.cca3 || (p.ISO_A3_EH !== '-99' ? p.ISO_A3_EH : '') || code;

		const indicators = {};
		if (wbCode) {
			for (const ind of INDICATORS) {
				const hit = wb[ind.key]?.get(wbCode);
				if (hit) indicators[ind.key] = { v: Math.round(hit.v * 100) / 100, y: hit.y };
			}
		}

		const currency = fact?.currencies
			? Object.entries(fact.currencies).map(([c, d]) => ({ code: c, name: d.name, symbol: d.symbol }))
			: [];

		const languages = fact?.languages
			? Object.values(fact.languages).map((l) => LANGUAGE_PT[l] || l)
			: [];

		const c = {
			code,
			iso2: iso2.toLowerCase(),
			iso3,
			name: namePt,
			nameEn: p.NAME_EN || p.NAME,
			official: fact?.name?.official || p.FORMAL_EN || null,
			capital: fact?.capital?.[0] || null,
			capitalLatLng: capitalCoords.get(code) || capitalCoords.get(rcCode) || null,
			continent: REGION_PT[p.CONTINENT] || p.CONTINENT || null,
			region: REGION_PT[fact?.region] || fact?.region || null,
			subregion: REGION_PT[fact?.subregion] || fact?.subregion || null,
			areaKm2: fact?.area ?? null,
			landlocked: typeof fact?.landlocked === 'boolean' ? fact.landlocked : null,
			borders: (fact?.borders || []).filter(Boolean),
			currency,
			languages,
			latlng: fact?.latlng || null,
			label: [p.LABEL_X, p.LABEL_Y],
			labelRank: p.LABELRANK ?? 10,
			unMember: fact?.unMember ?? null,
			independent: fact?.independent ?? null,
			sovereign: p.SOVEREIGNT || null,
			type: TYPE_PT[p.TYPE] || p.TYPE || null,
			status: p.TYPE,
			indicators,
			factSource: fact ? 'mledoze' : null
		};
		countries.push(c);
		if (fact) usedRc.add(fact.cca3);
		used.add(code);

		features.push({
			type: 'Feature',
			properties: {
				code,
				name: namePt,
				nameEn: c.nameEn,
				labelX: p.LABEL_X,
				labelY: p.LABEL_Y,
				labelRank: p.LABELRANK ?? 10,
				continent: c.continent,
				selectable: true
			},
			geometry: f.geometry
		});
	}

	// países do restcountries que não têm polígono em 110m (microestados, ilhas pequenas)
	const missing = rc.filter(
		(c) =>
			c.unMember &&
			!usedRc.has(c.cca3) &&
			!countries.some((x) => x.iso3 === c.cca3)
	);

	countries.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

	const coverage = {};
	for (const ind of INDICATORS) {
		coverage[ind.key] = countries.filter((c) => c.indicators[ind.key]).length;
	}

	/* ---------- físico: rios e lagos ---------- */
	console.log('› físico (rios e lagos)');
	const riversRaw = await fetchCached(
		'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_rivers_lake_centerlines.geojson',
		'ne_110m_rivers.geojson'
	);
	const lakesRaw = await fetchCached(
		'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_lakes.geojson',
		'ne_110m_lakes.geojson'
	);
	const physical = {
		rivers: {
			type: 'FeatureCollection',
			features: riversRaw.features
				.filter((f) => (f.properties.scalerank ?? 99) <= 5)
				.map((f) => ({
					type: 'Feature',
					properties: {
						name: f.properties.name_en || f.properties.name || '',
						rank: f.properties.scalerank ?? 5
					},
					geometry: f.geometry
				}))
		},
		lakes: {
			type: 'FeatureCollection',
			features: lakesRaw.features.map((f) => ({
				type: 'Feature',
				properties: {
					name: f.properties.name_en || f.properties.name || '',
					rank: f.properties.scalerank ?? 5
				},
				geometry: f.geometry
			}))
		}
	};

	await mkdir(OUT, { recursive: true });
	await writeFile(
		path.join(OUT, 'countries.json'),
		JSON.stringify({ retrieved: RETRIEVED, countries }, null, 0)
	);
	await writeFile(
		path.join(OUT, 'world.geo.json'),
		JSON.stringify({ type: 'FeatureCollection', features }, null, 0)
	);
	await writeFile(
		path.join(OUT, 'indicators.json'),
		JSON.stringify({ retrieved: RETRIEVED, indicators: wbMeta, coverage }, null, 0)
	);
	await writeFile(
		path.join(OUT, 'physical.json'),
		JSON.stringify({ retrieved: RETRIEVED, ...physical }, null, 0)
	);
	await writeFile(
		path.join(OUT, 'sources.json'),
		JSON.stringify({ retrieved: RETRIEVED, sources: SOURCES }, null, 2)
	);

	console.log(`\n✓ ${countries.length} países/territórios com polígono`);
	console.log(`✓ ${missing.length} Estados-membros da ONU sem polígono em 1:50m`);
	if (missing.length) console.log('  ' + missing.map((c) => c.name.common).join(', '));
	console.log('✓ cobertura de indicadores:');
	for (const [k, v] of Object.entries(coverage)) console.log(`  ${k.padEnd(18)} ${v}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
