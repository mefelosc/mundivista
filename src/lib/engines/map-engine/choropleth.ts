import type { ExpressionSpecification } from 'maplibre-gl';
import type { LayerConfig } from '#lib/configurations/map-layers';

export interface ChoroplethScale {
	expression: ExpressionSpecification;
	low: number;
	high: number;
	/** Limites numéricos usados nos stops (já transformados para log quando aplicável). */
	stops: number[];
}

const PALETTE_POSITIONS = [0, 0.2, 0.4, 0.6, 0.8, 1];

/**
 * Constrói a expressão de cor do coroplético usando quantis.
 * Quantis evitam que países extremos achatam a escala toda.
 */
export function buildChoropleth(layer: LayerConfig, rawValues: number[]): ChoroplethScale | null {
	const palette = layer.palette;
	if (!palette?.length || !rawValues.length) return null;

	const values = rawValues
		.filter((v) => Number.isFinite(v))
		.filter((v) => (layer.scale === 'log' ? v > 0 : true))
		.sort((a, b) => a - b);
	if (values.length < 2) return null;

	const quantiles = PALETTE_POSITIONS.map(
		(p) => values[Math.min(values.length - 1, Math.floor(p * (values.length - 1)))]
	);

	const toStop = (v: number) => (layer.scale === 'log' ? Math.log10(v) : v);
	const stops: number[] = [];
	const colors: string[] = [];
	for (let i = 0; i < quantiles.length; i++) {
		const stop = toStop(quantiles[i]);
		if (stops.length && stop <= stops[stops.length - 1]) continue;
		stops.push(stop);
		colors.push(palette[Math.min(i, palette.length - 1)]);
	}

	if (stops.length < 2) return null;

	const valueExpression: ExpressionSpecification =
		layer.scale === 'log'
			? ['log10', ['max', ['feature-state', 'value'], 0.000001]]
			: ['feature-state', 'value'];

	const pairs = stops.flatMap((stop, i) => [stop, colors[i]]);
	const expression = [
		'interpolate',
		['linear'],
		valueExpression,
		...pairs
	] as unknown as ExpressionSpecification;

	return {
		expression,
		low: values[0],
		high: values[values.length - 1],
		stops
	};
}

/** Envolve a expressão com o caso "sem dado". */
export function withNoData(
	expression: ExpressionSpecification,
	noDataColor: string
): ExpressionSpecification {
	return [
		'case',
		['boolean', ['feature-state', 'has'], false],
		expression,
		noDataColor
	] as unknown as ExpressionSpecification;
}
