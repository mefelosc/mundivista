import { indicatorMeta, type RankInfo } from '#lib/data/countries';
import type { IndicatorKey, IndicatorValue } from '#lib/types';

const nf = new Intl.NumberFormat('pt-BR');
const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatInt(value: number): string {
	return nf.format(Math.round(value));
}

export function formatDec(value: number, digits = 1): string {
	return digits === 2 ? nf2.format(value) : nf1.format(value);
}

/** Notação compacta em português: 212,8 mi / 2,28 tri. */
export function formatCompact(value: number): string {
	const abs = Math.abs(value);
	if (abs >= 1e12) return `${formatDec(value / 1e12, abs >= 1e13 ? 1 : 2)} tri`;
	if (abs >= 1e9) return `${formatDec(value / 1e9, abs >= 1e10 ? 1 : 2)} bi`;
	if (abs >= 1e6) return `${formatDec(value / 1e6, abs >= 1e7 ? 1 : 2)} mi`;
	if (abs >= 1e4) return `${formatDec(value / 1e3, 1)} mil`;
	return nf.format(Math.round(value));
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
	const meta = indicatorMeta[key];
	const unit = meta?.unit ? ` ${meta.unit}` : '';
	return `${formatIndicatorValue(key, value)}${unit}`;
}

export function formatRank(rank: RankInfo | null): string {
	if (!rank) return '—';
	return `${rank.rank}º de ${rank.total}`;
}

export function formatPercentile(rank: RankInfo | null): string {
	if (!rank) return '—';
	return `${Math.round(rank.percentile * 100)}%`;
}

export function formatLatLng(lat: number, lng: number): string {
	const ns = lat >= 0 ? 'N' : 'S';
	const ew = lng >= 0 ? 'L' : 'O';
	return `${formatDec(Math.abs(lat), 2)}° ${ns} · ${formatDec(Math.abs(lng), 2)}° ${ew}`;
}

export function countryLabel(code: string): string {
	return code;
}
