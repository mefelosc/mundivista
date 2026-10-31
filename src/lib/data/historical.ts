/**
 * Fatos históricos curados, país a país.
 *
 * Só entram registros com data verificável. Quando há mais de uma leitura
 * (independência declarada x reconhecida), a nota explicita o critério.
 * Países sem registro exibem "não disponível" na interface — nada é estimado.
 */

export interface FormerName {
	name: string;
	from?: number;
	to?: number;
}

export interface HistoricalRecord {
	code: string;
	/** Ano adotado como marco de independência/formação do Estado atual. */
	independence?: number;
	independenceFrom?: string;
	note?: string;
	formerNames?: FormerName[];
}

export const historicalSource = {
	name: 'Encyclopaedia Britannica — verbetes nacionais',
	url: 'https://www.britannica.com',
	accessed: '2025-10',
	note: 'Datas de independência, formação e mudanças de nome. Em casos disputados, a nota indica o critério adotado.'
};

export const historicalRecords: HistoricalRecord[] = [
	// Europa
	{ code: 'PRT', independence: 1143, note: 'Reino de Portugal reconhecido pelo Tratado de Zamora.' },
	{ code: 'ESP', independence: 1492, note: 'União das coroas de Castela e Aragão; o Estado espanhol centralizado se consolida nos séculos seguintes.' },
	{ code: 'FRA', independence: 843, note: 'Tratado de Verdun, origem da Frância Ocidental.' },
	{ code: 'GBR', independence: 1707, note: 'Atos de União entre Inglaterra e Escócia.' },
	{ code: 'IRL', independence: 1922, note: 'Estado Livre Irlandês; república em 1949.' },
	{ code: 'DEU', independence: 1871, note: 'Unificação alemã; reunificação em 1990.', formerNames: [{ name: 'Alemanha Oriental e Ocidental', from: 1949, to: 1990 }] },
	{ code: 'ITA', independence: 1861, note: 'Unificação italiana (Reino da Itália).' },
	{ code: 'NLD', independence: 1648, note: 'Paz de Vestfália, que reconhece a independência das Províncias Unidas.' },
	{ code: 'BEL', independence: 1830, note: 'Revolução Belga; independência reconhecida em 1839.' },
	{ code: 'LUX', independence: 1839, note: 'Tratado de Londres.' },
	{ code: 'CHE', independence: 1291, note: 'Pacto Federal dos cantos originais; confederação moderna em 1848.' },
	{ code: 'AUT', independence: 1955, note: 'Tratado de Estado Austríaco, que restaura a soberania plena após a ocupação aliada.' },
	{ code: 'HUN', independence: 1000, note: 'Reino da Hungria; república em 1989.', formerNames: [{ name: 'República Popular da Hungria', from: 1949, to: 1989 }] },
	{ code: 'POL', independence: 1918, note: 'Restauração após as partilhas; o Estado polonês remonta ao século X.' },
	{ code: 'CZE', independence: 1993, note: 'Separação da Tchecoslováquia.', formerNames: [{ name: 'Tchecoslováquia', from: 1918, to: 1992 }] },
	{ code: 'SVK', independence: 1993, note: 'Separação da Tchecoslováquia.', formerNames: [{ name: 'Tchecoslováquia', from: 1918, to: 1992 }] },
	{ code: 'ROU', independence: 1877, note: 'Independência do Império Otomano; união da Transilvânia em 1918.' },
	{ code: 'BGR', independence: 1908, note: 'Independência do Império Otomano.' },
	{ code: 'GRC', independence: 1830, note: 'Reconhecida pelo Protocolo de Londres.' },
	{ code: 'ALB', independence: 1912, note: 'Declaração de independência do Império Otomano.' },
	{ code: 'SRB', independence: 2006, note: 'Após a dissolução de Sérvia e Montenegro.', formerNames: [{ name: 'Iugoslávia', from: 1918, to: 1992 }, { name: 'Sérvia e Montenegro', from: 1992, to: 2006 }] },
	{ code: 'HRV', independence: 1991, note: 'Declaração de independência da Iugoslávia.', formerNames: [{ name: 'Iugoslávia', from: 1918, to: 1991 }] },
	{ code: 'SVN', independence: 1991, note: 'Declaração de independência da Iugoslávia.', formerNames: [{ name: 'Iugoslávia', from: 1918, to: 1991 }] },
	{ code: 'BIH', independence: 1992, note: 'Independência reconhecida em meio à guerra da Bósnia.', formerNames: [{ name: 'Iugoslávia', from: 1918, to: 1992 }] },
	{ code: 'MKD', independence: 1991, note: 'Declaração de independência da Iugoslávia.', formerNames: [{ name: 'Iugoslávia', from: 1918, to: 1991 }] },
	{ code: 'MNE', independence: 2006, note: 'Independência após referendo que dissolveu Sérvia e Montenegro.', formerNames: [{ name: 'Iugoslávia', from: 1918, to: 1992 }, { name: 'Sérvia e Montenegro', from: 1992, to: 2006 }] },
	{ code: 'KOS', independence: 2008, note: 'Declaração unilateral de independência da Sérvia; reconhecimento internacional parcial e estatuto disputado.', formerNames: [{ name: 'Sérvia', to: 2008 }] },
	{ code: 'RUS', independence: 1991, note: 'Federação Russa após a dissolução da URSS.', formerNames: [{ name: 'República Socialista Federativa Soviética da Rússia', from: 1917, to: 1991 }] },
	{ code: 'UKR', independence: 1991, note: 'Independência após a dissolução da URSS; declaração de soberania em 1990.' },
	{ code: 'BLR', independence: 1991, note: 'Independência após a dissolução da URSS.' },
	{ code: 'MDA', independence: 1991, note: 'Independência após a dissolução da URSS.' },
	{ code: 'GEO', independence: 1991, note: 'Independência após a dissolução da URSS.' },
	{ code: 'ARM', independence: 1991, note: 'Independência após a dissolução da URSS.' },
	{ code: 'AZE', independence: 1991, note: 'Independência após a dissolução da URSS.' },
	{ code: 'KAZ', independence: 1991, note: 'Independência após a dissolução da URSS.' },
	{ code: 'UZB', independence: 1991, note: 'Independência após a dissolução da URSS.' },
	{ code: 'TKM', independence: 1991, note: 'Independência após a dissolução da URSS.' },
	{ code: 'KGZ', independence: 1991, note: 'Independência após a dissolução da URSS.' },
	{ code: 'TJK', independence: 1991, note: 'Independência após a dissolução da URSS.' },
	{ code: 'EST', independence: 1991, note: 'Restauração da independência; primeira independência em 1918.', formerNames: [{ name: 'URSS', from: 1940, to: 1991 }] },
	{ code: 'LVA', independence: 1991, note: 'Restauração da independência; primeira independência em 1918.', formerNames: [{ name: 'URSS', from: 1940, to: 1991 }] },
	{ code: 'LTU', independence: 1990, note: 'Ato de Restauração, primeiro país a deixar a URSS.', formerNames: [{ name: 'URSS', from: 1940, to: 1990 }] },
	{ code: 'FIN', independence: 1917, note: 'Independência da Rússia.' },
	{ code: 'NOR', independence: 1905, note: 'Fim da união com a Suécia.' },
	{ code: 'ISL', independence: 1944, note: 'República; independência da Dinamarca.' },
	{ code: 'MLT', independence: 1964, note: 'Independência do Reino Unido.' },
	{ code: 'CYP', independence: 1960, note: 'Independência do Reino Unido.' },

	// Américas
	{ code: 'USA', independence: 1776, note: 'Declaração de independência do Reino Unido; reconhecimento em 1783.' },
	{ code: 'CAN', independence: 1867, note: 'Confederação; autonomia legislativa plena em 1982.', formerNames: [{ name: 'Domínio do Canadá', from: 1867, to: 1982 }] },
	{ code: 'MEX', independence: 1821, note: 'Independência da Espanha.' },
	{ code: 'BRA', independence: 1822, note: 'Independência de Portugal; reconhecimento em 1825.' },
	{ code: 'ARG', independence: 1816, note: 'Declaração de independência das Províncias Unidas do Rio da Prata.' },
	{ code: 'CHL', independence: 1818, note: 'Declaração de independência da Espanha.' },
	{ code: 'COL', independence: 1810, note: 'Declaração de independência; consolidação em 1819.' },
	{ code: 'VEN', independence: 1811, note: 'Declaração de independência da Espanha.' },
	{ code: 'ECU', independence: 1822, note: 'Independência da Espanha; separação da Grã-Colômbia em 1830.' },
	{ code: 'PER', independence: 1821, note: 'Declaração de independência da Espanha.' },
	{ code: 'BOL', independence: 1825, note: 'Independência da Espanha.' },
	{ code: 'PRY', independence: 1811, note: 'Independência da Espanha.' },
	{ code: 'URY', independence: 1828, note: 'Tratado de Montevidéu, que reconhece o Estado Oriental do Uruguai.' },
	{ code: 'GUY', independence: 1966, note: 'Independência do Reino Unido.' },
	{ code: 'SUR', independence: 1975, note: 'Independência dos Países Baixos.' },
	{ code: 'CUB', independence: 1902, note: 'Independência formal da Espanha/EUA; revolução de 1959.' },
	{ code: 'HTI', independence: 1804, note: 'Primeira república negra independente; independência da França.' },
	{ code: 'DOM', independence: 1844, note: 'Independência do Haiti.' },
	{ code: 'JAM', independence: 1962, note: 'Independência do Reino Unido.' },
	{ code: 'TTO', independence: 1962, note: 'Independência do Reino Unido.' },
	{ code: 'BRB', independence: 1966, note: 'Independência do Reino Unido.' },
	{ code: 'BHS', independence: 1973, note: 'Independência do Reino Unido.' },
	{ code: 'BLZ', independence: 1981, note: 'Independência do Reino Unido.' },
	{ code: 'PAN', independence: 1903, note: 'Separação da Colômbia, com apoio dos EUA.' },
	{ code: 'GTM', independence: 1821, note: 'Independência da Espanha.' },
	{ code: 'HND', independence: 1821, note: 'Independência da Espanha.' },
	{ code: 'SLV', independence: 1821, note: 'Independência da Espanha.' },
	{ code: 'NIC', independence: 1821, note: 'Independência da Espanha.' },
	{ code: 'CRI', independence: 1821, note: 'Independência da Espanha.' },

	// África
	{ code: 'EGY', independence: 1922, note: 'Independência nominal do Reino Unido; república em 1953.' },
	{ code: 'LBY', independence: 1951, note: 'Independência da Itália e administração aliada.' },
	{ code: 'TUN', independence: 1956, note: 'Independência da França.' },
	{ code: 'MAR', independence: 1956, note: 'Independência da França e da Espanha.' },
	{ code: 'DZA', independence: 1962, note: 'Independência da França após a guerra de independência.' },
	{ code: 'SDN', independence: 1956, note: 'Independência do Reino Unido e do Egito.' },
	{ code: 'SSD', independence: 2011, note: 'Independência do Sudão; país mais jovem reconhecido pela ONU.' },
	{ code: 'ERI', independence: 1993, note: 'Independência da Etiópia após referendo.' },
	{ code: 'SOM', independence: 1960, note: 'União da Somalilândia Britânica e da Somália Italiana.' },
	{ code: 'KEN', independence: 1963, note: 'Independência do Reino Unido.' },
	{ code: 'UGA', independence: 1962, note: 'Independência do Reino Unido.' },
	{ code: 'TZA', independence: 1961, note: 'Tanganica independente; união com Zanzibar em 1964.', formerNames: [{ name: 'Tanganica e Zanzibar', to: 1964 }] },
	{ code: 'NGA', independence: 1960, note: 'Independência do Reino Unido.' },
	{ code: 'GHA', independence: 1957, note: 'Primeira colônia subsaariana a conquistar independência.', formerNames: [{ name: 'Costa do Ouro', to: 1957 }] },
	{ code: 'CIV', independence: 1960, note: 'Independência da França.' },
	{ code: 'SEN', independence: 1960, note: 'Independência da França.' },
	{ code: 'MLI', independence: 1960, note: 'Independência da França.' },
	{ code: 'BFA', independence: 1960, note: 'Independência da França.', formerNames: [{ name: 'Alto Volta', to: 1984 }] },
	{ code: 'NER', independence: 1960, note: 'Independência da França.' },
	{ code: 'TCD', independence: 1960, note: 'Independência da França.' },
	{ code: 'CMR', independence: 1960, note: 'Independência da França; reunificação com o Camarões Britânico em 1961.' },
	{ code: 'COD', independence: 1960, note: 'Independência da Bélgica.', formerNames: [{ name: 'Zaire', from: 1971, to: 1997 }] },
	{ code: 'COG', independence: 1960, note: 'Independência da França.' },
	{ code: 'GAB', independence: 1960, note: 'Independência da França.' },
	{ code: 'CAF', independence: 1960, note: 'Independência da França.' },
	{ code: 'AGO', independence: 1975, note: 'Independência de Portugal.' },
	{ code: 'MOZ', independence: 1975, note: 'Independência de Portugal.' },
	{ code: 'ZMB', independence: 1964, note: 'Independência do Reino Unido.', formerNames: [{ name: 'Rodésia do Norte', to: 1964 }] },
	{ code: 'ZWE', independence: 1980, note: 'Independência do Reino Unido.', formerNames: [{ name: 'Rodésia', to: 1980 }] },
	{ code: 'MWI', independence: 1964, note: 'Independência do Reino Unido.', formerNames: [{ name: 'Niassalândia', to: 1964 }] },
	{ code: 'NAM', independence: 1990, note: 'Independência da África do Sul.', formerNames: [{ name: 'Sudoeste Africano', to: 1990 }] },
	{ code: 'ZAF', independence: 1910, note: 'União Sul-Africana; fim do apartheid e sufrágio universal em 1994.' },
	{ code: 'MDG', independence: 1960, note: 'Independência da França.' },
	{ code: 'MUS', independence: 1968, note: 'Independência do Reino Unido.' },
	{ code: 'RWA', independence: 1962, note: 'Independência da Bélgica.' },
	{ code: 'BDI', independence: 1962, note: 'Independência da Bélgica.' },
	{ code: 'ETH', note: 'Estado com continuidade milenar; não foi colonizado de forma duradoura. A ocupação italiana (1936–1941) terminou com a restauração da soberania.' },

	// Ásia
	{ code: 'TUR', independence: 1923, note: 'República proclamada após a dissolução do Império Otomano.', formerNames: [{ name: 'Império Otomano', to: 1922 }] },
	{ code: 'ISR', independence: 1948, note: 'Declaração de independência; fronteiras e estatuto de Jerusalém são disputados.' },
	{ code: 'SAU', independence: 1932, note: 'Unificação do reino.' },
	{ code: 'IRQ', independence: 1932, note: 'Independência do mandato britânico.' },
	{ code: 'IRN', independence: 1979, note: 'República Islâmica após a revolução; o Estado persa tem continuidade milenar.', formerNames: [{ name: 'Pérsia', to: 1935 }] },
	{ code: 'AFG', independence: 1919, note: 'Independência do Reino Unido.' },
	{ code: 'IND', independence: 1947, note: 'Independência do Reino Unido e partição.' },
	{ code: 'PAK', independence: 1947, note: 'Independência do Reino Unido e partição.' },
	{ code: 'BGD', independence: 1971, note: 'Independência do Paquistão.', formerNames: [{ name: 'Paquistão Oriental', to: 1971 }] },
	{ code: 'LKA', independence: 1948, note: 'Independência do Reino Unido.', formerNames: [{ name: 'Ceilão', to: 1972 }] },
	{ code: 'NPL', note: 'Nunca foi formalmente colonizado; monarquia unificada em 1768 e república em 2008.' },
	{ code: 'THA', note: 'Nunca foi formalmente colonizada; o Reino de Sião mudou de nome em 1939.', formerNames: [{ name: 'Sião', to: 1939 }] },
	{ code: 'MMR', independence: 1948, note: 'Independência do Reino Unido.', formerNames: [{ name: 'Birmânia', to: 1989 }] },
	{ code: 'MYS', independence: 1957, note: 'Independência do Reino Unido; federação ampliada em 1963.' },
	{ code: 'SGP', independence: 1965, note: 'Separação da Malásia.' },
	{ code: 'IDN', independence: 1945, note: 'Proclamação de independência dos Países Baixos; reconhecimento em 1949.' },
	{ code: 'PHL', independence: 1946, note: 'Independência dos EUA.' },
	{ code: 'VNM', independence: 1945, note: 'Declaração de independência da França; reunificação em 1976.', formerNames: [{ name: 'Vietnã do Norte e do Sul', from: 1954, to: 1976 }] },
	{ code: 'KHM', independence: 1953, note: 'Independência da França.' },
	{ code: 'LAO', independence: 1953, note: 'Independência da França.' },
	{ code: 'CHN', independence: 1949, note: 'República Popular da China; o Estado chinês tem continuidade milenar.' },
	{ code: 'JPN', independence: 1952, note: 'Tratado de São Francisco restaura a soberania plena após a ocupação dos EUA.' },
	{ code: 'KOR', independence: 1948, note: 'República da Coreia; divisão da península em 1945–1948.' },
	{ code: 'PRK', independence: 1948, note: 'República Popular Democrática da Coreia; divisão da península em 1945–1948.' },
	{ code: 'MNG', independence: 1921, note: 'Independência da China; República Popular em 1924.' },

	// Oceania
	{ code: 'AUS', independence: 1901, note: 'Federação das colônias britânicas; autonomia plena pelo Estatuto de Westminster em 1942.' },
	{ code: 'NZL', independence: 1907, note: 'Domínio; adoção plena do Estatuto de Westminster em 1947.' },
	{ code: 'PNG', independence: 1975, note: 'Independência da Austrália.' },
	{ code: 'FJI', independence: 1970, note: 'Independência do Reino Unido.' },
	{ code: 'SLB', independence: 1978, note: 'Independência do Reino Unido.' },
	{ code: 'VUT', independence: 1980, note: 'Independência de condomínio franco-britânico.' },
	{ code: 'WSM', independence: 1962, note: 'Independência da Nova Zelândia.' }
];

export const historicalByCode = new Map(historicalRecords.map((r) => [r.code, r]));

export function getHistorical(code: string): HistoricalRecord | null {
	return historicalByCode.get(code) ?? null;
}
