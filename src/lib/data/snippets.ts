/**
 * Knowledge snippets: blocos curtos de leitura (15–30 s), sempre com fonte.
 * Não são triviais inventados: cada afirmação tem origem verificável.
 */

export type SnippetCategory =
	| 'physical'
	| 'political'
	| 'economic'
	| 'historical'
	| 'demographic'
	| 'environment';

export interface Snippet {
	id: string;
	title: string;
	body: string;
	category: SnippetCategory;
	/** Países aos quais o snippet se conecta (códigos ISO3). */
	countries: string[];
	source: string;
	sourceUrl: string;
	year?: number;
}

export const snippets: Snippet[] = [
	{
		id: 'antarctica-desert',
		title: 'O maior deserto do mundo é a Antártida',
		body: 'Deserto não é sinônimo de areia, e sim de lugar com pouquíssima precipitação. A Antártida recebe menos de 200 mm de neve por ano no interior — menos que o Saara. É o maior deserto do planeta, com cerca de 14 milhões de km².',
		category: 'physical',
		countries: [],
		source: 'British Antarctic Survey',
		sourceUrl: 'https://www.bas.ac.uk/about/antarctica/geography/weather/'
	},
	{
		id: 'russia-timezones',
		title: 'Um país, onze fusos horários',
		body: 'A Rússia é o maior país do mundo em área e atravessa 11 fusos horários, de Kaliningrado a Kamtchatka. Quando é meio-dia em Moscou, já é meia-noite em partes do extremo leste — uma diferença de 12 horas.',
		category: 'physical',
		countries: ['RUS'],
		source: 'Encyclopaedia Britannica — Russia',
		sourceUrl: 'https://www.britannica.com/place/Russia'
	},
	{
		id: 'kazakhstan-landlocked',
		title: 'O maior país sem litoral',
		body: 'O Cazaquistão tem 2,72 milhões de km² e nenhuma saída para o mar. É maior que a Europa Ocidental inteira. Ainda assim, tem acesso ao oceano por rios e canais que chegam ao mar Cáspio, um lago fechado.',
		category: 'physical',
		countries: ['KAZ'],
		source: 'Encyclopaedia Britannica — Kazakhstan',
		sourceUrl: 'https://www.britannica.com/place/Kazakhstan'
	},
	{
		id: 'lesotho-enclave',
		title: 'Um país inteiro dentro de outro',
		body: 'Lesoto é cercado por um único vizinho: a África do Sul. É um dos três Estados totalmente enclausurados por outro país — os outros são San Marino e o Vaticano, ambos dentro da Itália. Sua altitude mínima é a mais alta do mundo.',
		category: 'political',
		countries: ['LSO', 'ZAF'],
		source: 'Encyclopaedia Britannica — Lesotho',
		sourceUrl: 'https://www.britannica.com/place/Lesotho'
	},
	{
		id: 'us-canada-border',
		title: 'A fronteira mais longa do mundo',
		body: 'A fronteira entre Estados Unidos e Canadá tem 8.891 km, incluindo o trecho com o Alasca. É a maior fronteira terrestre contínua entre dois países e atravessa lagos, florestas e montanhas — sem nenhuma muralha militar.',
		category: 'political',
		countries: ['USA', 'CAN'],
		source: 'International Boundary Commission',
		sourceUrl: 'https://www.internationalboundarycommission.org/'
	},
	{
		id: 'congo-equator',
		title: 'O rio que cruza o Equador duas vezes',
		body: 'O rio Congo nasce ao sul do Equador, curva-se para o norte e o cruza de volta antes de desaguar no Atlântico. É o segundo maior rio do mundo em volume de água e drena uma bacia que ocupa boa parte da África Central.',
		category: 'physical',
		countries: ['COD', 'COG'],
		source: 'Encyclopaedia Britannica — Congo River',
		sourceUrl: 'https://www.britannica.com/place/Congo-River'
	},
	{
		id: 'india-population',
		title: 'A Índia é o país mais populoso do mundo',
		body: 'Segundo a ONU, a Índia ultrapassou a China em população em 2023. Hoje são cerca de 1,45 bilhão de pessoas — quase uma em cada cinco no planeta. A China segue em segundo lugar, com cerca de 1,42 bilhão.',
		category: 'demographic',
		countries: ['IND', 'CHN'],
		source: 'ONU — World Population Prospects 2024',
		sourceUrl: 'https://population.un.org/wpp/',
		year: 2024
	},
	{
		id: 'nato-32',
		title: 'A OTAN chegou a 32 membros',
		body: 'A adesão da Suécia, em março de 2024, elevou a aliança a 32 países. A Finlândia havia entrado em 2023. Juntas, as duas adesões dobraram a fronteira terrestre da OTAN com a Rússia.',
		category: 'political',
		countries: ['SWE', 'FIN', 'RUS'],
		source: 'OTAN — Enlargement',
		sourceUrl: 'https://www.nato.int/cps/en/natohq/topics_52044.htm',
		year: 2024
	},
	{
		id: 'eu-27',
		title: 'A União Europeia tem 27 membros',
		body: 'O Reino Unido deixou o bloco em 31 de janeiro de 2020, encerrando 47 anos de membership. Desde então, a UE reúne 27 países, de Portugal à Finlândia, e negocia novas adesões nos Bálcãs e na Ucrânia.',
		category: 'political',
		countries: ['GBR'],
		source: 'União Europeia — História da UE',
		sourceUrl: 'https://european-union.europa.eu/principles-countries-history/history-eu_pt',
		year: 2020
	},
	{
		id: 'un-193',
		title: '193 Estados-membros, dois observadores',
		body: 'A Assembleia Geral da ONU reúne 193 Estados-membros. Vaticano e Palestina participam como observadores permanentes, sem direito a voto. Taiwan não é membro: sua representação é uma das disputas diplomáticas mais antigas do pós-guerra.',
		category: 'political',
		countries: [],
		source: 'Nações Unidas — Estados-membros',
		sourceUrl: 'https://www.un.org/en/about-us/member-states',
		year: 2025
	},
	{
		id: 'challenger-deep',
		title: 'O ponto mais profundo do oceano',
		body: 'A Fossa das Marianas, no Pacífico ocidental, abriga o Challenger Deep: cerca de 10.900 metros abaixo da superfície. Se o Everest fosse colocado lá, seu topo ainda ficaria a mais de 2 km da água.',
		category: 'physical',
		countries: [],
		source: 'NOAA — Ocean Exploration',
		sourceUrl: 'https://oceanexplorer.noaa.gov/facts/mariana-trench.html'
	},
	{
		id: 'la-paz-altitude',
		title: 'A capital mais alta do mundo',
		body: 'La Paz, sede do governo boliviano, fica a 3.640 m de altitude. A capital constitucional é Sucre, a 2.810 m. Por isso, a Bolívia é o único país com duas capitais — e a que abriga o governo é a mais alta do planeta.',
		category: 'physical',
		countries: ['BOL'],
		source: 'Encyclopaedia Britannica — La Paz',
		sourceUrl: 'https://www.britannica.com/place/La-Paz-Bolivia'
	},
	{
		id: 'japan-islands',
		title: 'O Japão tem mais de 14 mil ilhas',
		body: 'Em 2023, a Autoridade de Informação Geoespacial do Japão recontou o território e chegou a 14.125 ilhas — mais que o dobro do número anterior, que usava um critério mais restrito. Quatro delas concentram quase todo o país: Honshu, Hokkaido, Kyushu e Shikoku.',
		category: 'physical',
		countries: ['JPN'],
		source: 'GSI Japão — Geospatial Information Authority',
		sourceUrl: 'https://www.gsi.go.jp/ENGLISH/',
		year: 2023
	},
	{
		id: 'amazon-discharge',
		title: 'Um quinto da água doce que chega aos oceanos',
		body: 'O Amazonas despeja no Atlântico cerca de 20% de toda a água doce que os rios do mundo levam aos oceanos. Em época de cheia, a vazão chega a 300 mil m³ por segundo — mais que os cinco rios seguintes somados.',
		category: 'physical',
		countries: ['BRA', 'PER', 'COL'],
		source: 'USGS — Amazon River',
		sourceUrl: 'https://www.usgs.gov/special-topics/water-science-school/science/amazon-river'
	},
	{
		id: 'greenland-island',
		title: 'A maior ilha do mundo não é um país',
		body: 'A Groenlândia tem 2,16 milhões de km² e é a maior ilha do planeta — três vezes o tamanho do Texas. É um território autônomo do Reino da Dinamarca, com governo próprio, mas sem soberania plena.',
		category: 'political',
		countries: ['GRL', 'DNK'],
		source: 'Encyclopaedia Britannica — Greenland',
		sourceUrl: 'https://www.britannica.com/place/Greenland'
	},
	{
		id: 'south-america-landlocked',
		title: 'Dois países sul-americanos sem mar',
		body: 'Bolívia e Paraguai são os únicos países da América do Sul sem litoral. A Bolívia perdeu sua costa no Pacífico na Guerra do Pacífico (1879–1884), e o acesso ao mar segue como tema central de sua política externa.',
		category: 'political',
		countries: ['BOL', 'PRY'],
		source: 'Encyclopaedia Britannica — Bolivia',
		sourceUrl: 'https://www.britannica.com/place/Bolivia'
	},
	{
		id: 'chile-length',
		title: 'Um país de 4.300 km de comprimento',
		body: 'O Chile se estende por cerca de 4.300 km de norte a sul, mas raramente passa de 180 km de largura. Atravessa o deserto do Atacama, vinhedos, florestas temperadas, vulcões e geleiras — e chega à Antártida.',
		category: 'physical',
		countries: ['CHL'],
		source: 'Encyclopaedia Britannica — Chile',
		sourceUrl: 'https://www.britannica.com/place/Chile'
	},
	{
		id: 'egypt-nile',
		title: 'O Egito depende do Nilo',
		body: 'Cerca de 97% da água renovável do Egito vem do rio Nilo. Praticamente toda a população vive na faixa fértil junto ao rio e ao delta, enquanto o resto do território é deserto. É um dos países mais dependentes de um único rio.',
		category: 'environment',
		countries: ['EGY'],
		source: 'FAO — AQUASTAT',
		sourceUrl: 'https://www.fao.org/aquastat/en/'
	},
	{
		id: 'titicaca',
		title: 'O lago navegável mais alto do mundo',
		body: 'O Titicaca fica a 3.812 m de altitude, entre Peru e Bolívia. Com cerca de 8.300 km², é o maior lago da América do Sul e o lago navegável mais alto do planeta. Suas águas abastecem milhões de pessoas no altiplano.',
		category: 'physical',
		countries: ['PER', 'BOL'],
		source: 'Encyclopaedia Britannica — Lake Titicaca',
		sourceUrl: 'https://www.britannica.com/place/Lake-Titicaca'
	},
	{
		id: 'africa-countries',
		title: 'O continente com mais países',
		body: 'A África reúne 54 Estados reconhecidos pela ONU — mais que qualquer outro continente. A Ásia tem 48. Essa fragmentação é herança, em grande parte, da partilha colonial e dos processos de independência do século XX.',
		category: 'political',
		countries: [],
		source: 'Nações Unidas — Estados-membros',
		sourceUrl: 'https://www.un.org/en/about-us/member-states'
	},
	{
		id: 'south-sudan-youngest',
		title: 'O país mais jovem do mundo',
		body: 'O Sudão do Sul conquistou independência em 9 de julho de 2011, após décadas de guerra civil e um referendo. É o Estado mais jovem reconhecido pela ONU e um dos mais vulneráveis a crises humanitárias e climáticas.',
		category: 'historical',
		countries: ['SSD', 'SDN'],
		source: 'Nações Unidas — South Sudan',
		sourceUrl: 'https://www.un.org/en/about-us/member-states/south-sudan',
		year: 2011
	},
	{
		id: 'iceland-renewables',
		title: 'A eletricidade quase inteira vem da terra e da água',
		body: 'A Islândia produz praticamente toda a sua eletricidade com fontes renováveis: cerca de 70% hidrelétrica e 30% geotérmica. O calor do subsolo também aquece a maioria das casas. É o único país do mundo com essa combinação em escala nacional.',
		category: 'environment',
		countries: ['ISL'],
		source: 'Orkustofnun — National Energy Authority',
		sourceUrl: 'https://orkustofnun.is/en'
	},
	{
		id: 'russia-asia',
		title: 'A maior parte da Rússia está na Ásia',
		body: 'Cerca de 77% do território russo fica a leste dos Urais, na Ásia. Mas a maior parte da população — e a capital, Moscou — está na porção europeia. O país é, ao mesmo tempo, o maior da Europa e o maior da Ásia.',
		category: 'demographic',
		countries: ['RUS'],
		source: 'Encyclopaedia Britannica — Russia',
		sourceUrl: 'https://www.britannica.com/place/Russia'
	}
];

export const snippetsByCountry = new Map<string, Snippet[]>();
for (const snippet of snippets) {
	for (const code of snippet.countries) {
		snippetsByCountry.set(code, [...(snippetsByCountry.get(code) ?? []), snippet]);
	}
}

export function snippetForCountry(code: string): Snippet | null {
	const list = snippetsByCountry.get(code);
	return list?.length ? list[Math.floor(Math.random() * list.length)] : null;
}
