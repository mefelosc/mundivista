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
		name: 'Natural Earth — Rios, lagos e litoral',
		url: 'https://www.naturalearthdata.com/downloads/',
		license: 'Domínio público',
		scale: '1:50m / 1:110m',
		note: 'Rios e lagos em 1:110m; linha de costa em 1:50m. O relevo sombreado e o modo 3D usam um modelo digital público carregado sob demanda.'
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
	{ key: 'researchShare', code: 'GB.XPD.RSDV.GD.ZS', name: 'Investimento em P&D', unit: '% do PIB', format: 'dec2', dir: 'higher' },
	{ key: 'gini', code: 'SI.POV.GINI', name: 'Índice de Gini', unit: 'índice 0–100', format: 'dec1', dir: 'lower' },
	{ key: 'unemployment', code: 'SL.UEM.TOTL.ZS', name: 'Desemprego', unit: '% da força de trabalho', format: 'dec1', dir: 'lower' },
	{ key: 'inflation', code: 'FP.CPI.TOTL.ZG', name: 'Inflação (IPC)', unit: '% ao ano', format: 'dec1', dir: 'lower' },
	{ key: 'debtShare', code: 'GC.DOD.TOTL.GD.ZS', name: 'Dívida do governo', unit: '% do PIB', format: 'dec1', dir: 'lower' },
	{ key: 'co2Total', code: 'EN.GHG.CO2.MT.CE.AR5', name: 'Emissões de CO₂', unit: 'Mt CO₂', format: 'dec1', dir: 'lower' },
	{ key: 'energyUse', code: 'EG.USE.PCAP.KG.OE', name: 'Consumo de energia', unit: 'kg eq. petróleo por pessoa', format: 'int', dir: 'higher' },
	{ key: 'tourism', code: 'ST.INT.ARVL', name: 'Chegadas de turistas', unit: 'pessoas por ano', format: 'int', dir: 'higher' },
	{ key: 'schoolEnrollment', code: 'SE.SEC.ENRR', name: 'Matrícula no ensino médio', unit: '% do grupo etário', format: 'dec1', dir: 'higher' },
	{ key: 'healthShare', code: 'SH.XPD.CHEX.GD.ZS', name: 'Gastos com saúde', unit: '% do PIB', format: 'dec1', dir: 'higher' },
	{ key: 'govEffectiveness', code: 'GOV_WGI_GE.EST', name: 'Efetividade do governo (WGI)', unit: 'escore −2,5 a 2,5', format: 'dec2', dir: 'higher' },
	{ key: 'controlCorruption', code: 'GOV_WGI_CC.EST', name: 'Controle da corrupção (WGI)', unit: 'escore −2,5 a 2,5', format: 'dec2', dir: 'higher' },
	{ key: 'ruleOfLaw', code: 'GOV_WGI_RL.EST', name: 'Estado de direito (WGI)', unit: 'escore −2,5 a 2,5', format: 'dec2', dir: 'higher' }
];

const WB_YEARS = '2016:2025';

/* Hachura apenas onde soberania ou traçado são disputados de forma documentada.
   Israel não entra: o Estado é reconhecido; o que se disputa são fronteiras. */
const DISPUTED_CODES = new Set(['KOS', 'PSX', 'SAH', 'FLK', 'KAS', 'IOT']);

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

