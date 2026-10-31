import { organizations } from './organizations';

export interface TimelineEvent {
	year: number;
	title: string;
	detail: string;
	/** Blocos que devem ser destacados no recorte. */
	orgs?: string[];
	source: { name: string; url: string };
	center?: [number, number];
	zoom?: number;
}

export const TIMELINE_START = 1945;
export const TIMELINE_END = 2026;

/**
 * Marcos globais verificáveis. Não são fronteiras: são o contexto político
 * usado para destacar blocos históricos sobre os polígonos atuais.
 */
export const timelineEvents: TimelineEvent[] = [
	{
		year: 1945,
		title: 'Fundação da ONU',
		detail: 'Carta das Nações Unidas assinada em São Francisco, com 51 membros fundadores.',
		source: { name: 'Nações Unidas — história', url: 'https://www.un.org/en/about-us/history-of-the-un' }
	},
	{
		year: 1947,
		title: 'Independência da Índia e do Paquistão',
		detail: 'Fim do Raj britânico e partição do subcontinente, um dos maiores deslocamentos populacionais do século XX.',
		source: { name: 'Britannica — Partition of India', url: 'https://www.britannica.com/event/Partition-of-India' },
		center: [78, 22],
		zoom: 3.1
	},
	{
		year: 1949,
		title: 'Criação da OTAN',
		detail: 'Tratado do Atlântico Norte assinado em Washington por 12 países.',
		orgs: ['nato'],
		source: { name: 'OTAN — fundação', url: 'https://www.nato.int/cps/en/natohq/declassified_139339.htm' },
		center: [10, 50],
		zoom: 2.2
	},
	{
		year: 1955,
		title: 'Conferência de Bandung',
		detail: '29 países da Ásia e da África se reúnem na Indonésia e afirmam o não alinhamento no contexto da Guerra Fria.',
		source: { name: 'Britannica — Bandung Conference', url: 'https://www.britannica.com/event/Bandung-Conference' },
		center: [107, -6],
		zoom: 2.6
	},
	{
		year: 1960,
		title: 'O “ano da África”',
		detail: 'Dezessete países africanos conquistam independência, a maior leva de um único ano.',
		source: { name: 'Nações Unidas — descolonização', url: 'https://www.un.org/en/desa/1960-year-africa' },
		center: [18, 4],
		zoom: 1.8
	},
	{
		year: 1973,
		title: 'Primeira ampliação da CEE',
		detail: 'Reino Unido, Irlanda e Dinamarca entram na Comunidade Econômica Europeia.',
		orgs: ['eu'],
		source: { name: 'União Europeia — história', url: 'https://european-union.europa.eu/principles-countries-history/history-eu_pt' },
		center: [8, 50],
		zoom: 2.5
	},
	{
		year: 1989,
		title: 'Queda do Muro de Berlim',
		detail: 'A abertura das fronteiras alemãs antecipa o fim da ordem bipolar e a reunificação de 1990.',
		source: { name: 'Britannica — Berlin Wall', url: 'https://www.britannica.com/topic/Berlin-Wall' },
		center: [13.4, 52.5],
		zoom: 4.2
	},
	{
		year: 1991,
		title: 'Dissolução da URSS',
		detail: 'Quinze repúblicas tornam-se Estados independentes; a Rússia assume o assento soviético na ONU.',
		orgs: ['ussr'],
		source: { name: 'Britannica — Soviet Union', url: 'https://www.britannica.com/place/Soviet-Union' },
		center: [70, 52],
		zoom: 1.4
	},
	{
		year: 1992,
		title: 'Desintegração da Iugoslávia',
		detail: 'Eslovênia, Croácia, Bósnia e Macedônia se separam em meio a guerras; a federação termina.',
		orgs: ['yugoslavia'],
		source: { name: 'Britannica — Yugoslavia', url: 'https://www.britannica.com/place/Yugoslavia-former-federated-nation-1929-2003' },
		center: [18, 44],
		zoom: 3.4
	},
	{
		year: 1993,
		title: 'Entrada em vigor da União Europeia',
		detail: 'O Tratado de Maastricht cria a UE e prepara a moeda única e a cidadania europeia.',
		orgs: ['eu'],
		source: { name: 'União Europeia — Tratados', url: 'https://european-union.europa.eu/principles-countries-history/principles-and-values/eu-treaties_pt' },
		center: [10, 50],
		zoom: 2.5
	},
	{
		year: 1994,
		title: 'Fim do apartheid',
		detail: 'As primeiras eleições multirraciais da África do Sul elegem Nelson Mandela.',
		source: { name: 'Britannica — apartheid', url: 'https://www.britannica.com/topic/apartheid' },
		center: [24, -29],
		zoom: 3.2
	},
	{
		year: 2001,
		title: 'China entra na OMC',
		detail: 'A adesão integra a economia chinesa ao sistema multilateral de comércio.',
		source: { name: 'OMC — China', url: 'https://www.wto.org/english/thewto_e/countries_e/china_e.htm' },
		center: [105, 35],
		zoom: 2
	},
	{
		year: 2004,
		title: 'UE recebe dez novos membros',
		detail: 'A maior ampliação da UE inclui oito países do Leste europeu, Malta e Chipre.',
		orgs: ['eu', 'nato'],
		source: { name: 'União Europeia — alargamento', url: 'https://european-union.europa.eu/principles-countries-history/history-eu_pt' },
		center: [16, 50],
		zoom: 2.2
	},
	{
		year: 2011,
		title: 'Independência do Sudão do Sul',
		detail: 'Após referendo, o Sudão do Sul se torna o Estado mais jovem reconhecido pela ONU.',
		source: { name: 'Nações Unidas — Sudão do Sul', url: 'https://www.un.org/en/about-us/member-states/south-sudan' },
		center: [31, 7],
		zoom: 3.4
	},
	{
		year: 2013,
		title: 'Croácia entra na UE',
		detail: 'Segunda ampliação para os Bálcãs, após a Eslovênia em 2004.',
		orgs: ['eu', 'nato'],
		source: { name: 'União Europeia — Croácia', url: 'https://european-union.europa.eu/principles-countries-history/eu-countries/croatia_pt' },
		center: [16, 45],
		zoom: 3.2
	},
	{
		year: 2020,
		title: 'Reino Unido deixa a UE',
		detail: 'O Brexit encerra 47 anos de integração britânica e reduz o bloco a 27 membros.',
		orgs: ['eu'],
		source: { name: 'União Europeia — Brexit', url: 'https://european-union.europa.eu/principles-countries-history/history-eu_pt' },
		center: [-2, 54],
		zoom: 2.8
	},
	{
		year: 2023,
		title: 'Finlândia entra na OTAN',
		detail: 'A adesão dobra a fronteira terrestre da aliança com a Rússia.',
		orgs: ['nato'],
		source: { name: 'OTAN — alargamento', url: 'https://www.nato.int/cps/en/natohq/topics_52044.htm' },
		center: [26, 62],
		zoom: 2.8
	},
	{
		year: 2024,
		title: 'Suécia entra na OTAN',
		detail: 'A aliança chega a 32 membros, encerrando décadas de não alinhamento sueco.',
		orgs: ['nato'],
		source: { name: 'OTAN — alargamento', url: 'https://www.nato.int/cps/en/natohq/topics_52044.htm' },
		center: [16, 62],
		zoom: 2.8
	}
];

/** Organizações existentes no ano (inclui atuais e históricas). */
export function organizationsAt(year: number) {
	return organizations.filter(
		(org) => org.founded <= year && (!org.dissolved || year <= org.dissolved)
	);
}

/** Membros dos blocos existentes no ano, respeitando o ano de entrada. */
export function membershipAt(year: number): string[] {
	const codes = new Set<string>();
	for (const org of organizationsAt(year)) {
		for (const code of org.members) {
			const since = org.since?.[code] ?? org.founded;
			if (since <= year) codes.add(code);
		}
	}
	return [...codes];
}

export function eventForYear(year: number): TimelineEvent | null {
	const past = timelineEvents.filter((event) => event.year <= year);
	return past.length ? past[past.length - 1] : timelineEvents[0];
}
