import type { Snippet } from './data/snippets';
import type { DisputedInfo } from './data/disputed';
import { disputedTerritories } from './data/disputed';
import type { Organization } from './data/organizations';
import type { HistoricalRecord } from './data/historical';

/** Traduções inglesas do conteúdo curado. */

export const snippetsEn: Record<string, { title: string; body: string }> = {
	'antarctica-desert': {
		title: 'The largest desert on Earth is Antarctica',
		body: 'A desert is not defined by sand but by very low precipitation. Interior Antarctica receives less than 200 mm of snow a year — less than the Sahara. It is the largest desert on the planet, covering about 14 million km².'
	},
	'russia-timezones': {
		title: 'One country, eleven time zones',
		body: 'Russia is the largest country in the world and spans 11 time zones, from Kaliningrad to Kamchatka. When it is noon in Moscow, it is already midnight in parts of the far east — a 12-hour difference.'
	},
	'kazakhstan-landlocked': {
		title: 'The largest landlocked country',
		body: 'Kazakhstan covers 2.72 million km² and has no sea coast. It is larger than all of Western Europe. It still reaches the ocean through rivers and canals that flow into the Caspian Sea, a closed lake.'
	},
	'lesotho-enclave': {
		title: 'An entire country inside another',
		body: 'Lesotho is surrounded by a single neighbour: South Africa. It is one of three states entirely enclosed by another country — the others are San Marino and Vatican City, both inside Italy. Its lowest point is the highest of any country.'
	},
	'us-canada-border': {
		title: 'The longest border in the world',
		body: 'The border between the United States and Canada is 8,891 km long, including the Alaska section. It is the longest continuous land border between two countries, crossing lakes, forests and mountains — without a military wall.'
	},
	'congo-equator': {
		title: 'The river that crosses the Equator twice',
		body: 'The Congo River rises south of the Equator, curves north and crosses back before reaching the Atlantic. It is the second-largest river in the world by volume and drains a basin covering much of Central Africa.'
	},
	'india-population': {
		title: 'India is the most populous country',
		body: 'According to the UN, India overtook China in population in 2023. It is now home to about 1.45 billion people — nearly one in five people on the planet. China remains second with about 1.42 billion.'
	},
	'nato-32': {
		title: 'NATO reached 32 members',
		body: "Sweden's accession in March 2024 brought the alliance to 32 countries. Finland had joined in 2023. Together, the two accessions doubled NATO's land border with Russia."
	},
	'eu-27': {
		title: 'The European Union has 27 members',
		body: 'The United Kingdom left the bloc on 31 January 2020, ending 47 years of membership. Since then, the EU has 27 countries, from Portugal to Finland, and is negotiating new memberships in the Balkans and Ukraine.'
	},
	'un-193': {
		title: '193 member states, two observers',
		body: 'The UN General Assembly has 193 member states. The Vatican and Palestine participate as permanent observers without a vote. Taiwan is not a member: its representation is one of the oldest diplomatic disputes of the post-war era.'
	},
	'challenger-deep': {
		title: 'The deepest point in the ocean',
		body: 'The Mariana Trench in the western Pacific contains Challenger Deep: about 10,900 metres below the surface. If Mount Everest were placed there, its summit would still be more than 2 km underwater.'
	},
	'la-paz-altitude': {
		title: 'The highest capital city',
		body: 'La Paz, seat of the Bolivian government, sits at 3,640 m. The constitutional capital is Sucre, at 2,810 m. Bolivia is the only country with two capitals — and the one hosting the government is the highest in the world.'
	},
	'japan-islands': {
		title: 'Japan has more than 14,000 islands',
		body: 'In 2023, the Geospatial Information Authority of Japan recounted the territory and found 14,125 islands — more than double the previous figure, which used a stricter criterion. Four islands hold almost the entire country: Honshu, Hokkaido, Kyushu and Shikoku.'
	},
	'amazon-discharge': {
		title: 'One fifth of the fresh water reaching the oceans',
		body: 'The Amazon pours about 20% of all the fresh water that rivers carry to the oceans into the Atlantic. At flood stage, its discharge reaches 300,000 m³ per second — more than the next five rivers combined.'
	},
	'greenland-island': {
		title: 'The largest island is not a country',
		body: 'Greenland covers 2.16 million km² and is the largest island on the planet — three times the size of Texas. It is an autonomous territory of the Kingdom of Denmark, with its own government but not full sovereignty.'
	},
	'south-america-landlocked': {
		title: 'Two South American countries without a sea',
		body: 'Bolivia and Paraguay are the only landlocked countries in South America. Bolivia lost its Pacific coast in the War of the Pacific (1879–1884), and sea access remains central to its foreign policy.'
	},
	'chile-length': {
		title: 'A country 4,300 km long',
		body: 'Chile stretches about 4,300 km from north to south but is rarely wider than 180 km. It crosses the Atacama Desert, vineyards, temperate forests, volcanoes and glaciers — and reaches Antarctica.'
	},
	'egypt-nile': {
		title: 'Egypt depends on the Nile',
		body: 'About 97% of Egypt\'s renewable water comes from the Nile. Nearly the entire population lives in the fertile strip along the river and its delta, while the rest of the territory is desert. It is one of the countries most dependent on a single river.'
	},
	'titicaca': {
		title: 'The highest navigable lake',
		body: 'Lake Titicaca sits at 3,812 m between Peru and Bolivia. Covering about 8,300 km², it is the largest lake in South America and the highest navigable lake in the world. Its waters support millions of people on the Altiplano.'
	},
	'africa-countries': {
		title: 'The continent with the most countries',
		body: 'Africa has 54 states recognised by the UN — more than any other continent. Asia has 48. This fragmentation is largely a legacy of the colonial partition and twentieth-century independence processes.'
	},
	'south-sudan-youngest': {
		title: 'The youngest country in the world',
		body: 'South Sudan became independent from Sudan on 9 July 2011, after a referendum. It is the newest UN member state. Its borders and internal conflicts remain a central part of its recent history.'
	},
	'iceland-renewables': {
		title: 'An island powered by the Earth',
		body: 'Iceland produces almost all of its electricity from renewable sources — mainly hydropower and geothermal energy. Geothermal heat also warms most homes, making the country a global reference in energy transition.'
	},
	'russia-asia': {
		title: 'Most of Russia is in Asia',
		body: 'Russia is often described as a European country, but about three quarters of its territory lie in Asia. Most of its population, however, lives west of the Urals, in the European part.'
	}
};