async function fetchCached(url, file, { json = true, attempts = 6 } = {}) {
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
			if (i < attempts) await sleep(4000 * i);
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

function ringsOfGeometry(geometry) {
	if (geometry.type === 'Polygon') return geometry.coordinates;
	if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
	return [];
}

/** Projeção equirretangular simples para silhuetas de jogo. */
function simplifyRing(points, tolerance) {
	if (points.length < 3) return points;
	const squared = tolerance * tolerance;
	const keep = new Uint8Array(points.length);
	keep[0] = 1;
	keep[points.length - 1] = 1;
	const stack = [[0, points.length - 1]];

	const distanceSq = (point, start, end) => {
		let x = start[0];
		let y = start[1];
		let dx = end[0] - x;
		let dy = end[1] - y;
		if (dx !== 0 || dy !== 0) {
			const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
			if (t > 1) {
				x = end[0];
				y = end[1];
			} else if (t > 0) {
				x += dx * t;
				y += dy * t;
			}
		}
		dx = point[0] - x;
		dy = point[1] - y;
		return dx * dx + dy * dy;
	};

	while (stack.length) {
		const [first, last] = stack.pop();
		let index = -1;
		let maxDistance = squared;
		for (let i = first + 1; i < last; i++) {
			const distance = distanceSq(points[i], points[first], points[last]);
			if (distance > maxDistance) {
				index = i;
				maxDistance = distance;
			}
		}
		if (index !== -1) {
			keep[index] = 1;
			stack.push([first, index], [index, last]);
		}
	}
	return points.filter((_, i) => keep[i]);
}

function silhouettePath(geometry, { tolerance = 0, minRingArea = 0 } = {}) {
	let rings = [];
	if (geometry.type === 'Polygon') rings = geometry.coordinates;
	else if (geometry.type === 'MultiPolygon') rings = geometry.coordinates.flat();
	else return null;

	const projected = [];
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;

	for (const ring of rings) {
		if (ring.length < 3) continue;
		if (minRingArea > 0) {
			const lons = ring.map((point) => point[0]);
			const lats = ring.map((point) => point[1]);
			const area = (Math.max(...lons) - Math.min(...lons)) * (Math.max(...lats) - Math.min(...lats));
			if (area < minRingArea) continue;
		}
		// Costura do antimeridiano: desloca o anel para perto do primeiro ponto.
		const base = ring[0][0];
		const shifted = ring.map(([lon, lat]) => {
			let degrees = lon;
			while (degrees - base > 180) degrees -= 360;
			while (degrees - base < -180) degrees += 360;
			const phi = (lat * Math.PI) / 180;
			const x = (degrees * Math.PI) / 180;
			const y = -Math.log(Math.tan(Math.PI / 4 + phi / 2));
			return [x, y];
		});
		for (const [x, y] of shifted) {
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
		projected.push(shifted);
	}
	if (!projected.length || !Number.isFinite(minX)) return null;

	const spanX = Math.max(maxX - minX, 0.0001);
	const spanY = Math.max(maxY - minY, 0.0001);
	const scale = 100 / Math.max(spanX, spanY);
	const offX = (100 - spanX * scale) / 2;
	const offY = (100 - spanY * scale) / 2;

	const effectiveTolerance = tolerance || Math.max(spanX, spanY) / 520;

	return projected
		.map((ring) => {
			const pts = simplifyRing(ring, effectiveTolerance).map(([x, y]) => {
				const px = offX + (x - minX) * scale;
				const py = offY + (y - minY) * scale;
				return `${px.toFixed(1)},${py.toFixed(1)}`;
			});
			return `M${pts.join('L')}Z`;
		})
		.join('');
}

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
	const wbSeries = {};
	const wbMeta = {};
	for (const ind of INDICATORS) {
		const url = `https://api.worldbank.org/v2/country/all/indicator/${ind.code}?format=json&per_page=20000&date=${WB_YEARS}`;
		let rows = [];
		try {
			const payload = await fetchCached(url, `wb_${ind.code}.json`);
			if (!Array.isArray(payload?.[1])) {
				throw new Error(payload?.message?.[0]?.value ?? 'resposta sem série');
			}
			wbMeta[ind.key] = {
				...ind,
				source: SOURCES.indicators.name,
				sourceUrl: `https://data.worldbank.org/indicator/${ind.code}`,
				license: SOURCES.indicators.license,
				lastUpdated: payload?.[0]?.lastupdated ?? null
			};
			rows = payload[1];
		} catch (err) {
			console.warn(`  ! ${ind.code}: ${err.message}`);
			wbMeta[ind.key] = { ...ind, unavailable: true };
			await sleep(3000);
			continue;
		}

		const byIso = new Map();
		const seriesByIso = new Map();
		for (const r of rows) {
			if (r.value == null) continue;
			const iso = r.countryiso3code;
			if (!iso || iso.length !== 3) continue;
			const year = Number(r.date);
			const prev = byIso.get(iso);
			// mantém o ano mais recente disponível
			if (!prev || year > prev.y) byIso.set(iso, { v: r.value, y: year });
			const series = seriesByIso.get(iso) ?? [];
			series.push([year, Math.round(r.value * 100) / 100]);
			seriesByIso.set(iso, series);
		}
		for (const series of seriesByIso.values()) series.sort((a, b) => a[0] - b[0]);
		wb[ind.key] = byIso;
		wbSeries[ind.key] = seriesByIso;
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
				if (!hit) continue;
				const series = wbSeries[ind.key]?.get(wbCode) ?? [];
				indicators[ind.key] =
					series.length >= 2
						? { v: Math.round(hit.v * 100) / 100, y: hit.y, s: series }
						: { v: Math.round(hit.v * 100) / 100, y: hit.y };
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
				selectable: true,
				status: c.status,
				disputed: DISPUTED_CODES.has(code)
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
	const coastlineRaw = await fetchCached(
		'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_coastline.geojson',
		'ne_50m_coastline.geojson'
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
		},
		coastline: {
			type: 'FeatureCollection',
			features: coastlineRaw.features.map((f) => ({
				type: 'Feature',
				properties: {},
				geometry: f.geometry
			}))
		}
	};

	/* ---------- cidades principais (pontos, não limites urbanos) ---------- */
	console.log('› cidades principais (Natural Earth)');
	const areaByCode = new Map(countries.map((c) => [c.code, c.areaKm2 ?? Infinity]));
	const byCountryCities = new Map();
	for (const f of places.features) {
		const p = f.properties;
		const code = p.ADM0_A3;
		if (!code || code === '-99') continue;
		const pop = p.POP_MAX ?? 0;
		const capital = p.ADM0CAP === 1;
		if (pop < 500_000 && !capital) continue;
		const [lng, lat] = f.geometry.coordinates;
		const row = {
			name: p.NAME_PT || p.NAME_EN || p.NAME || '',
			nameEn: p.NAME_EN || p.NAME || '',
			pop,
			code,
			capital,
			micro: (areaByCode.get(code) ?? Infinity) < 15_000,
			lat: Math.round(lat * 10000) / 10000,
			lng: Math.round(lng * 10000) / 10000,
			minZoom: pop >= 10_000_000 ? 0 : pop >= 5_000_000 ? 0.8 : pop >= 2_000_000 ? 1.6 : 2.4
		};
		const list = byCountryCities.get(code) ?? [];
		list.push(row);
		byCountryCities.set(code, list);
	}
	const cityFeatures = [];
	for (const list of byCountryCities.values()) {
		list.sort((a, b) => Number(b.capital) - Number(a.capital) || b.pop - a.pop);
		const chosen = list.filter((city) => city.capital).slice(0, 1).concat(
			list.filter((city) => !city.capital).slice(0, 4)
		);
		for (const city of chosen.slice(0, 5)) {
			cityFeatures.push({
				type: 'Feature',
				properties: {
					name: city.name,
					nameEn: city.nameEn,
					pop: city.pop,
					code: city.code,
					capital: city.capital,
					micro: city.micro,
					minZoom: city.minZoom
				},
				geometry: { type: 'Point', coordinates: [city.lng, city.lat] }
			});
		}
	}
	const cities = { type: 'FeatureCollection', features: cityFeatures };

	/* ---------- silhuetas para o jogo de reconhecimento ---------- */
	console.log('› silhuetas dos países');
	const silhouettes = {};
	for (const c of countries) {
		if (!c.unMember || (c.areaKm2 ?? 0) < 20_000) continue;
		const feature = features.find((f) => f.properties.code === c.code);
		if (!feature?.geometry) continue;
		const d = silhouettePath(feature.geometry);
		if (d) silhouettes[c.code] = d;
	}

	const worldRings = features.flatMap((f) => ringsOfGeometry(f.geometry));
	const worldOutline = silhouettePath(
		{ type: 'MultiPolygon', coordinates: worldRings.map((ring) => [ring]) },
		{ tolerance: 0.012, minRingArea: 0.08 }
	);

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
		path.join(OUT, 'cities.json'),
		JSON.stringify({ retrieved: RETRIEVED, cities }, null, 0)
	);
	await writeFile(
		path.join(OUT, 'silhouettes.json'),
		JSON.stringify({ retrieved: RETRIEVED, silhouettes }, null, 0)
	);
	await writeFile(
		path.join(OUT, 'world-silhouette.json'),
		JSON.stringify({ retrieved: RETRIEVED, path: worldOutline }, null, 0)
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
