/**
 * Rótulos de relevo e grandes formações físicas.
 * Coordenadas aproximadas dos centros das feições; nomes em português.
 */
export type PhysicalKind = 'range' | 'desert' | 'plateau' | 'basin' | 'plain';

export interface PhysicalLabel {
	name: string;
	kind: PhysicalKind;
	lat: number;
	lng: number;
	/** Zoom mínimo para exibir o rótulo. */
	minZoom: number;
}

export const physicalLabels: PhysicalLabel[] = [
	{ name: 'Andes', kind: 'range', lat: -20, lng: -68, minZoom: 1.4 },
	{ name: 'Montanhas Rochosas', kind: 'range', lat: 45, lng: -113, minZoom: 1.8 },
	{ name: 'Himalaia', kind: 'range', lat: 30, lng: 84, minZoom: 1.8 },
	{ name: 'Alpes', kind: 'range', lat: 46.5, lng: 10, minZoom: 3.4 },
	{ name: 'Urais', kind: 'range', lat: 60, lng: 60, minZoom: 2.4 },
	{ name: 'Atlas', kind: 'range', lat: 32, lng: -4, minZoom: 3.2 },
	{ name: 'Cordilheira Australiana', kind: 'range', lat: -25, lng: 148, minZoom: 2.6 },
	{ name: 'Cáucaso', kind: 'range', lat: 42.5, lng: 44, minZoom: 3.6 },
	{ name: 'Terras Altas Etíopes', kind: 'range', lat: 10, lng: 39, minZoom: 3.2 },
	{ name: 'Tian Shan', kind: 'range', lat: 42, lng: 80, minZoom: 3.2 },
	{ name: 'Drakensberg', kind: 'range', lat: -30, lng: 29, minZoom: 3.6 },
	{ name: 'Apalaches', kind: 'range', lat: 38, lng: -80, minZoom: 3.2 },
	{ name: 'Cárpatos', kind: 'range', lat: 47, lng: 25, minZoom: 3.8 },
	{ name: 'Zagros', kind: 'range', lat: 33, lng: 50, minZoom: 3.6 },
	{ name: 'Sierra Madre', kind: 'range', lat: 26, lng: -106, minZoom: 3.4 },
	{ name: 'Saara', kind: 'desert', lat: 23, lng: 12, minZoom: 1.4 },
	{ name: 'Gobi', kind: 'desert', lat: 43, lng: 105, minZoom: 2.2 },
	{ name: 'Kalahari', kind: 'desert', lat: -23, lng: 22, minZoom: 2.6 },
	{ name: 'Deserto Arábico', kind: 'desert', lat: 23, lng: 47, minZoom: 2.8 },
	{ name: 'Atacama', kind: 'desert', lat: -24, lng: -69, minZoom: 2.8 },
	{ name: 'Grande Deserto Vitória', kind: 'desert', lat: -29, lng: 129, minZoom: 2.6 },
	{ name: 'Thar', kind: 'desert', lat: 27, lng: 71, minZoom: 3.4 },
	{ name: 'Karakum', kind: 'desert', lat: 39, lng: 59, minZoom: 3.6 },
	{ name: 'Taklamakan', kind: 'desert', lat: 39, lng: 83, minZoom: 3.4 },
	{ name: 'Patagônia', kind: 'plain', lat: -45, lng: -68, minZoom: 2.6 },
	{ name: 'Planalto do Tibete', kind: 'plateau', lat: 33, lng: 88, minZoom: 2.4 },
	{ name: 'Planalto do Decã', kind: 'plateau', lat: 18, lng: 77, minZoom: 3.2 },
	{ name: 'Bacia Amazônica', kind: 'basin', lat: -4, lng: -62, minZoom: 1.8 },
	{ name: 'Bacia do Congo', kind: 'basin', lat: 0, lng: 22, minZoom: 2.2 },
	{ name: 'Grandes Planícies', kind: 'plain', lat: 40, lng: -100, minZoom: 2.2 },
	{ name: 'Planície Siberiana', kind: 'plain', lat: 62, lng: 75, minZoom: 2.4 },
	{ name: 'Pampas', kind: 'plain', lat: -35, lng: -62, minZoom: 3.2 }
];