export function localizedSnippet(snippet: Snippet | null, locale: 'pt' | 'en'): Snippet | null {
	if (!snippet || locale === 'pt') return snippet;
	const translated = snippetsEn[snippet.id];
	return translated ? { ...snippet, ...translated } : snippet;
}

export const disputedEn: Record<string, { label: string; note: string }> = {
	KOS: {
		label: 'Disputed status',
		note: 'Kosovo declared independence from Serbia in 2008. International recognition is partial; Serbia does not recognise its independence.'
	},
	PSX: {
		label: 'Disputed status',
		note: 'Occupied Palestinian territories. Palestine is a permanent observer at the UN; borders and final status are subject to negotiation and dispute.'
	},
	SAH: {
		label: 'Indeterminate status',
		note: 'Western Sahara is a non-self-governing territory according to the UN. Morocco administers most of it; the Polisario Front claims independence.'
	},
	FLK: {
		label: 'Disputed sovereignty',
		note: 'Falkland Islands/Malvinas: British administration and an Argentine sovereignty claim. The app does not assign sovereignty.'
	},
	KAS: {
		label: 'Indeterminate status',
		note: 'Siachen Glacier: an undemarcated border area between India and Pakistan, with a military presence from both countries.'
	},
	IOT: {
		label: 'Disputed sovereignty',
		note: 'British Indian Ocean Territory (Chagos): British administration; Mauritius claims sovereignty and the UN General Assembly supports decolonisation.'
	},
	SOL: {
		label: 'Self-declared status',
		note: 'Somaliland declared independence from Somalia in 1991. It is not a UN member and international recognition is limited; the app does not assign sovereignty.'
	}
};

export function localizedDisputed(
	info: DisputedInfo | null,
	locale: 'pt' | 'en'
): DisputedInfo | null {
	if (!info || locale === 'pt') return info;
	const code = Object.keys(disputedTerritories).find(
		(key) =>
			disputedTerritories[key].label === info.label &&
			disputedTerritories[key].note === info.note
	);
	const translated = code ? disputedEn[code] : undefined;
	return translated ? { ...info, ...translated } : info;
}

