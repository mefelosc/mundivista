export interface TradeProfile {
	/** Principais produtos/serviços exportados. */
	exports: string[];
	/** Principais produtos/serviços importados. */
	imports: string[];
	/** Principais destinos das exportações. */
	exportPartners: string[];
	/** Principais origens das importações. */
	importPartners: string[];
	year: number;
}

/**
 * Recorte curado de comércio exterior (produtos e parceiros), inspirado no
 * Observatory of Economic Complexity e no CIA World Factbook. A cobertura é
 * parcial: o painel sempre mostra os percentuais do World Bank para todos os
 * países e, quando não há recorte, aponta para a fonte.
 */
export const tradeByCountry: Record<string, TradeProfile> = {
	BRA: {
		exports: ['Soja', 'Petróleo bruto', 'Minério de ferro', 'Carne bovina', 'Açúcar'],
		imports: ['Máquinas', 'Eletrônicos', 'Combustíveis', 'Fertilizantes', 'Autopeças'],
		exportPartners: ['China', 'Estados Unidos', 'Argentina', 'União Europeia'],
		importPartners: ['China', 'Estados Unidos', 'Argentina', 'Alemanha'],
		year: 2024
	},
	USA: {
		exports: ['Combustíveis refinados', 'Gás natural', 'Aeronaves', 'Semicondutores', 'Soja'],
		imports: ['Eletrônicos', 'Máquinas', 'Veículos', 'Farmacêuticos', 'Petróleo'],
		exportPartners: ['Canadá', 'México', 'China', 'Japão'],
		importPartners: ['México', 'China', 'Canadá', 'Alemanha'],
		year: 2024
	},
	CHN: {
		exports: ['Eletrônicos', 'Máquinas', 'Veículos', 'Baterias', 'Têxteis'],
		imports: ['Semicondutores', 'Petróleo', 'Minério de ferro', 'Soja', 'Gás natural'],
		exportPartners: ['Estados Unidos', 'ASEAN', 'União Europeia', 'Japão'],
		importPartners: ['ASEAN', 'União Europeia', 'Brasil', 'Austrália'],
		year: 2024
	},
	DEU: {
		exports: ['Veículos', 'Máquinas', 'Químicos', 'Eletrônicos', 'Farmacêuticos'],
		imports: ['Veículos', 'Máquinas', 'Combustíveis', 'Eletrônicos', 'Metais'],
		exportPartners: ['Estados Unidos', 'França', 'China', 'Países Baixos'],
		importPartners: ['China', 'Países Baixos', 'Estados Unidos', 'Polônia'],
		year: 2024
	},
	JPN: {
		exports: ['Veículos', 'Máquinas', 'Semicondutores', 'Aço', 'Químicos'],
		imports: ['Petróleo', 'Gás natural', 'Carvão', 'Eletrônicos', 'Farmacêuticos'],
		exportPartners: ['Estados Unidos', 'China', 'Coreia do Sul', 'Taiwan'],
		importPartners: ['China', 'Estados Unidos', 'Austrália', 'Emirados Árabes'],
		year: 2024
	},
	GBR: {
		exports: ['Serviços financeiros', 'Máquinas', 'Farmacêuticos', 'Petróleo', 'Automóveis'],
		imports: ['Máquinas', 'Veículos', 'Farmacêuticos', 'Combustíveis', 'Eletrônicos'],
		exportPartners: ['Estados Unidos', 'União Europeia', 'China', 'Suíça'],
		importPartners: ['União Europeia', 'China', 'Estados Unidos', 'Noruega'],
		year: 2024
	},
	FRA: {
		exports: ['Aeronaves', 'Bebidas', 'Cosméticos', 'Máquinas', 'Farmacêuticos'],
		imports: ['Máquinas', 'Veículos', 'Eletrônicos', 'Combustíveis', 'Químicos'],
		exportPartners: ['Alemanha', 'Itália', 'Estados Unidos', 'Espanha'],
		importPartners: ['Alemanha', 'China', 'Bélgica', 'Estados Unidos'],
		year: 2024
	},
	IND: {
		exports: ['Petróleo refinado', 'Joias', 'Farmacêuticos', 'Têxteis', 'Software'],
		imports: ['Petróleo', 'Eletrônicos', 'Máquinas', 'Ouro', 'Fertilizantes'],
		exportPartners: ['Estados Unidos', 'Emirados Árabes', 'Países Baixos', 'China'],
		importPartners: ['China', 'Emirados Árabes', 'Estados Unidos', 'Rússia'],
		year: 2024
	},
	CAN: {
		exports: ['Petróleo', 'Veículos', 'Ouro', 'Madeira', 'Potássio'],
		imports: ['Máquinas', 'Veículos', 'Eletrônicos', 'Farmacêuticos', 'Plásticos'],
		exportPartners: ['Estados Unidos', 'China', 'Reino Unido', 'Japão'],
		importPartners: ['Estados Unidos', 'China', 'México', 'Alemanha'],
		year: 2024
	},
	MEX: {
		exports: ['Veículos', 'Eletrônicos', 'Máquinas', 'Petróleo', 'Produtos agrícolas'],
		imports: ['Máquinas', 'Eletrônicos', 'Veículos', 'Combustíveis', 'Plásticos'],
		exportPartners: ['Estados Unidos', 'Canadá', 'China', 'Alemanha'],
		importPartners: ['Estados Unidos', 'China', 'Alemanha', 'Japão'],
		year: 2024
	},
	KOR: {
		exports: ['Semicondutores', 'Veículos', 'Máquinas', 'Petroquímicos', 'Navios'],
		imports: ['Petróleo', 'Semicondutores', 'Gás natural', 'Carvão', 'Máquinas'],
		exportPartners: ['China', 'Estados Unidos', 'Vietnã', 'Japão'],
		importPartners: ['China', 'Estados Unidos', 'Japão', 'Austrália'],
		year: 2024
	},
	AUS: {
		exports: ['Minério de ferro', 'Carvão', 'Gás natural', 'Ouro', 'Carne'],
		imports: ['Máquinas', 'Veículos', 'Eletrônicos', 'Farmacêuticos', 'Combustíveis'],
		exportPartners: ['China', 'Japão', 'Coreia do Sul', 'Índia'],
		importPartners: ['China', 'Estados Unidos', 'Japão', 'Alemanha'],
		year: 2024
	},
	SAU: {
		exports: ['Petróleo', 'Petroquímicos', 'Plásticos', 'Metais'],
		imports: ['Máquinas', 'Veículos', 'Eletrônicos', 'Alimentos', 'Farmacêuticos'],
		exportPartners: ['China', 'Índia', 'Japão', 'Coreia do Sul'],
		importPartners: ['China', 'Emirados Árabes', 'Estados Unidos', 'Alemanha'],
		year: 2024
	},
	ZAF: {
		exports: ['Ouro', 'Platina', 'Carvão', 'Minério de ferro', 'Veículos'],
		imports: ['Máquinas', 'Petróleo', 'Eletrônicos', 'Veículos', 'Farmacêuticos'],
		exportPartners: ['China', 'Estados Unidos', 'Alemanha', 'Índia'],
		importPartners: ['China', 'Alemanha', 'Estados Unidos', 'Índia'],
		year: 2024
	},
	ARG: {
		exports: ['Soja', 'Milho', 'Carne bovina', 'Trigo', 'Lítio'],
		imports: ['Máquinas', 'Veículos', 'Eletrônicos', 'Combustíveis', 'Químicos'],
		exportPartners: ['Brasil', 'China', 'Estados Unidos', 'Chile'],
		importPartners: ['Brasil', 'China', 'Estados Unidos', 'Alemanha'],
		year: 2024
	},
	CHL: {
		exports: ['Cobre', 'Lítio', 'Frutas', 'Salmão', 'Vinho'],
		imports: ['Máquinas', 'Veículos', 'Eletrônicos', 'Combustíveis', 'Químicos'],
		exportPartners: ['China', 'Estados Unidos', 'Japão', 'Coreia do Sul'],
		importPartners: ['China', 'Estados Unidos', 'Brasil', 'Argentina'],
		year: 2024
	},
	COL: {
		exports: ['Petróleo', 'Café', 'Carvão', 'Flores', 'Ouro'],
		imports: ['Máquinas', 'Eletrônicos', 'Veículos', 'Combustíveis', 'Químicos'],
		exportPartners: ['Estados Unidos', 'China', 'Panamá', 'Equador'],
		importPartners: ['Estados Unidos', 'China', 'México', 'Brasil'],
		year: 2024
	}
};

export const tradeSource = {
	name: 'World Bank WDI · OEC · CIA World Factbook',
	url: 'https://oec.world/',
	note: 'Percentuais do World Bank; produtos e parceiros são um recorte curado e parcial.'
} as const;

export function tradeFor(code: string): TradeProfile | null {
	return tradeByCountry[code] ?? null;
}
