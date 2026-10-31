#!/usr/bin/env node
/**
 * Gera as unidades administrativas de primeiro nível (estados, províncias,
 * distritos) a partir do Natural Earth 1:10m, um arquivo por país.
 *
 * Uso:  node tools/build-subdivisions.mjs [--refresh]
 *
 * O recorte é deliberadamente grosseiro: o destino é uma sobreposição de
 * leitura no mapa político, não uma base cartográfica de precisão. Cada
 * geometria é simplificada e arredondada para 4 casas decimais.
 *
 * Saída: src/lib/data/generated/subdivisions/{ADM0_A3}.json
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, '.cache');
const OUT = path.join(ROOT, 'src/lib/data/generated/subdivisions');
const REFRESH = process.argv.includes('--refresh');
const RETRIEVED = new Date().toISOString().slice(0, 10);

const SOURCE = {
	name: 'Natural Earth — Admin 1 States/Provinces (1:10m)',
	url: 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/',
	license: 'Domínio público',
	scale: '1:10m',
	note: 'Unidades administrativas de primeiro nível. O nível disponível varia por país: estados, províncias, distritos ou municípios. Geometria simplificada para leitura no mapa.'
};

/* Correções pontuais de nomes truncados na tradução do Natural Earth. */
const NAME_OVERRIDES = {
	'BR-DF': 'Distrito Federal'
};

const TYPE_PT = {
	State: 'Estado',
	Province: 'Província',
	Region: 'Região',
	District: 'Distrito',
	County: 'Condado',
	Department: 'Departamento',
	Commune: 'Comuna',
	Municipality: 'Município',
	Prefecture: 'Prefeitura',
	'Metropolitan department': 'Departamento metropolitano',
	'Statistical Region': 'Região estatística',
	Governorate: 'Governorado',
	Parish: 'Freguesia',
	'Unitary Authority': 'Autoridade unitária',
	'Autonomous Community': 'Comunidade autônoma',
	Canton: 'Cantão',
	'Metropolitan Borough': 'Distrito metropolitano',
	'Highly Urbanized City': 'Cidade altamente urbanizada',
	City: 'Cidade',
	'Autonomous Province': 'Província autônoma',
	'London Borough': 'Distrito de Londres',
	'Administrative County': 'Condado administrativo',
	'Unitary District': 'Distrito unitário',
	Division: 'Divisão',
	'Urban county': 'Condado urbano',
	Republic: 'República',
	Atoll: 'Atol',
	Territory: 'Território',
	Voivodeship: 'Voivodia',
	'Administrative State': 'Estado administrativo',
	Quarter: 'Bairro',
	'Regional Council': 'Conselho regional',
	'Administrative Zone': 'Zona administrativa',
	'Union Territory': 'Território da União',
	Emirate: 'Emirado',
	'Special Municipality': 'Município especial',
	'Republican City': 'Cidade republicana',
	'Autonomous Region': 'Região autônoma',
	'Metropolitan City': 'Cidade metropolitana',
	'Federal District': 'Distrito federal',
	'Overseas department': 'Departamento ultramarino',
	Commissiary: 'Comissariado',
	'Independent Component City': 'Cidade independente',
	Dependency: 'Dependência',
	Intendancy: 'Intendência',
	'Autonomous Republic': 'República autônoma',
	'Capital District': 'Distrito capital',
	Capital: 'Capital',
	'Indigenous Territory': 'Território indígena',
	'Préfecture': 'Prefeitura',
	'Independent City': 'Cidade independente',
	'Provincial City': 'Cidade provincial',
	'Federal City': 'Cidade federal',
	'Federal Territory': 'Território federal',
	Town: 'Vila',
	'Autonomous City': 'Cidade autônoma',
	'Centrally Administered Area': 'Área de administração central',
	'National Capital Area': 'Área da capital nacional',
	'Economic Prefecture': 'Prefeitura econômica',
	'Urban Prefecture': 'Prefeitura urbana',
	'Autonomous Territory': 'Território autônomo',
	'National Territory': 'Território nacional',
	'Capital Region': 'Região capital',
	'Special district': 'Distrito especial',
	'Special region': 'Região especial',
	Departamento: 'Departamento',
	'Autonomous Sector': 'Setor autônomo',
	Metropolis: 'Metrópole',
	Circuit: 'Circuito',
	Principality: 'Principado',
	'Township': 'Município',
	'Special City': 'Cidade especial',
	'Capital City': 'Cidade capital',
	'Kingdom': 'Reino',
	'Island Area': 'Área insular'
};

function translateType(raw) {
	if (!raw) return 'Unidade administrativa';
	const parts = String(raw)
		.split('|')
		.map((part) => part.trim())
		.filter(Boolean);
	const translated = [...new Set(parts.map((part) => TYPE_PT[part]).filter(Boolean))];
	if (translated.length) return translated.join(' / ');
	return 'Unidade administrativa';
}

/* Douglas–Peucker em coordenadas geográficas. */
function simplify(points, tolerance) {
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
		let farthest = squared;
		for (let i = first + 1; i < last; i++) {
			const distance = distanceSq(points[i], points[first], points[last]);
			if (distance > farthest) {
				index = i;
				farthest = distance;
			}
		}
		if (index !== -1) {
			keep[index] = 1;
			stack.push([first, index], [index, last]);
		}
	}
	return points.filter((_, i) => keep[i]);
}

