/**
 * Worker do MapLibre com suporte a projeções customizadas.
 *
 * O worker padrão é importado como classe e instanciado se o próprio módulo já
 * não tiver feito isso. Em seguida registramos o handler que converte o
 * `definition` (PROJ string) com proj4 — necessário para o GeoJSON dos países
 * ser tiled corretamente em Equal Earth.
 */
import MapLibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs';
import proj4 from 'proj4';

type Conversion = {
	forward(position: number[]): number[];
	inverse(position: number[]): number[] | null;
};

type WorkerScope = {
	worker?: unknown;
	setProjectionHandler: (handler: (definition: string) => Conversion) => void;
};

const scope = self as unknown as WorkerScope;

if (!scope.worker) {
	new (MapLibreWorker as unknown as new (scope: unknown) => unknown)(self);
}

scope.setProjectionHandler((definition) => proj4(definition) as Conversion);