export const organizationNamesEn: Record<string, { name: string; note: string; short?: string }> = {
	nato: {
		short: 'NATO',
		name: 'North Atlantic Treaty Organization',
		note: 'Collective defence alliance founded in 1949. Membership expanded after the Cold War and again after 2022.'
	},
	eu: {
		short: 'EU',
		name: 'European Union',
		note: 'Political and economic union of 27 member states, with a single market and shared institutions.'
	},
	asean: {
		name: 'Association of Southeast Asian Nations',
		note: 'Regional bloc founded in 1967, focused on economic integration and political dialogue in Southeast Asia.'
	},
	mercosur: {
		name: 'Southern Common Market',
		note: 'South American customs union founded in 1991 by Argentina, Brazil, Paraguay and Uruguay.'
	},
	brics: {
		name: 'BRICS',
		note: 'Group of major emerging economies, expanded in 2024 and 2025.'
	},
	'african-union': {
		name: 'African Union',
		note: 'Continental organisation founded in 2002, successor to the Organisation of African Unity.'
	},
	'arab-league': {
		name: 'Arab League',
		note: 'Regional organisation of Arab states founded in 1945.'
	},
	'commonwealth': {
		name: 'Commonwealth of Nations',
		note: 'Association of mostly former British territories, with voluntary membership.'
	},
	g20: {
		name: 'Group of Twenty',
		note: 'Forum of the largest advanced and emerging economies, founded in 1999.'
	},
	opec: {
		name: 'Organization of the Petroleum Exporting Countries',
		note: 'Intergovernmental organisation of major oil-exporting countries, founded in 1960.'
	},
	ussr: {
		name: 'Soviet Union',
		note: 'Historical socialist federation that dissolved in 1991.'
	},
	yugoslavia: {
		name: 'Yugoslavia',
		note: 'Historical South Slavic state that dissolved in the 1990s.'
	}
};

export function localizedOrganization(
	org: Organization,
	locale: 'pt' | 'en'
): Organization {
	if (locale === 'pt') return org;
	const translated = organizationNamesEn[org.id];
	return translated ? { ...org, ...translated } : org;
}

