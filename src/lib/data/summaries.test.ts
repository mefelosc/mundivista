import { describe, expect, it } from 'vitest';
import { countries, getCountry } from './countries';
import {
	countrySummary,
	demographySummary,
	economySummary,
	geographySummary,
	geopoliticsSummary,
	historySummary
} from './summaries';
import { setFormatLocale } from '#lib/format';

const THEMES = [
	countrySummary,
	demographySummary,
	economySummary,
	geographySummary,
	geopoliticsSummary,
	historySummary
];

describe('resumos do dossiê', () => {
	it('gera resumo para todos os países e temas, sem valores inválidos', () => {
		for (const locale of ['pt', 'en'] as const) {
			setFormatLocale(locale);
			for (const country of countries) {
				for (const summary of THEMES) {
					const text = summary(country, locale);
					expect(text.length, `${country.code}/${locale}`).toBeGreaterThan(20);
					expect(text, `${country.code}/${locale}`).not.toMatch(/undefined|null|NaN/);
				}
			}
		}
		setFormatLocale('pt');
	});

	it('resume o Brasil com população, área e capital', () => {
		setFormatLocale('pt');
		const brazil = getCountry('BRA')!;
		const overview = countrySummary(brazil, 'pt');
		expect(overview).toContain('Brasil');
		expect(overview).toContain('Brasília');
		expect(overview).toContain('8.515.767');
		expect(demographySummary(brazil, 'pt')).toMatch(/população|densidade/);
		expect(economySummary(brazil, 'pt')).toContain('PIB');
		expect(geographySummary(brazil, 'pt')).toContain('fronteira');
		expect(historySummary(brazil, 'pt')).toContain('1822');
	});

	it('traduz o resumo para inglês', () => {
		setFormatLocale('en');
		const taiwan = getCountry('TWN')!;
		expect(countrySummary(taiwan, 'en')).toMatch(/population|capital/);
		expect(demographySummary(taiwan, 'en')).toMatch(/population|density/);
		setFormatLocale('pt');
	});

	it('usa fallback quando não há registro histórico', () => {
		const aruba = getCountry('ABW')!;
		expect(historySummary(aruba, 'pt')).toContain('Sem registro');
	});
});
