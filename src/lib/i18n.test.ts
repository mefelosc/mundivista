import { describe, expect, it } from 'vitest';
import { formatNumber, localeFromUrl, messages, t } from './i18n';

describe('i18n', () => {
	it('mantém paridade entre as chaves PT e EN', () => {
		expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.pt).sort());
	});

	it('traduz chaves do shell e cai no PT quando faltar', () => {
		expect(t('nav.explore', 'en')).toBe('Explore');
		expect(t('nav.explore', 'pt')).toBe('Explorar');
	});

	it('detecta o idioma pela URL', () => {
		expect(localeFromUrl(new URL('https://example.com/?lang=en'))).toBe('en');
		expect(localeFromUrl(new URL('https://example.com/?lang=pt'))).toBe('pt');
	});

	it('formata números por locale', () => {
		expect(formatNumber(1234567, 'pt')).toContain('.');
		expect(formatNumber(1234567, 'en')).toContain(',');
	});
});
