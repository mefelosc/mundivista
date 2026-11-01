import { indicatorMeta, type RankInfo } from '#lib/data/countries';
import type { IndicatorKey, IndicatorValue } from '#lib/types';
import type { Locale } from './i18n';
import { indicatorUnit } from './i18n-data';

let currentLocale: Locale = 'pt';

const FORMATTERS: Record<Locale, { int: Intl.NumberFormat; dec1: Intl.NumberFormat; dec2: Intl.NumberFormat }> = {
	pt: {
		int: new Intl.NumberFormat('pt-BR'),
		dec1: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
		dec2: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
	},
	en: {
		int: new Intl.NumberFormat('en-US'),
		dec1: new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
		dec2: new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
	}
};

export function setFormatLocale(locale: Locale): void {
	currentLocale = locale;
}

function fmt(): (typeof FORMATTERS)[Locale] {
	return FORMATTERS[currentLocale];
}

export function formatInt(value: number): string {
	return fmt().int.format(Math.round(value));
}

export function formatDec(value: number, digits = 1): string {
	return digits === 2 ? fmt().dec2.format(value) : fmt().dec1.format(value);
}

/** Notação compacta: 212,8 mi / 2,28 tri em PT; 212.8M / 2.28T em EN. */
export function formatCompact(value: number): string {
	const abs = Math.abs(value);
	const en = currentLocale === 'en';
	if (abs >= 1e12) return `${formatDec(value / 1e12, abs >= 1e13 ? 1 : 2)} ${en ? 'T' : 'tri'}`;
	if (abs >= 1e9) return `${formatDec(value / 1e9, abs >= 1e10 ? 1 : 2)} ${en ? 'B' : 'bi'}`;
	if (abs >= 1e6) return `${formatDec(value / 1e6, abs >= 1e7 ? 1 : 2)} ${en ? 'M' : 'mi'}`;
	if (abs >= 1e4) return `${formatDec(value / 1e3, 1)} ${en ? 'k' : 'mil'}`;
	return fmt().int.format(Math.round(value));
}

export function formatUsd(value: number, perCapita = false): string {
	return `US$ ${formatCompact(value)}${perCapita ? '' : ''}`;
}

export function formatArea(km2: number): string {
	return `${formatInt(km2)} km²`;
}

export function formatYear(year: number | null | undefined): string {
	return year ? String(year) : '—';
}

export function formatIndicatorValue(key: IndicatorKey, value: IndicatorValue): string {
	const meta = indicatorMeta[key];
	const { v } = value;
	switch (meta?.format) {
		case 'usd':
			return key === 'gdpPerCapita' ? `US$ ${formatInt(v)}` : `US$ ${formatCompact(v)}`;
		case 'int':
			return formatInt(v);
		case 'dec2':
			return formatDec(v, 2);
		case 'dec1':
		default:
			return formatDec(v, 1);
	}
}

export function formatIndicatorLong(key: IndicatorKey, value: IndicatorValue): string {
	const unit = indicatorUnit(key, currentLocale);
	return `${formatIndicatorValue(key, value)}${unit ? ` ${unit}` : ''}`;
}

function ordinal(value: number): string {
	const mod10 = value % 10;
	const mod100 = value % 100;
	if (mod10 === 1 && mod100 !== 11) return `${value}st`;
	if (mod10 === 2 && mod100 !== 12) return `${value}nd`;
	if (mod10 === 3 && mod100 !== 13) return `${value}rd`;
	return `${value}th`;
}

export function formatRank(rank: RankInfo | null): string {
	if (!rank) return '—';
	return currentLocale === 'en'
		? `${ordinal(rank.rank)} of ${rank.total}`
		: `${rank.rank}º de ${rank.total}`;
}

export function formatPercentile(rank: RankInfo | null): string {
	if (!rank) return '—';
	return `${Math.round(rank.percentile * 100)}%`;
}

export function formatLatLng(lat: number, lng: number): string {
	const ns = lat >= 0 ? 'N' : 'S';
	const ew = lng >= 0 ? (currentLocale === 'en' ? 'E' : 'L') : currentLocale === 'en' ? 'W' : 'O';
	return `${formatDec(Math.abs(lat), 2)}° ${ns} · ${formatDec(Math.abs(lng), 2)}° ${ew}`;
}

export function countryLabel(code: string): string {
	return code;
}
