export type IndicatorKey =
	| 'population'
	| 'popDensity'
	| 'popGrowth'
	| 'lifeExpectancy'
	| 'urbanShare'
	| 'fertility'
	| 'gdp'
	| 'gdpPerCapita'
	| 'gdpGrowth'
	| 'exportsShare'
	| 'importsShare'
	| 'militaryShare'
	| 'internetShare'
	| 'forestShare'
	| 'renewableShare'
	| 'electricityAccess'
	| 'industryShare'
	| 'agriShare'
	| 'co2PerCapita'
	| 'researchShare'
	| 'gini'
	| 'unemployment'
	| 'inflation'
	| 'debtShare'
	| 'co2Total'
	| 'energyUse'
	| 'tourism'
	| 'schoolEnrollment'
	| 'healthShare'
	| 'govEffectiveness'
	| 'controlCorruption'
	| 'ruleOfLaw';

export type IndicatorFormat = 'int' | 'dec1' | 'dec2' | 'usd' | 'usd-pc';

export interface IndicatorValue {
	/** Valor observado. Nunca estimado pelo app. */
	v: number;
	/** Ano de referência da observação. */
	y: number;
	/** Série observada [[ano, valor], …] quando há mais de um ponto. */
	s?: [number, number][];
}

export interface Currency {
	code: string;
	name: string;
	symbol: string;
}

export interface Country {
	code: string;
	iso2: string;
	iso3: string;
	name: string;
	nameEn: string;
	official: string | null;
	capital: string | null;
	capitalLatLng: [number, number] | null;
	continent: string | null;
	region: string | null;
	subregion: string | null;
	areaKm2: number | null;
	landlocked: boolean | null;
	borders: string[];
	currency: Currency[];
	languages: string[];
	latlng: [number, number] | null;
	label: [number, number];
	labelRank: number;
	unMember: boolean | null;
	independent: boolean | null;
	sovereign: string | null;
	type: string | null;
	status: string | null;
	indicators: Partial<Record<IndicatorKey, IndicatorValue>>;
	factSource: string | null;
}

export interface IndicatorMeta {
	key: IndicatorKey;
	code: string;
	name: string;
	unit: string;
	format: IndicatorFormat;
	/** 'higher' = maior é mais; 'lower' = menor é mais. */
	dir: 'higher' | 'lower';
	source: string;
	sourceUrl: string;
	license: string;
	lastUpdated: string | null;
	unavailable?: boolean;
}

export interface SourceInfo {
	name: string;
	url: string;
	license: string;
	note?: string;
	scale?: string;
}

export interface DataManifest {
	retrieved: string;
	sources: {
		boundaries: SourceInfo;
		facts: SourceInfo;
		indicators: SourceInfo;
		physical: SourceInfo;
		marine: SourceInfo;
	};
}

export type LayerId = 'political' | 'physical' | 'population' | 'economy' | 'geopolitics' | 'history';

export type CardSection =
	| 'identity'
	| 'demography'
	| 'economy'
	| 'environment'
	| 'geopolitics'
	| 'history'
	| 'neighbors';