/** Notas históricas em inglês para os registros com maior probabilidade de leitura. */
export const historicalNotesEn: Record<string, string> = {
	PRT: 'Kingdom of Portugal recognised by the Treaty of Zamora.',
	ESP: 'Union of the Crowns of Castile and Aragon; the centralised Spanish state consolidated over the following centuries.',
	FRA: 'Treaty of Verdun, origin of West Francia.',
	GBR: 'Acts of Union between England and Scotland.',
	IRL: 'Irish Free State; republic in 1949.',
	DEU: 'German unification; reunification in 1990.',
	ITA: 'Italian unification (Kingdom of Italy).',
	NLD: 'Peace of Westphalia, recognising the independence of the United Provinces.',
	BEL: 'Belgian Revolution; independence recognised in 1839.',
	LUX: 'Treaty of London.',
	CHE: 'Federal Pact of the original cantons; modern confederation in 1848.',
	AUT: 'Austrian State Treaty, restoring full sovereignty after Allied occupation.',
	HUN: 'Kingdom of Hungary; republic in 1989.',
	POL: 'Restoration after the partitions; the Polish state dates back to the tenth century.',
	CZE: 'Split from Czechoslovakia.',
	SVK: 'Split from Czechoslovakia.',
	ROU: 'Independence from the Ottoman Empire; union with Transylvania in 1918.',
	BGR: 'Independence from the Ottoman Empire.',
	GRC: 'Recognised by the London Protocol.',
	ALB: 'Declaration of independence from the Ottoman Empire.',
	SRB: 'After the dissolution of Serbia and Montenegro.',
	HRV: 'Declaration of independence from Yugoslavia.',
	SVN: 'Declaration of independence from Yugoslavia.',
	BIH: 'Independence recognised during the Bosnian War.',
	MKD: 'Declaration of independence from Yugoslavia.',
	MNE: 'Independence after the referendum that dissolved Serbia and Montenegro.',
	KOS: 'Unilateral declaration of independence from Serbia; partial international recognition and disputed status.',
	RUS: 'Russian Federation after the dissolution of the USSR.',
	UKR: 'Independence after the dissolution of the USSR; declaration of sovereignty in 1990.',
	BLR: 'Independence after the dissolution of the USSR.',
	MDA: 'Independence after the dissolution of the USSR.',
	GEO: 'Independence after the dissolution of the USSR.',
	ARM: 'Independence after the dissolution of the USSR.',
	AZE: 'Independence after the dissolution of the USSR.',
	KAZ: 'Independence after the dissolution of the USSR.',
	UZB: 'Independence after the dissolution of the USSR.',
	TKM: 'Independence after the dissolution of the USSR.',
	KGZ: 'Independence after the dissolution of the USSR.',
	TJK: 'Independence after the dissolution of the USSR.',
	EST: 'Restoration of independence; first independence in 1918.',
	LVA: 'Restoration of independence; first independence in 1918.',
	LTU: 'Act of Restoration, the first country to leave the USSR.',
	FIN: 'Independence from Russia.',
	NOR: 'End of the union with Sweden.',
	ISL: 'Republic; independence from Denmark.',
	MLT: 'Independence from the United Kingdom.',
	CYP: 'Independence from the United Kingdom.',
	USA: 'Declaration of independence from the United Kingdom; recognised in 1783.',
	CAN: 'Confederation; full legislative autonomy in 1982.',
	MEX: 'Independence from Spain.',
	BRA: 'Independence from Portugal; recognised in 1825.',
	ARG: 'Declaration of independence from the United Provinces of the Río de la Plata.',
	COL: 'Declaration of independence from Spain.',
	VEN: 'Declaration of independence; consolidation in 1819.',
	ECU: 'Independence from Spain; separation from Gran Colombia in 1830.',
	URY: 'Treaty of Montevideo, recognising the Oriental State of Uruguay.',
	DOM: 'Independence from Haiti.',
	HTI: 'First independent Black republic; independence from France.',
	CUB: 'Formal independence from Spain/US; revolution in 1959.',
	JAM: 'Independence from the United Kingdom.',
	TTO: 'Independence from the United Kingdom.',
	GUY: 'Independence from the United Kingdom.',
	SUR: 'Independence from the Netherlands.',
	BLZ: 'Independence from the United Kingdom.',
	PAN: 'Separation from Colombia, with US support.',
	PHL: 'Nominal independence from the United Kingdom; republic in 1953.',
	IDN: 'Proclamation of independence from the Netherlands; recognised in 1949.',
	VNM: 'Independence from France; reunification in 1976.',
	KHM: 'Independence from France.',
	LAO: 'Independence from France.',
	MMR: 'Independence from the United Kingdom.',
	LKA: 'Independence from the United Kingdom.',
	IND: 'Independence from the United Kingdom and partition.',
	PAK: 'Independence from the United Kingdom.',
	BGD: 'Independence from Pakistan.',
	NPL: 'Never formally colonised; unified monarchy in 1768 and republic in 2008.',
	THA: 'Never formally colonised; the Kingdom of Siam changed its name in 1939.',
	MYS: 'Independence from the United Kingdom; federation expanded in 1963.',
	SGP: 'Separation from Malaysia.',
	KOR: 'Republic of Korea; division of the peninsula in 1945–1948.',
	PRK: 'Democratic People\'s Republic of Korea; division of the peninsula in 1945–1948.',
	CHN: 'People\'s Republic of China; the Chinese state has millennia of continuity.',
	JPN: 'Treaty of San Francisco restores full sovereignty after US occupation.',
	TWN: 'Republic of China; retreat to Taiwan in 1949.',
	AUS: 'Federation of British colonies; full autonomy under the Statute of Westminster in 1942.',
	NZL: 'Dominion; full adoption of the Statute of Westminster in 1947.',
	ZAF: 'Union of South Africa; end of apartheid and universal suffrage in 1994.',
	EGY: 'Independence from the United Kingdom and Egypt.',
	SDN: 'Independence from the United Kingdom and Egypt.',
	SSD: 'Independence from Sudan; the youngest UN-recognised country.',
	ETH: 'Independence maintained; Italian occupation (1936–1941) ended with restoration.',
	ERI: 'Independence from Ethiopia after a referendum.',
	SOM: 'Union of British Somaliland and Italian Somalia.',
	TZA: 'Tanganyika independent; union with Zanzibar in 1964.',
	GHA: 'First sub-Saharan colony to gain independence.',
	CMR: 'Independence from France; reunification with British Cameroons in 1961.',
	COD: 'Independence from Belgium.',
	COG: 'Independence from France.',
	AGO: 'Independence from Portugal.',
	MOZ: 'Independence from Portugal.',
	NAM: 'Independence from South Africa.',
	ZWE: 'Independence from the United Kingdom.',
	ZMB: 'Independence from the United Kingdom.',
	MWI: 'Independence from the United Kingdom.',
	KEN: 'Independence from the United Kingdom.',
	UGA: 'Independence from the United Kingdom.',
	TUN: 'Independence from France.',
	DZA: 'Independence from France after the war of independence.',
	MAR: 'Independence from France and Spain.',
	LBY: 'Independence from Italy and Allied administration.',
	IRQ: 'Independence from the British mandate.',
	JOR: 'Independence from the British mandate.',
	ISR: 'Declaration of independence; borders and the status of Jerusalem are disputed.',
	SAU: 'Unification of the kingdom.',
	IRN: 'Islamic Republic after the revolution; the Persian state has millennia of continuity.',
	AFG: 'Independence from the British sphere; modern state consolidated in the eighteenth century.',
	TUR: 'Republic proclaimed after the dissolution of the Ottoman Empire.'
};

