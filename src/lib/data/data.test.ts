import { describe, expect, it } from 'vitest';
import {
	countries,
	countryByCode,
	countryCount,
	getCountry,
	isCountry,
	sovereignCountry,
	dependencyLabel,
	indicatorMeta,
	manifest,
	retrievedAt,
	territoryCount
} from './countries';
import { organizations, organizationById } from './organizations';
import { snippets } from './snippets';
import { historicalRecords } from './historical';
import { cityPoints } from './cities';
import { silhouettes } from './silhouettes';
import { worldOutline } from './world-silhouette';
import { timelineEvents, TIMELINE_END, TIMELINE_START } from './timeline';
import { disputedCodes, disputedTerritories } from './disputed';
import { marineLabels } from './marine-labels';
import { hasSubdivisions, subdivisionCountries } from './subdivisions';

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

	it('séries temporais são ordenadas e terminam no valor exibido', () => {
		for (const country of countries) {
			for (const [key, value] of Object.entries(country.indicators)) {
				if (!value.s) continue;
				expect(value.s.length, `${country.code}/${key}`).toBeGreaterThanOrEqual(2);
				const years = value.s.map(([year]) => year);
				expect(years).toEqual([...years].sort((a, b) => a - b));
				const last = value.s[value.s.length - 1];
				expect(last[0]).toBe(value.y);
				expect(last[1]).toBe(value.v);
			}
		}
	});

	it('tem pelo menos 30 indicadores com metadados', () => {
		expect(Object.keys(indicatorMeta).length).toBeGreaterThanOrEqual(30);
	});

	it('cidades têm coordenadas válidas e código existente', () => {
		expect(cityPoints.length).toBeGreaterThan(150);
		for (const city of cityPoints) {
			const [lng, lat] = city.geometry.coordinates;
			expect(lng).toBeGreaterThanOrEqual(-180);
			expect(lng).toBeLessThanOrEqual(180);
			expect(lat).toBeGreaterThanOrEqual(-90);
			expect(lat).toBeLessThanOrEqual(90);
			expect(countryByCode.has(city.properties.code), city.properties.name).toBe(true);
		}
	});

	it('silhuetas e contorno do mundo são caminhos SVG', () => {
		expect(worldOutline.startsWith('M')).toBe(true);
		expect(worldOutline.length).toBeGreaterThan(5000);
		expect(Object.keys(silhouettes).length).toBeGreaterThan(80);
		for (const [code, path] of Object.entries(silhouettes)) {
			expect(countryByCode.has(code), code).toBe(true);
			expect(path.startsWith('M'), code).toBe(true);
			expect(path.length, code).toBeGreaterThan(20);
		}
	});

	it('alias de código resolve o polígono correto', () => {
		expect(getCountry('PSE')?.code).toBe('PSX');
		expect(getCountry('XKX')?.code).toBe('KOS');
		expect(getCountry('SSD')?.code).toBe('SDS');
	});

	it('códigos históricos do Banco Mundial são resolvidos', () => {
		for (const code of ['COD', 'NOR', 'ROU', 'TLS', 'PSX', 'NRU']) {
			expect(getCountry(code)?.indicators.population, code).toBeTruthy();
		}
	});

	it('Somalilândia não herda os dados da Somália', () => {
		const somaliland = getCountry('SOL');
		const somalia = getCountry('SOM');
		expect(somaliland?.capital).toBe('Hargeisa');
		expect(somaliland?.areaKm2).not.toBe(somalia?.areaKm2);
		expect(somaliland?.indicators.population).toBeUndefined();
		expect(somaliland?.unMember).toBe(false);
	});

	it('membros da ONU e Estados observadores têm população', () => {
		const missing = countries.filter((country) => country.unMember && !country.indicators.population);
		expect(missing.map((country) => country.code)).toEqual([]);
	});

	it('territórios fora do Banco Mundial usam a UN WPP 2024', () => {
		for (const code of ['TWN', 'VAT', 'AIA', 'COK', 'SAH']) {
			const value = getCountry(code)?.indicators.population;
			expect(value, code).toBeTruthy();
			expect(value?.source, code).toBe('UN WPP 2024');
			expect(value?.y, code).toBeGreaterThanOrEqual(2016);
		}
		expect(manifest.sources.population.license).toBe('CC BY 3.0 IGO');
	});

	it('separa países de territórios', () => {
		expect(countryCount + territoryCount).toBe(countries.length);
		expect(countryCount).toBeGreaterThan(190);
		expect(territoryCount).toBeGreaterThan(30);
		for (const code of ['TWN', 'KOS', 'PSX', 'VAT', 'BRA']) {
			expect(isCountry(getCountry(code)!), code).toBe(true);
		}
		for (const code of ['GRL', 'ALD', 'FLK', 'SOL', 'SAH']) {
			expect(isCountry(getCountry(code)!), code).toBe(false);
		}
	});

	it('rótulos marinhos têm nome, coordenadas e zoom', () => {
		expect(marineLabels.length).toBeGreaterThan(40);
		for (const label of marineLabels) {
			expect(label.name.length).toBeGreaterThan(2);
			expect(label.lat).toBeGreaterThanOrEqual(-90);
			expect(label.lat).toBeLessThanOrEqual(90);
			expect(label.lng).toBeGreaterThanOrEqual(-180);
			expect(label.lng).toBeLessThanOrEqual(180);
			expect(label.minZoom).toBeGreaterThanOrEqual(0);
		}
	});

	it('tem unidades administrativas geradas por país', () => {
		expect(subdivisionCountries.length).toBeGreaterThan(150);
		expect(hasSubdivisions('BRA')).toBe(true);
		expect(hasSubdivisions('USA')).toBe(true);
		expect(hasSubdivisions('FRA')).toBe(true);
		expect(hasSubdivisions('ATA')).toBe(false);
	});

	it('territórios dependentes apontam para o soberano', () => {
		const greenland = getCountry('GRL');
		expect(greenland).toBeTruthy();
		expect(sovereignCountry(greenland!)?.code).toBe('DNK');
		expect(dependencyLabel(greenland!)).toContain('Dinamarca');
	});

	it('territórios disputados têm nota, fonte e polígono', () => {
		expect(disputedCodes.length).toBeGreaterThanOrEqual(5);
		for (const code of disputedCodes) {
			const info = disputedTerritories[code];
			expect(countryByCode.has(code), code).toBe(true);
			expect(info.note.length).toBeGreaterThan(50);
			expect(info.source.url.startsWith('https://')).toBe(true);
		}
	});

	it('linha do tempo é ordenada, datada e cita organizações existentes', () => {
		const years = timelineEvents.map((event) => event.year);
		expect(years).toEqual([...years].sort((a, b) => a - b));
		for (const event of timelineEvents) {
			expect(event.year).toBeGreaterThanOrEqual(TIMELINE_START);
			expect(event.year).toBeLessThanOrEqual(TIMELINE_END);
			expect(event.source.url.startsWith('https://')).toBe(true);
			expect(event.detail.length).toBeGreaterThan(20);
			for (const org of event.orgs ?? []) {
				expect(organizationById.has(org), org).toBe(true);
			}
		}
	});
});