const round = (value) => Math.round(value * 10000) / 10000;

function simplifyRing(ring, tolerance) {
	const simplified = simplify(ring, tolerance).map(([lng, lat]) => [round(lng), round(lat)]);
	// Remove pontos repetidos criados pelo arredondamento.
	const clean = simplified.filter(
		(point, index) =>
			index === 0 ||
			point[0] !== simplified[index - 1][0] ||
			point[1] !== simplified[index - 1][1]
	);
	if (clean.length >= 4) {
		const first = clean[0];
		const last = clean[clean.length - 1];
		if (first[0] === last[0] && first[1] === last[1]) clean.pop();
	}
	return clean;
}

function simplifyGeometry(geometry, tolerance) {
	if (geometry.type === 'Polygon') {
		const rings = geometry.coordinates.map((ring) => simplifyRing(ring, tolerance));
		if (!rings[0] || rings[0].length < 3) return null;
		return { type: 'Polygon', coordinates: rings.filter((ring) => ring.length >= 3) };
	}
	if (geometry.type === 'MultiPolygon') {
		const polygons = geometry.coordinates
			.map((polygon) =>
				polygon
					.map((ring) => simplifyRing(ring, tolerance))
					.filter((ring) => ring.length >= 3)
			)
			.filter((polygon) => polygon.length && polygon[0].length >= 3);
		if (!polygons.length) return null;
		return { type: 'MultiPolygon', coordinates: polygons };
	}
	return null;
}

function countPoints(geometry) {
	if (geometry.type === 'Polygon') return geometry.coordinates.reduce((n, ring) => n + ring.length, 0);
	if (geometry.type === 'MultiPolygon')
		return geometry.coordinates.reduce(
			(n, polygon) => n + polygon.reduce((m, ring) => m + ring.length, 0),
			0
		);
	return 0;
}

async function fetchSource() {
	if (!existsSync(CACHE)) await mkdir(CACHE, { recursive: true });
	const file = path.join(CACHE, 'ne_10m_admin_1.geojson');
	if (existsSync(file) && !REFRESH) return JSON.parse(await readFile(file, 'utf8'));

	const url =
		'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
	console.log('› baixando Natural Earth 1:10m (≈40 MB, uma vez)');
	const res = await fetch(url, { headers: { 'user-agent': 'mundivista-data-pipeline/1.0' } });
	if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
	const text = await res.text();
	await writeFile(file, text);
	return JSON.parse(text);
}

async function main() {
	const raw = await fetchSource();
	console.log(`› ${raw.features.length} unidades administrativas`);

	// Só gera países que existem no atlas (evita recortes fora do mapa).
	const countriesFile = path.join(ROOT, 'src/lib/data/generated/countries.json');
	let allowed = null;
	if (existsSync(countriesFile)) {
		const data = JSON.parse(await readFile(countriesFile, 'utf8'));
		allowed = new Set(data.countries.map((country) => country.code));
	}

	/** @type {Map<string, any[]>} */
	const byCountry = new Map();
	for (const feature of raw.features) {
		const props = feature.properties ?? {};
		const code = props.adm0_a3;
		if (!code || code === '-99') continue;
		if (allowed && !allowed.has(code)) continue;
		const label =
			Number.isFinite(props.longitude) && Number.isFinite(props.latitude)
				? [round(props.longitude), round(props.latitude)]
				: null;
		const list = byCountry.get(code) ?? [];
		list.push({
			type: 'Feature',
			properties: {
				id: props.adm1_code || `${code}-${list.length}`,
				adm0: code,
				name: NAME_OVERRIDES[props.iso_3166_2] ?? (props.name_pt || props.name || props.name_en || '').trim(),
				type: translateType(props.type_en || props.type),
				iso: props.iso_3166_2 ?? null,
				label
			},
			geometry: feature.geometry
		});
		byCountry.set(code, list);
	}

	await rm(OUT, { recursive: true, force: true });
	await mkdir(OUT, { recursive: true });

	let written = 0;
	let points = 0;
	for (const [code, features] of [...byCountry.entries()].sort(([a], [b]) => a.localeCompare(b))) {
		const total = features.reduce((n, feature) => n + countPoints(feature.geometry), 0);
		// Países extensos perdem detalhe que não se lê na sobreposição.
		const tolerance = total > 30000 ? 0.03 : total > 12000 ? 0.02 : 0.01;
		const simplified = [];
		for (const feature of features) {
			if (!feature.properties.name) continue;
			const geometry = simplifyGeometry(feature.geometry, tolerance);
			if (!geometry) continue;
			simplified.push({ ...feature, geometry });
		}
		if (!simplified.length) continue;
		simplified.sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'pt-BR'));
		const output = {
			retrieved: RETRIEVED,
			source: SOURCE,
			code,
			count: simplified.length,
			type: 'FeatureCollection',
			features: simplified
		};
		await writeFile(path.join(OUT, `${code}.json`), JSON.stringify(output));
		written += 1;
		points += simplified.reduce((n, feature) => n + countPoints(feature.geometry), 0);
	}

	console.log(`✓ ${written} países com unidades de primeiro nível`);
	console.log(`✓ ${points.toLocaleString('pt-BR')} pontos no total`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