const formerNamesEn: Record<string, string> = {
	'Alemanha Oriental e Ocidental': 'East and West Germany',
	Iugoslávia: 'Yugoslavia',
	'Tchecosláquia': 'Czechoslovakia',
	'URSS': 'USSR',
	'Sérvia e Montenegro': 'Serbia and Montenegro',
	'Sérvia': 'Serbia',
	'República Socialista Federativa Soviética da Rússia': 'Russian Soviet Federative Socialist Republic',
	'República Popular da Hungria': 'Hungarian People\'s Republic'
};

export function localizedHistorical(
	record: HistoricalRecord | null,
	locale: 'pt' | 'en'
): HistoricalRecord | null {
	if (!record || locale === 'pt') return record;
	const note =
		historicalNotesEn[record.code] ??
		(record.independence
			? `Independence or state formation in ${record.independence}. See the source for the curated criterion.`
			: 'Curated historical record. See the source for details.');
	const formerNames = record.formerNames?.map((name) => ({
		...name,
		name: formerNamesEn[name.name] ?? name.name
	}));
	return { ...record, note, formerNames };
}

export const tradeTermsEn: Record<string, string> = {
	ASEAN: 'ASEAN',
	Aeronaves: 'Aircraft',
	Alemanha: 'Germany',
	Alimentos: 'Food',
	Argentina: 'Argentina',
	Austrália: 'Australia',
	Automóveis: 'Cars',
	Autopeças: 'Auto parts',
	Aço: 'Steel',
	Açúcar: 'Sugar',
	Baterias: 'Batteries',
	Bebidas: 'Beverages',
	Brasil: 'Brazil',
	Bélgica: 'Belgium',
	Café: 'Coffee',
	Canadá: 'Canada',
	Carne: 'Meat',
	'Carne bovina': 'Beef',
	Carvão: 'Coal',
	Chile: 'Chile',
	China: 'China',
	Cobre: 'Copper',
	Combustíveis: 'Fuels',
	'Combustíveis refinados': 'Refined fuels',
	'Coreia do Sul': 'South Korea',
	Cosméticos: 'Cosmetics',
	Eletrônicos: 'Electronics',
	'Emirados Árabes': 'United Arab Emirates',
	Equador: 'Ecuador',
	Espanha: 'Spain',
	'Estados Unidos': 'United States',
	Farmacêuticos: 'Pharmaceuticals',
	Fertilizantes: 'Fertilizers',
	Flores: 'Flowers',
	França: 'France',
	Frutas: 'Fruit',
	'Gás natural': 'Natural gas',
	Itália: 'Italy',
	Japão: 'Japan',
	Joias: 'Jewellery',
	Lítio: 'Lithium',
	Madeira: 'Timber',
	Metais: 'Metals',
	Milho: 'Maize',
	'Minério de ferro': 'Iron ore',
	Máquinas: 'Machinery',
	México: 'Mexico',
	Navios: 'Ships',
	Noruega: 'Norway',
	Ouro: 'Gold',
	Panamá: 'Panama',
	'Países Baixos': 'Netherlands',
	Petroquímicos: 'Petrochemicals',
	Petróleo: 'Oil',
	'Petróleo bruto': 'Crude oil',
	'Petróleo refinado': 'Refined oil',
	Platina: 'Platinum',
	Plásticos: 'Plastics',
	Polônia: 'Poland',
	Potássio: 'Potash',
	'Produtos agrícolas': 'Agricultural products',
	Químicos: 'Chemicals',
	'Reino Unido': 'United Kingdom',
	Rússia: 'Russia',
	Salmão: 'Salmon',
	Semicondutores: 'Semiconductors',
	'Serviços financeiros': 'Financial services',
	Software: 'Software',
	Soja: 'Soybeans',
	Suíça: 'Switzerland',
	Taiwan: 'Taiwan',
	Trigo: 'Wheat',
	Têxteis: 'Textiles',
	'União Europeia': 'European Union',
	Veículos: 'Vehicles',
	Vietnã: 'Vietnam',
	Vinho: 'Wine',
	Índia: 'India'
};

