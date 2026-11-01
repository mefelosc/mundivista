export interface Company {
	name: string;
	sector: string;
	/** Valor de mercado aproximado, em bilhões de dólares. */
	marketCap: number;
}

/**
 * Amostra curada das maiores empresas por país, no espírito do CompaniesMarketCap.
 * Valores aproximados, arredondados, para leitura comparativa — não são cotações.
 * A cobertura é parcial e explícita: países sem lista mostram o estado vazio.
 */
export const companiesByCountry: Record<string, Company[]> = {
	USA: [
		{ name: 'Nvidia', sector: 'Semicondutores', marketCap: 3400 },
		{ name: 'Apple', sector: 'Tecnologia', marketCap: 3300 },
		{ name: 'Microsoft', sector: 'Software', marketCap: 3100 },
		{ name: 'Amazon', sector: 'Comércio e nuvem', marketCap: 2300 },
		{ name: 'Alphabet', sector: 'Internet', marketCap: 2200 }
	],
	CHN: [
		{ name: 'Tencent', sector: 'Internet', marketCap: 520 },
		{ name: 'ICBC', sector: 'Bancos', marketCap: 330 },
		{ name: 'Kweichow Moutai', sector: 'Bebidas', marketCap: 260 },
		{ name: 'Alibaba', sector: 'Comércio digital', marketCap: 300 },
		{ name: 'PetroChina', sector: 'Energia', marketCap: 210 }
	],
	JPN: [
		{ name: 'Toyota', sector: 'Automóveis', marketCap: 310 },
		{ name: 'Sony', sector: 'Eletrônicos', marketCap: 170 },
		{ name: 'Mitsubishi UFJ', sector: 'Bancos', marketCap: 160 },
		{ name: 'Keyence', sector: 'Automação', marketCap: 110 },
		{ name: 'Nintendo', sector: 'Jogos', marketCap: 95 }
	],
	DEU: [
		{ name: 'SAP', sector: 'Software', marketCap: 330 },
		{ name: 'Siemens', sector: 'Industrial', marketCap: 210 },
		{ name: 'Deutsche Telekom', sector: 'Telecom', marketCap: 150 },
		{ name: 'Allianz', sector: 'Seguros', marketCap: 140 },
		{ name: 'Mercedes-Benz', sector: 'Automóveis', marketCap: 80 }
	],
	GBR: [
		{ name: 'AstraZeneca', sector: 'Farmacêutica', marketCap: 250 },
		{ name: 'Shell', sector: 'Energia', marketCap: 210 },
		{ name: 'HSBC', sector: 'Bancos', marketCap: 190 },
		{ name: 'Unilever', sector: 'Consumo', marketCap: 150 },
		{ name: 'BP', sector: 'Energia', marketCap: 100 }
	],
	FRA: [
		{ name: 'LVMH', sector: 'Luxo', marketCap: 360 },
		{ name: 'Hermès', sector: 'Luxo', marketCap: 290 },
		{ name: "L'Oréal", sector: 'Cosméticos', marketCap: 240 },
		{ name: 'TotalEnergies', sector: 'Energia', marketCap: 170 },
		{ name: 'Sanofi', sector: 'Farmacêutica', marketCap: 150 }
	],
	IND: [
		{ name: 'Reliance Industries', sector: 'Conglomerado', marketCap: 250 },
		{ name: 'TCS', sector: 'Tecnologia', marketCap: 210 },
		{ name: 'HDFC Bank', sector: 'Bancos', marketCap: 180 },
		{ name: 'Bharti Airtel', sector: 'Telecom', marketCap: 110 },
		{ name: 'Infosys', sector: 'Tecnologia', marketCap: 95 }
	],
	CAN: [
		{ name: 'Royal Bank of Canada', sector: 'Bancos', marketCap: 190 },
		{ name: 'Shopify', sector: 'Comércio digital', marketCap: 170 },
		{ name: 'TD Bank', sector: 'Bancos', marketCap: 150 },
		{ name: 'Enbridge', sector: 'Energia', marketCap: 100 },
		{ name: 'Brookfield', sector: 'Investimentos', marketCap: 90 }
	],
	BRA: [
		{ name: 'Petrobras', sector: 'Energia', marketCap: 100 },
		{ name: 'Vale', sector: 'Mineração', marketCap: 60 },
		{ name: 'Itaú Unibanco', sector: 'Bancos', marketCap: 55 },
		{ name: 'Ambev', sector: 'Bebidas', marketCap: 40 },
		{ name: 'WEG', sector: 'Industrial', marketCap: 35 }
	],
	KOR: [
		{ name: 'Samsung Electronics', sector: 'Semicondutores', marketCap: 360 },
		{ name: 'SK Hynix', sector: 'Semicondutores', marketCap: 130 },
		{ name: 'LG Energy Solution', sector: 'Baterias', marketCap: 80 },
		{ name: 'Hyundai Motor', sector: 'Automóveis', marketCap: 55 }
	],
	CHE: [
		{ name: 'Nestlé', sector: 'Alimentos', marketCap: 260 },
		{ name: 'Roche', sector: 'Farmacêutica', marketCap: 250 },
		{ name: 'Novartis', sector: 'Farmacêutica', marketCap: 240 },
		{ name: 'UBS', sector: 'Bancos', marketCap: 110 }
	],
	NLD: [
		{ name: 'ASML', sector: 'Semicondutores', marketCap: 310 },
		{ name: 'Prosus', sector: 'Internet', marketCap: 110 },
		{ name: 'ING', sector: 'Bancos', marketCap: 65 }
	],
	SAU: [
		{ name: 'Saudi Aramco', sector: 'Energia', marketCap: 1800 },
		{ name: 'Al Rajhi Bank', sector: 'Bancos', marketCap: 110 },
		{ name: 'SABIC', sector: 'Petroquímica', marketCap: 65 }
	],
	AUS: [
		{ name: 'BHP', sector: 'Mineração', marketCap: 160 },
		{ name: 'Commonwealth Bank', sector: 'Bancos', marketCap: 150 },
		{ name: 'Rio Tinto', sector: 'Mineração', marketCap: 110 },
		{ name: 'CSL', sector: 'Saúde', marketCap: 90 }
	],
	ESP: [
		{ name: 'Inditex', sector: 'Varejo', marketCap: 160 },
		{ name: 'Iberdrola', sector: 'Energia', marketCap: 100 },
		{ name: 'Banco Santander', sector: 'Bancos', marketCap: 90 }
	],
	ITA: [
		{ name: 'Ferrari', sector: 'Automóveis', marketCap: 85 },
		{ name: 'Enel', sector: 'Energia', marketCap: 75 },
		{ name: 'Intesa Sanpaolo', sector: 'Bancos', marketCap: 65 }
	],
	TWN: [
		{ name: 'TSMC', sector: 'Semicondutores', marketCap: 920 },
		{ name: 'Foxconn', sector: 'Eletrônicos', marketCap: 85 },
		{ name: 'MediaTek', sector: 'Semicondutores', marketCap: 75 }
	],
	SWE: [
		{ name: 'Spotify', sector: 'Música', marketCap: 100 },
		{ name: 'Atlas Copco', sector: 'Industrial', marketCap: 85 },
		{ name: 'Volvo', sector: 'Automóveis', marketCap: 65 }
	],
	DNK: [
		{ name: 'Novo Nordisk', sector: 'Farmacêutica', marketCap: 360 },
		{ name: 'Maersk', sector: 'Logística', marketCap: 45 },
		{ name: 'Vestas', sector: 'Energia eólica', marketCap: 30 }
	],
	NOR: [
		{ name: 'Equinor', sector: 'Energia', marketCap: 85 },
		{ name: 'Telenor', sector: 'Telecom', marketCap: 18 }
	],
	IRL: [
		{ name: 'Accenture', sector: 'Consultoria', marketCap: 230 },
		{ name: 'Eaton', sector: 'Industrial', marketCap: 140 }
	],
	SGP: [
		{ name: 'DBS', sector: 'Bancos', marketCap: 110 },
		{ name: 'Sea Limited', sector: 'Internet', marketCap: 85 },
		{ name: 'Singtel', sector: 'Telecom', marketCap: 45 }
	],
	ARE: [
		{ name: 'First Abu Dhabi Bank', sector: 'Bancos', marketCap: 45 },
		{ name: 'Emirates NBD', sector: 'Bancos', marketCap: 35 }
	],
	ZAF: [
		{ name: 'Naspers', sector: 'Internet', marketCap: 45 },
		{ name: 'FirstRand', sector: 'Bancos', marketCap: 35 },
		{ name: 'MTN', sector: 'Telecom', marketCap: 25 }
	],
	MEX: [
		{ name: 'América Móvil', sector: 'Telecom', marketCap: 65 },
		{ name: 'FEMSA', sector: 'Consumo', marketCap: 45 },
		{ name: 'Banorte', sector: 'Bancos', marketCap: 35 }
	],
	IDN: [
		{ name: 'Bank Central Asia', sector: 'Bancos', marketCap: 85 },
		{ name: 'Telkom Indonesia', sector: 'Telecom', marketCap: 35 }
	],
	TUR: [
		{ name: 'Koç Holding', sector: 'Conglomerado', marketCap: 25 },
		{ name: 'Turkish Airlines', sector: 'Aviação', marketCap: 18 }
	],
	ARG: [
		{ name: 'MercadoLibre', sector: 'Comércio digital', marketCap: 110 },
		{ name: 'YPF', sector: 'Energia', marketCap: 15 }
	],
	COL: [
		{ name: 'Ecopetrol', sector: 'Energia', marketCap: 22 },
		{ name: 'Bancolombia', sector: 'Bancos', marketCap: 18 }
	],
	CHL: [
		{ name: 'Banco de Chile', sector: 'Bancos', marketCap: 16 },
		{ name: 'Cencosud', sector: 'Varejo', marketCap: 10 }
	]
};

export const companiesRetrieved = '2025-10';
export const companiesSource = {
	name: 'CompaniesMarketCap e relatórios de mercado',
	url: 'https://companiesmarketcap.com/',
	note: 'Valores de mercado aproximados, arredondados e arredondados para leitura; não são cotações em tempo real.'
} as const;

export function companiesFor(code: string): Company[] {
	return companiesByCountry[code] ?? [];
}
