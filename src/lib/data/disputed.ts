/**
 * Territórios com estatuto disputado, curados um a um.
 *
 * Hachura = “não há consenso universal sobre soberania ou traçado”.
 * Não é uma classificação de legitimidade nem uma posição política do app.
 */

export interface DisputedInfo {
	label: string;
	note: string;
	source: { name: string; url: string };
}

export const disputedTerritories: Record<string, DisputedInfo> = {
	KOS: {
		label: 'Estatuto disputado',
		note: 'Kosovo declarou independência da Sérvia em 2008. O reconhecimento internacional é parcial; a Sérvia não reconhece a independência.',
		source: { name: 'Nações Unidas — Kosovo', url: 'https://www.un.org/en/about-us/member-states' }
	},
	PSX: {
		label: 'Estatuto disputado',
		note: 'Territórios palestinos ocupados. A Palestina é observadora permanente na ONU; fronteiras e estatuto final são objeto de negociação e disputa.',
		source: { name: 'Nações Unidas — Palestina', url: 'https://www.un.org/en/about-us/member-states' }
	},
	SAH: {
		label: 'Estatuto indeterminado',
		note: 'Saara Ocidental é um território não autônomo segundo a ONU. Marrocos administra a maior parte; a Frente Polisário reivindica a independência.',
		source: { name: 'Nações Unidas — Saara Ocidental', url: 'https://www.un.org/en/about-us/member-states' }
	},
	FLK: {
		label: 'Soberania disputada',
		note: 'Ilhas Malvinas/Falklands: administração britânica e reivindicação de soberania pela Argentina. O app não atribui soberania.',
		source: { name: 'Britannica — Falkland Islands', url: 'https://www.britannica.com/place/Falkland-Islands' }
	},
	KAS: {
		label: 'Estatuto indeterminado',
		note: 'Glaciar de Siachen: área de fronteira não demarcada entre Índia e Paquistão, com presença militar dos dois países.',
		source: { name: 'Britannica — Siachen Glacier', url: 'https://www.britannica.com/place/Siachen-Glacier' }
	},
	IOT: {
		label: 'Soberania disputada',
		note: 'Território Britânico do Oceano Índico (Chagos): administração britânica; Maurício reivindica soberania e a Assembleia Geral da ONU apoia a descolonização.',
		source: { name: 'CIJ — Chagos', url: 'https://www.icj-cij.org/case/169' }
	}
};

export const disputedCodes = Object.keys(disputedTerritories);

export function disputedInfo(code: string): DisputedInfo | null {
	return disputedTerritories[code] ?? null;
}