export function localizeTradeTerm(term: string, locale: 'pt' | 'en'): string {
	return locale === 'en' ? (tradeTermsEn[term] ?? term) : term;
}

export const companySectorsEn: Record<string, string> = {
	Alimentos: 'Food',
	Automação: 'Automation',
	Automóveis: 'Cars',
	Aviação: 'Aviation',
	Bancos: 'Banks',
	Baterias: 'Batteries',
	Bebidas: 'Beverages',
	'Comércio digital': 'Digital commerce',
	'Comércio e nuvem': 'Commerce and cloud',
	Conglomerado: 'Conglomerate',
	Consultoria: 'Consulting',
	Consumo: 'Consumer goods',
	Cosméticos: 'Cosmetics',
	Eletrônicos: 'Electronics',
	Energia: 'Energy',
	'Energia eólica': 'Wind energy',
	Farmacêutica: 'Pharmaceuticals',
	Industrial: 'Industrial',
	Internet: 'Internet',
	Investimentos: 'Investments',
	Jogos: 'Games',
	Logística: 'Logistics',
	Luxo: 'Luxury',
	Mineração: 'Mining',
	Música: 'Music',
	Petroquímica: 'Petrochemicals',
	Saúde: 'Health',
	Seguros: 'Insurance',
	Semicondutores: 'Semiconductors',
	Software: 'Software',
	Tecnologia: 'Technology',
	Telecom: 'Telecom',
	Varejo: 'Retail'
};

export function localizeSector(sector: string, locale: 'pt' | 'en'): string {
	return locale === 'en' ? (companySectorsEn[sector] ?? sector) : sector;
}

export const companiesSourceEn = {
	name: 'CompaniesMarketCap and market reports',
	url: 'https://companiesmarketcap.com/',
	note: 'Approximate market values, rounded for comparison; not real-time quotes.'
} as const;

export const gameCopyEn: Record<string, { title: string; tagline: string; description: string; mechanic: string }> = {
	'country-finder': {
		title: 'Countries of the World',
		tagline: 'Click the right country',
		description: 'Find the requested country on the map. Borders, labels and the political layer help; the answer is always a real territory.',
		mechanic: 'Click the country on the map'
	},
	'capital-match': {
		title: 'Capitals',
		tagline: 'From name to capital',
		description: 'Choose the capital of each country. Short rounds, four options and the source behind the answer.',
		mechanic: 'Choose the capital'
	},
	'world-rankings': {
		title: 'World Rankings',
		tagline: 'Who is at the top?',
		description: 'Order countries by population, GDP, area and other indicators. The ranking uses the latest World Bank observation.',
		mechanic: 'Order the countries'
	},
	blocs: {
		title: 'Blocs and Alliances',
		tagline: 'Who is inside?',
		description: 'Identify the members of the main international organisations and alliances, with the year each country joined.',
		mechanic: 'Select the members'
	},
	landlocked: {
		title: 'Landlocked',
		tagline: 'Sea or land?',
		description: 'Tell landlocked countries from coastal ones. A quick game about access to the sea.',
		mechanic: 'Choose sea or land'
	},
	silhouettes: {
		title: 'Silhouettes',
		tagline: 'Recognise the outline',
		description: 'Identify the country from its simplified outline. The shape comes from the same Natural Earth geometry as the map.',
		mechanic: 'Identify the silhouette'
	},
	borders: {
		title: 'Border Chain',
		tagline: 'Who borders whom',
		description: 'Build a chain of neighbouring countries. Each step must share a land border with the previous one.',
		mechanic: 'Build the border chain'
	},
	flags: {
		title: 'Flags',
		tagline: 'Recognise the country by its flag',
		description: 'Match flags to countries. The flag is shown without the country name; the source and the answer appear after each round.',
		mechanic: 'Identify the flag'
	},
	'economy-quiz': {
		title: 'Economy in Numbers',
		tagline: 'Who is larger? Who is smaller?',
		description: 'Compare GDP, income and other economic indicators between countries. Data from the World Bank.',
		mechanic: 'Compare the indicators'
	}
};

export function localizedGame<T extends { slug: string; title: string; tagline: string; description: string; mechanic: string }>(
	game: T,
	locale: 'pt' | 'en'
): T {
	if (locale === 'pt') return game;
	const copy = gameCopyEn[game.slug];
	return copy ? { ...game, ...copy } : game;
}
