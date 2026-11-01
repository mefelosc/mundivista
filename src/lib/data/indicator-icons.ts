import type { IndicatorKey } from '#lib/types';

/**
 * Ícone e tipo de gráfico por indicador. O objetivo é dar leitura rápida:
 * estoques e séries longas viram área; taxas e variações viram barras;
 * índices e proporções viram linha.
 */
const ICONS: Record<IndicatorKey, string> = {
	population: 'users',
	popDensity: 'density',
	popGrowth: 'timeline',
	lifeExpectancy: 'clock',
	urbanShare: 'grid',
	fertility: 'users',
	gdp: 'coins',
	gdpPerCapita: 'coins',
	gdpGrowth: 'timeline',
	exportsShare: 'globe',
	importsShare: 'globe',
	militaryShare: 'shield',
	internetShare: 'grid',
	forestShare: 'peak',
	renewableShare: 'sparkle',
	electricityAccess: 'sparkle',
	industryShare: 'layers',
	agriShare: 'terrain',
	co2PerCapita: 'wave',
	researchShare: 'sparkle',
	gini: 'scale',
	unemployment: 'users',
	inflation: 'wave',
	debtShare: 'scale',
	co2Total: 'wave',
	energyUse: 'wave',
	tourism: 'compass',
	schoolEnrollment: 'book',
	healthShare: 'shield',
	govEffectiveness: 'alliance',
	controlCorruption: 'scale',
	ruleOfLaw: 'shield'
};

const BARS = new Set<IndicatorKey>([
	'popGrowth',
	'gdpGrowth',
	'inflation',
	'unemployment',
	'fertility',
	'co2PerCapita'
]);

const LINES = new Set<IndicatorKey>([
	'gini',
	'debtShare',
	'exportsShare',
	'importsShare',
	'industryShare',
	'agriShare',
	'researchShare',
	'tourism',
	'healthShare',
	'militaryShare',
	'govEffectiveness',
	'controlCorruption',
	'ruleOfLaw'
]);

export function indicatorIcon(key: IndicatorKey): string {
	return ICONS[key] ?? 'sparkle';
}

export function indicatorVariant(key: IndicatorKey): 'area' | 'bars' | 'line' {
	if (BARS.has(key)) return 'bars';
	if (LINES.has(key)) return 'line';
	return 'area';
}

export function deltaModeFor(key: IndicatorKey, unit: string | undefined | null): 'points' | 'percent' {
	const label = unit ?? '';
	return label.includes('%') || label.includes('escore') || label.includes('índice')
		? 'points'
		: 'percent';
}
