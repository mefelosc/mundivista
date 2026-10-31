import { describe, expect, it } from 'vitest';
import { countries, countryByCode, indicatorMeta, manifest, retrievedAt } from './countries';
import { organizations } from './organizations';
import { snippets } from './snippets';
import { historicalRecords } from './historical';

describe('integridade dos dados', () => {
	it('carrega países com identificadores e rótulos', () => {
		expect(countries.length).toBeGreaterThan(190);
		for (const country of countries) {
			expect(country.code).toMatch(/^[A-Z]{3}$/);
			expect(country.name.length).toBeGreaterThan(1);
			expect(Number.isFinite(country.label[0])).toBe(true);
			expect(Number.isFinite(country.label[1])).toBe(true);
		}
	});

	it('não tem códigos duplicados', () => {
		expect(new Set(countries.map((c) => c.code)).size).toBe(countries.length);
	});

	it('todo indicador tem fonte, licença e ano', () => {
		for (const meta of Object.values(indicatorMeta)) {
			expect(meta.source).toContain('World Bank');
			expect(meta.license).toBe('CC BY 4.0');
			expect(meta.sourceUrl.startsWith('https://')).toBe(true);
		}
		for (const country of countries) {
			for (const [key, value] of Object.entries(country.indicators)) {
				expect(indicatorMeta[key as keyof typeof indicatorMeta], key).toBeTruthy();
				expect(Number.isFinite(value.v)).toBe(true);
				expect(value.y).toBeGreaterThanOrEqual(2015);
				expect(value.y).toBeLessThanOrEqual(new Date().getFullYear() + 1);
			}
		}
	});

	it('registra a data de extração e as fontes', () => {
		expect(retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(manifest.sources.boundaries.license).toBe('Domínio público');
		expect(manifest.sources.indicators.license).toBe('CC BY 4.0');
	});

	it('membros de organizações existem no mapa', () => {
		for (const org of organizations) {
			expect(org.source.url.startsWith('https://')).toBe(true);
			expect(org.members.length).toBeGreaterThan(0);
			for (const code of org.members) {
				expect(countryByCode.has(code), `${org.id}: ${code}`).toBe(true);
			}
		}
	});

	it('snippets têm fonte e corpo', () => {
		expect(snippets.length).toBeGreaterThan(15);
		for (const snippet of snippets) {
			expect(snippet.body.length).toBeGreaterThan(80);
			expect(snippet.sourceUrl.startsWith('https://')).toBe(true);
			for (const code of snippet.countries) {
				expect(countryByCode.has(code), `${snippet.id}: ${code}`).toBe(true);
			}
		}
	});

	it('registros históricos apontam para países existentes', () => {
		for (const record of historicalRecords) {
			expect(countryByCode.has(record.code), record.code).toBe(true);
			if (record.independence) {
				expect(record.independence).toBeGreaterThan(800);
				expect(record.independence).toBeLessThanOrEqual(new Date().getFullYear());
			}
		}
	});
});
