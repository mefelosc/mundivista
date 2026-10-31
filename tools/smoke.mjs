#!/usr/bin/env node
/**
 * Smoke test de interação (Playwright/Firefox) contra o build de preview.
 * Uso: node tools/smoke.mjs [baseUrl]
 */
import { existsSync } from 'node:fs';
import { firefox } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const candidates = [
	process.env.PLAYWRIGHT_FIREFOX_PATH,
	`${process.env.HOME}/.cache/ms-playwright/firefox-1555/firefox/firefox`
].filter(Boolean);
const executablePath = candidates.find((candidate) => existsSync(candidate));
const browser = await firefox.launch(executablePath ? { executablePath } : {});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
	if (message.type() === 'error') errors.push(message.text());
});

const results = [];
async function check(name, fn) {
	try {
		await fn();
		results.push(`✓ ${name}`);
	} catch (error) {
		results.push(`✗ ${name}: ${error.message}`);
	}
}

await check('explore carrega país e camada da URL', async () => {
	await page.goto(`${BASE}/explore?country=BRA&layer=economy`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(2200);
	const title = await page.locator('.card h2').first().textContent();
	if (title !== 'Brasil') throw new Error(`card=${title}`);
	const url = page.url();
	if (!url.includes('layer=economy')) throw new Error(`url=${url}`);
});

await check('clique no mapa abre card e contorna o país', async () => {
	await page.goto(`${BASE}/explore`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(2600);
	await page.mouse.move(500, 500);
	await page.waitForTimeout(200);
	await page.mouse.click(500, 500);
	await page.waitForTimeout(1200);
	const title = await page.locator('.card h2').first().textContent();
	if (title !== 'Brasil') throw new Error(`card=${title}`);
	if (!page.url().includes('country=BRA')) throw new Error(`url=${page.url()}`);
	const toggle = page.locator('.block-action').first();
	if ((await toggle.getAttribute('aria-pressed')) !== 'false') throw new Error('vizinhos já destacados');
	await toggle.click();
	await page.waitForTimeout(250);
	if ((await toggle.getAttribute('aria-pressed')) !== 'true') throw new Error('destaque não ativou');
});

await check('pan horizontal do 2D dá a volta no mundo', async () => {
	await page.goto(`${BASE}/explore`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(2600);
	for (let i = 0; i < 4; i += 1) {
		await page.mouse.move(1200, 450);
		await page.mouse.down();
		await page.mouse.move(200, 450, { steps: 18 });
		await page.mouse.up();
		await page.waitForTimeout(1100);
	}
	await page.mouse.move(8, 10);
	await page.waitForTimeout(500);
	const readout = await page.locator('.readout-main').innerText();
	if (!/·/.test(readout)) throw new Error(`leitura inválida: ${readout}`);
	const visibleLabels = await page.locator('.map-label:visible').count();
	if (visibleLabels < 10) throw new Error(`rótulos visíveis=${visibleLabels}`);
});

await check('nomes de oceanos aparecem no mapa', async () => {
	await page.goto(`${BASE}/explore?projection=flat`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(3000);
	const oceans = await page.locator('.map-marine').allTextContents();
	if (!oceans.some((name) => /Atlântico|Pacífico|Índico/i.test(name))) {
		throw new Error(`marinhos=${oceans.slice(0, 5).join(', ')}`);
	}
});

await check('Groenlândia mostra soberania da Dinamarca', async () => {
	await page.goto(`${BASE}/explore?country=GRL`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(2600);
	const subtitle = await page.locator('.card .titles p').innerText();
	if (!/Dinamarca/.test(subtitle)) throw new Error(`subtítulo=${subtitle}`);
	const body = await page.locator('.card .body').innerText();
	if (!/soberania/i.test(body) || !/Dinamarca/.test(body)) throw new Error('sem linha de soberania');
});

await check('command palette troca de país na mesma rota', async () => {
	await page.keyboard.press('Control+k');
	await page.waitForTimeout(200);
	await page.locator('.palette input').fill('Japão');
	await page.waitForTimeout(250);
	await page.locator('.palette .results button').first().click();
	await page.waitForTimeout(1800);
	const title = await page.locator('.card h2').first().textContent();
	if (title !== 'Japão') throw new Error(`card=${title}`);
	if (!page.url().includes('country=JPN')) throw new Error(`url=${page.url()}`);
});

await check('configurações abre e alterna som', async () => {
	await page.locator('.settings-toggle').click();
	await page.waitForTimeout(250);
	const button = page.locator('.settings-panel .sound-toggle');
	await button.click();
	await page.waitForTimeout(200);
	if ((await button.getAttribute('aria-pressed')) !== 'false') throw new Error('som não desligou');
	await button.click();
	await page.waitForTimeout(200);
	if ((await button.getAttribute('aria-pressed')) !== 'true') throw new Error('som não religou');
	await page.locator('.settings-panel .close').click();
});

await check('tema muda e persiste no documento', async () => {
	await page.locator('.settings-toggle').click();
	await page.locator('.settings-panel button[aria-label="Tema escuro"]').click();
	await page.waitForTimeout(250);
	const theme = await page.evaluate(() => document.documentElement.dataset.theme);
	if (theme !== 'dark') throw new Error(`tema=${theme}`);
	await page.locator('.settings-panel .close').click();
});

await check('idioma alterna para inglês e volta ao português', async () => {
	await page.locator('.settings-toggle').click();
	await page.locator('.settings-panel .segmented button', { hasText: 'English' }).click();
	await page.waitForTimeout(300);
	if (!/Explore/.test(await page.locator('nav a').first().innerText())) throw new Error('nav não traduziu');
	await page.locator('.settings-panel .segmented button', { hasText: 'Português' }).click();
	await page.waitForTimeout(300);
	if (!/Explorar/.test(await page.locator('nav a').first().innerText())) throw new Error('nav não voltou ao PT');
	await page.locator('.settings-panel .close').click();
});

await check('mapa 2D é o padrão, sem camada temática', async () => {
	await page.goto(`${BASE}/explore`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(3000);
	const projectionActive = await page.locator('.segmented button.active').innerText();
	if (projectionActive.trim() !== '2D') throw new Error(`projeção=${projectionActive}`);
	const active = await page.locator('.layers button.active .label').innerText();
	if (active !== 'Padrão') throw new Error(`camada=${active}`);
	if (page.url().includes('layer=')) throw new Error(`url=${page.url()}`);
	if (!(await page.locator('button[title^="Relevo disponível"]').isDisabled())) {
		throw new Error('relevo deveria estar desativado no 2D');
	}
	if (await page.locator('.map-failed').count()) throw new Error('mapa falhou no 2D');
});

await check('camada política mostra unidades e estados ao clicar no país', async () => {
	await page.goto(`${BASE}/explore?layer=political&country=BRA`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(3200);
	const active = await page.locator('.layers button.active .label').innerText();
	if (active !== 'Político') throw new Error(`camada=${active}`);
	const units = await page.locator('.units button').count();
	if (units !== 18) throw new Error(`unidades visíveis=${units}`);
	const more = await page.locator('.units-block .more').innerText();
	if (!/27/.test(more)) throw new Error(`contagem=${more}`);
	const names = await page.locator('.units button span').allTextContents();
	if (!names.includes('Acre') || !names.includes('Amazonas')) {
		throw new Error(`nomes=${names.slice(0, 4).join(', ')}`);
	}
	await page.locator('.units button').first().click();
	await page.waitForTimeout(1800);
	const current = await page.locator('.units button.active span').innerText();
	if (current !== 'Acre') throw new Error(`unidade ativa=${current}`);
	if (!(await page.locator('.map-unit').count())) throw new Error('rótulos das unidades ausentes');
});

await check('clicar de novo na camada volta ao mapa padrão', async () => {
	await page.locator('.layers button', { hasText: 'Político' }).click();
	await page.waitForTimeout(900);
	const active = await page.locator('.layers button.active .label').innerText();
	if (active !== 'Padrão') throw new Error(`camada=${active}`);
	if (page.url().includes('layer=')) throw new Error(`url=${page.url()}`);
	if (await page.locator('.units').count()) throw new Error('unidades continuam visíveis');
});

await check('globo 3D alterna sem reload e ativa relevo', async () => {
	await page.locator('.segmented button', { hasText: 'Globo' }).click();
	await page.waitForTimeout(2800);
	const projectionActive = await page.locator('.segmented button.active').innerText();
	if (!/globo/i.test(projectionActive)) throw new Error(`projeção=${projectionActive}`);
	if (!page.url().includes('projection=globe')) throw new Error(`projeção: url=${page.url()}`);
	if (await page.locator('button[title^="Relevo disponível"]').count()) {
		throw new Error('relevo continuou desativado no globo');
	}
	await page.locator('button[title="Relevo 3D com modelo digital de elevação"]').click();
	await page.waitForTimeout(1600);
	if (!page.url().includes('terrain=1')) throw new Error(`relevo: url=${page.url()}`);
	const pitch = await page.locator('.map-canvas').getAttribute('data-pitch');
	if (Number(pitch) < 30) throw new Error(`pitch=${pitch}`);
});

await check('2D Equal Earth volta e desativa relevo', async () => {
	await page.locator('.segmented button[title^="Mapa 2D"]').click();
	await page.waitForTimeout(2800);
	const projectionActive = await page.locator('.segmented button.active').innerText();
	if (projectionActive.trim() !== '2D') throw new Error(`projeção=${projectionActive}`);
	if (page.url().includes('projection=flat') || page.url().includes('terrain=1')) {
		throw new Error(`url=${page.url()}`);
	}
	if (!(await page.locator('button[title^="Relevo disponível"]').isDisabled())) {
		throw new Error('relevo deveria voltar a ficar desativado');
	}
});

await check('jogo de silhuetas inicia e aceita tecla 1', async () => {
	await page.goto(`${BASE}/game/silhouettes`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(800);
	await page.getByRole('button', { name: /Começar/ }).click();
	await page.waitForTimeout(500);
	const options = await page.locator('.options button').count();
	if (options !== 4) throw new Error(`opções=${options}`);
	await page.keyboard.press('1');
	await page.waitForTimeout(500);
	const feedback = await page.locator('.feedback').count();
	if (feedback !== 1) throw new Error('sem feedback');
});

await check('modo lista funciona no jogo de mapa', async () => {
	await page.goto(`${BASE}/game/country-finder`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(700);
	await page.getByRole('button', { name: /Começar/ }).click();
	await page.waitForTimeout(300);
	await page.getByRole('button', { name: /Modo lista/ }).click();
	await page.waitForTimeout(200);
	const rows = await page.locator('.list-mode li button').count();
	if (!rows) throw new Error('lista vazia');
	await page.locator('.list-mode li button').first().click();
	await page.waitForTimeout(500);
	const feedback = await page.locator('.feedback').count();
	if (feedback !== 1) throw new Error('sem feedback');
});

await check('bandeira cobre o território ao acertar o país', async () => {
	await page.goto(`${BASE}/game/country-finder`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1000);
	const start = page.locator('.intro-actions .primary');
	if (await start.count()) await start.click();
	await page.waitForTimeout(700);
	const prompt = await page.locator('.prompt h1').innerText();
	const target = prompt.split(':').pop().trim();
	await page.getByRole('button', { name: /Modo lista/ }).click();
	await page.locator('.list-search input').fill(target);
	await page.waitForTimeout(350);
	await page.locator('.list-mode li button').first().click();
	await page.waitForTimeout(900);
	const flag = page.locator('.territory-flag');
	if (!(await flag.count())) throw new Error('bandeira ausente');
	const box = await flag.boundingBox();
	if (!box || box.width < 20 || box.height < 20) throw new Error(`bandeira pequena: ${JSON.stringify(box)}`);
	// O acerto agenda a próxima rodada sozinho.
	await page.waitForTimeout(1100);
	const nextPrompt = await page.locator('.prompt h1').innerText().catch(() => '');
	if (!nextPrompt || nextPrompt === prompt) throw new Error('acerto não avançou sozinho');
});

await check('erro não avança sozinho', async () => {
	await page.goto(`${BASE}/game/country-finder`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(800);
	const start = page.locator('.intro-actions .primary');
	if (await start.count()) await start.click();
	await page.waitForTimeout(500);
	const prompt = await page.locator('.prompt h1').innerText();
	const target = prompt.split(':').pop().trim();
	const wrong = target === 'Brasil' ? 'Argentina' : 'Brasil';
	await page.getByRole('button', { name: /Modo lista/ }).click();
	await page.locator('.list-search input').fill(wrong);
	await page.waitForTimeout(300);
	await page.locator('.list-mode li button').first().click();
	await page.waitForTimeout(1700);
	if (!(await page.locator('.feedback').count())) throw new Error('feedback sumiu no erro');
	const still = await page.locator('.prompt h1').innerText();
	if (still !== prompt) throw new Error('erro avançou sozinho');
});

await check('índice de países carrega e busca', async () => {
	await page.goto(`${BASE}/paises`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(600);
	await page.locator('.search input').fill('Brasil');
	await page.waitForTimeout(200);
	const rows = await page.locator('.countries .country').count();
	if (rows !== 1) throw new Error(`linhas=${rows}`);
});

await check('dossiê estático carrega com comparação', async () => {
	await page.goto(`${BASE}/country/BRA`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(600);
	const heading = await page.locator('h1').first().textContent();
	if (heading?.trim() !== 'Brasil') throw new Error(`h1=${heading}`);
	const compare = await page.locator('.compare-row').count();
	if (compare < 3) throw new Error(`comparações=${compare}`);
});

await browser.close();
console.log(results.join('\n'));
if (errors.length) {
	console.error('\nErros de console:');
	for (const error of errors) console.error(`  · ${error}`);
}
if (results.some((line) => line.startsWith('✗')) || errors.length) process.exit(1);
