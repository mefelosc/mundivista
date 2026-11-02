#!/usr/bin/env node
/**
 * Gera resumos por tema a partir da Wikipédia (CC BY-SA 4.0).
 *
 * Uso: node tools/build-summaries.mjs [--refresh]
 *
 * O texto é recortado do primeiro parágrafo da seção correspondente e
 * armazenado com título, URL, data de extração e licença. Quando a seção não
 * existe, o campo fica vazio e o dossiê usa a síntese baseada em dados.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, '.cache', 'wikipedia');
const OUT = path.join(ROOT, 'src/lib/data/generated/summaries.json');
const REFRESH = process.argv.includes('--refresh');
const RETRIEVED = new Date().toISOString().slice(0, 10);

const THEMES = ['overview', 'history', 'geography', 'demography', 'economy', 'geopolitics'];
const HEADINGS = {
	history: ['história', 'history'],
	geography: ['geografia', 'geography'],
	demography: ['demografia', 'demographics', 'demography'],
	economy: ['economia', 'economy'],
	geopolitics: [
		'política externa',
		'foreign relations',
		'geopolítica',
		'geopolitics',
		'governo e política',
		'governo',
		'política',
		'government and politics',
		'politics',
		'government'
	]
};

const SOURCE = {
	name: 'Wikipédia',
	url: 'https://pt.wikipedia.org',
	license: 'CC BY-SA 4.0',
	note: 'Resumos adaptados do primeiro parágrafo das seções de cada verbete. O texto original e a atribuição estão disponíveis no link de cada resumo.'
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(value) {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

function cleanText(value) {
	return value
		.replace(/\[[^\]]*\]/g, '')
		.replace(/\(\s*\)/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function shorten(text, max = 430) {
	const clean = cleanText(text);
	if (clean.length <= max) return clean;
	const cut = clean.slice(0, max);
	const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
	if (end > 140) return cut.slice(0, end + 1).trim();
	return `${cut.replace(/[,;:\s]+$/, '')}…`;
}

function parseSections(extract) {
	const lines = extract.split('\n');
	const sections = [];
	let current = { level: 0, title: '', lines: [] };
	for (const line of lines) {
		const match = line.match(/^(={2,6})\s*(.+?)\s*\1$/);
		if (match) {
			sections.push(current);
			current = { level: match[1].length, title: match[2].trim(), lines: [] };
			continue;
		}
		current.lines.push(line);
	}
	sections.push(current);
	return sections;
}

function firstParagraph(lines) {
	const blocks = lines.join('\n').split(/\n\s*\n/);
	for (const block of blocks) {
		const paragraph = cleanText(block);
		if (paragraph.length < 80) continue;
		if (/^[*#|>]/.test(paragraph)) continue;
		if (/^(Ver também|See also|Referências|References|Ligações externas|External links)/i.test(paragraph)) continue;
		return paragraph;
	}
	return '';
}

function sectionText(sections, startIndex) {
	const section = sections[startIndex];
	if (!section) return '';
	const own = firstParagraph(section.lines);
	if (own) return own;
	for (let i = startIndex + 1; i < sections.length; i++) {
		if (sections[i].level <= section.level) break;
		const text = firstParagraph(sections[i].lines);
		if (text) return text;
	}
	return '';
}

function findSection(sections, theme) {
	const aliases = HEADINGS[theme] ?? [];
	for (const alias of aliases) {
		const index = sections.findIndex(
			(section) => section.level > 0 && normalize(section.title) === normalize(alias)
		);
		if (index >= 0) {
			const text = sectionText(sections, index);
			if (text) return text;
		}
	}
	return '';
}

function buildSummaries(extract, sectionFormat) {
	const sections = parseSections(extract);
	const lead = firstParagraph(sections[0]?.lines ?? []);
	const out = {};
	for (const theme of THEMES) {
		if (theme === 'overview') {
			out.overview = shorten(lead, 520);
			continue;
		}
		out[theme] = shorten(findSection(sections, theme), 430);
	}
	return out;
}

async function fetchExtract(lang, title) {
	const slug = title.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 80);
	const file = path.join(CACHE, `${lang}_${slug}.json`);
	if (existsSync(file) && !REFRESH) {
		const cached = JSON.parse(await readFile(file, 'utf8'));
		return cached;
	}
	const url =
		`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(title)}`;
	let result = { title: null, extract: null };
	for (let attempt = 1; attempt <= 4; attempt++) {
		try {
			const res = await fetch(url, {
				headers: { 'user-agent': 'mundivista-summaries/1.0 (educational atlas)' }
			});
			if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
			const data = await res.json();
			const page = data?.query?.pages?.[0];
			if (page && !page.missing && page.extract) {
				result = { title: page.title, extract: page.extract };
			}
			break;
		} catch (error) {
			if (attempt === 4) {
				console.warn(`  ! ${lang}/${title}: ${error.message}`);
				break;
			}
			await sleep(1200 * attempt);
		}
	}
	if (!existsSync(CACHE)) await mkdir(CACHE, { recursive: true });
	await writeFile(file, JSON.stringify(result));
	return result;
}

async function fetchCountry(lang, country) {
	const names = [
		lang === 'pt' ? country.name : country.nameEn,
		lang === 'pt' ? `${country.name} (país)` : `${country.nameEn} (country)`,
		lang === 'pt' ? `${country.name} (território)` : `${country.nameEn} (territory)`,
		lang === 'pt' ? country.nameEn : country.name
	].filter(Boolean);
	const seen = new Set();
	for (const title of names) {
		if (seen.has(title)) continue;
		seen.add(title);
		const result = await fetchExtract(lang, title);
		if (result.extract) return { ...result, lang };
	}
	return { title: null, extract: null, lang };
}

async function main() {
	const raw = JSON.parse(await readFile(path.join(ROOT, 'src/lib/data/generated/countries.json'), 'utf8'));
	const countries = raw.countries;
	const output = { retrieved: RETRIEVED, source: SOURCE, countries: {} };
	console.log(`› Wikipédia: ${countries.length} entidades × 2 idiomas`);

	for (let i = 0; i < countries.length; i++) {
		const country = countries[i];
		const entry = { title: { pt: null, en: null }, sections: { pt: {}, en: {} } };
		for (const lang of ['pt', 'en']) {
			const result = await fetchCountry(lang, country);
			if (result.extract) {
				entry.title[lang] = result.title;
				entry.sections[lang] = buildSummaries(result.extract);
			}
			await sleep(120);
		}
		output.countries[country.code] = entry;
		if ((i + 1) % 20 === 0 || i === countries.length - 1) {
			const covered = Object.values(output.countries).filter((item) => item.title.pt || item.title.en).length;
			console.log(`  · ${i + 1}/${countries.length} (${covered} com resumo)`);
		}
	}

	// A fonte muda conforme o idioma do verbete; o link do dossiê é montado no app.
	await mkdir(path.dirname(OUT), { recursive: true });
	await writeFile(OUT, JSON.stringify(output, null, 0));
	console.log(`✓ ${Object.keys(output.countries).length} resumos em ${OUT}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
