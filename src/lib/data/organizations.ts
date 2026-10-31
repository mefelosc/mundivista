/**
 * Blocos e organizações internacionais.
 *
 * Composição verificada em fontes oficiais na data de acesso indicada.
 * Associações mudam: o app sempre exibe o recorte temporal junto ao nome.
 */

export interface OrganizationSource {
	name: string;
	url: string;
	accessed: string;
}

export interface Organization {
	id: string;
	name: string;
	short: string;
	kind: 'military' | 'economic' | 'political' | 'historical';
	/** Ano de criação (ou de dissolução, no caso de blocos históricos). */
	founded: number;
	dissolved?: number;
	era: 'current' | 'historical';
	members: string[];
	/** Ano de entrada por país, quando faz sentido (UE, OTAN). */
	since?: Record<string, number>;
	note: string;
	source: OrganizationSource;
}

const NATO_SOURCE: OrganizationSource = {
	name: 'OTAN — Members',
	url: 'https://www.nato.int/cps/en/natohq/topics_52044.htm',
	accessed: '2025-10'
};

const EU_SOURCE: OrganizationSource = {
	name: 'União Europeia — Países membros',
	url: 'https://european-union.europa.eu/principles-countries-history/eu-countries_pt',
	accessed: '2025-10'
};

export const organizations: Organization[] = [
	{
		id: 'nato',
		name: 'Organização do Tratado do Atlântico Norte',
		short: 'OTAN',
		kind: 'military',
		founded: 1949,
		era: 'current',
		members: [
			'ALB', 'BEL', 'BGR', 'CAN', 'HRV', 'CZE', 'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GRC',
			'HUN', 'ISL', 'ITA', 'LVA', 'LTU', 'LUX', 'MNE', 'NLD', 'MKD', 'NOR', 'POL', 'PRT',
			'ROU', 'SVK', 'SVN', 'ESP', 'SWE', 'TUR', 'GBR', 'USA'
		],
		since: {
			BEL: 1949, CAN: 1949, DNK: 1949, FRA: 1949, ISL: 1949, ITA: 1949, LUX: 1949,
			NLD: 1949, NOR: 1949, PRT: 1949, GBR: 1949, USA: 1949, GRC: 1952, TUR: 1952,
			DEU: 1955, ESP: 1982, CZE: 1999, HUN: 1999, POL: 1999, BGR: 2004, EST: 2004,
			LVA: 2004, LTU: 2004, ROU: 2004, SVK: 2004, SVN: 2004, ALB: 2009, HRV: 2009,
			MNE: 2017, MKD: 2020, FIN: 2023, SWE: 2024
		},
		note: '32 membros desde março de 2024, quando a Suécia concluiu a adesão.',
		source: NATO_SOURCE
	},
	{
		id: 'eu',
		name: 'União Europeia',
		short: 'UE',
		kind: 'economic',
		founded: 1993,
		era: 'current',
		members: [
			'AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GRC',
			'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD', 'POL', 'PRT', 'ROU', 'SVK',
			'SVN', 'ESP', 'SWE'
		],
		since: {
			BEL: 1958, FRA: 1958, DEU: 1958, ITA: 1958, LUX: 1958, NLD: 1958, DNK: 1973,
			IRL: 1973, GRC: 1981, ESP: 1986, PRT: 1986, AUT: 1995, FIN: 1995, SWE: 1995,
			CZE: 2004, EST: 2004, CYP: 2004, LVA: 2004, LTU: 2004, HUN: 2004, MLT: 2004,
			POL: 2004, SVN: 2004, SVK: 2004, BGR: 2007, ROU: 2007, HRV: 2013
		},
		note: '27 membros desde a saída do Reino Unido, em 2020. O ano indicado é o da entrada no bloco.',
		source: EU_SOURCE
	},
	{
		id: 'brics',
		name: 'BRICS (membros fundadores)',
		short: 'BRICS',
		kind: 'economic',
		founded: 2009,
		era: 'current',
		members: ['BRA', 'RUS', 'IND', 'CHN', 'ZAF'],
		note: 'O grupo ampliou-se a partir de 2024, com a entrada de Egito, Etiópia, Irã e Emirados Árabes Unidos; a Indonésia entrou em 2025. Aqui são mostrados apenas os fundadores.',
		source: {
			name: 'BRICS Brasil 2025 — Sobre o BRICS',
			url: 'https://brics2025.gov.br/',
			accessed: '2025-10'
		}
	},
	{
		id: 'opec',
		name: 'Organização dos Países Exportadores de Petróleo',
		short: 'OPEP',
		kind: 'economic',
		founded: 1960,
		era: 'current',
		members: ['DZA', 'COG', 'GNQ', 'GAB', 'IRN', 'IRQ', 'KWT', 'LBY', 'NGA', 'SAU', 'ARE', 'VEN'],
		note: '12 membros em 2025. A composição muda com frequência: Angola deixou o grupo em 2024.',
		source: {
			name: 'OPEP — Member Countries',
			url: 'https://www.opec.org/opec_web/en/about_us/25.htm',
			accessed: '2025-10'
		}
	},
	{
		id: 'g20',
		name: 'G20 (países)',
		short: 'G20',
		kind: 'economic',
		founded: 1999,
		era: 'current',
		members: [
			'ARG', 'AUS', 'BRA', 'CAN', 'CHN', 'FRA', 'DEU', 'IND', 'IDN', 'ITA', 'JPN', 'KOR',
			'MEX', 'RUS', 'SAU', 'ZAF', 'TUR', 'GBR', 'USA'
		],
		note: 'Além dos 19 países, o G20 inclui a União Europeia e, desde 2023, a União Africana.',
		source: {
			name: 'G20 — Members',
			url: 'https://g20.org/about-g20/',
			accessed: '2025-10'
		}
	},
	{
		id: 'asean',
		name: 'Associação das Nações do Sudeste Asiático',
		short: 'ASEAN',
		kind: 'political',
		founded: 1967,
		era: 'current',
		members: ['BRN', 'KHM', 'IDN', 'LAO', 'MYS', 'MMR', 'PHL', 'SGP', 'THA', 'VNM'],
		note: '10 membros. Timor-Leste é candidato à adesão.',
		source: {
			name: 'ASEAN — Member States',
			url: 'https://asean.org/about-asean/member-states/',
			accessed: '2025-10'
		}
	},
	{
		id: 'ussr',
		name: 'Repúblicas da União Soviética',
		short: 'URSS',
		kind: 'historical',
		founded: 1922,
		dissolved: 1991,
		era: 'historical',
		members: [
			'RUS', 'UKR', 'BLR', 'MDA', 'GEO', 'ARM', 'AZE', 'KAZ', 'UZB', 'TKM', 'KGZ', 'TJK',
			'EST', 'LVA', 'LTU'
		],
		note: '15 repúblicas até a dissolução, em dezembro de 1991. As três bálticas foram anexadas em 1940.',
		source: {
			name: 'Encyclopaedia Britannica — Soviet Union',
			url: 'https://www.britannica.com/place/Soviet-Union',
			accessed: '2025-10'
		}
	},
	{
		id: 'yugoslavia',
		name: 'Repúblicas da Iugoslávia',
		short: 'Iugoslávia',
		kind: 'historical',
		founded: 1945,
		dissolved: 1992,
		era: 'historical',
		members: ['SVN', 'HRV', 'BIH', 'SRB', 'MNE', 'MKD'],
		note: 'Seis repúblicas na federação socialista. Kosovo declarou independência em 2008; seu estatuto é disputado e não é reconhecido por todos os países.',
		source: {
			name: 'Encyclopaedia Britannica — Yugoslavia',
			url: 'https://www.britannica.com/place/Yugoslavia-former-federated-nation-1929-2003',
			accessed: '2025-10'
		}
	}
];

export const organizationById = new Map(organizations.map((o) => [o.id, o]));

export function organizationsForCountry(code: string, era: 'current' | 'historical' | 'all' = 'all') {
	return organizations.filter(
		(o) => (era === 'all' || o.era === era) && o.members.includes(code)
	);
}

export function organizationMembers(ids: string[]): Set<string> {
	const set = new Set<string>();
	for (const id of ids) {
		const org = organizationById.get(id);
		if (org) for (const m of org.members) set.add(m);
	}
	return set;
}

export const geopoliticalOrganizations = organizations.filter((o) => o.era === 'current');
export const historicalOrganizations = organizations.filter((o) => o.era === 'historical');
