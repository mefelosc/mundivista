#!/usr/bin/env node
/**
 * Smoke test de interação (Playwright/Firefox) contra o build de preview.
 * Uso: node tools/smoke.mjs [baseUrl]
 */
import { firefox } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const executablePath = `${process.env.HOME}/.cache/ms-playwright/firefox-1555/firefox/firefox`;
const browser = await firefox.launch({ executablePath });
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

await check('tema muda e persiste no documento', async () => {
	await page.locator('.theme-full button[aria-label="Tema escuro"]').click();
	await page.waitForTimeout(250);
	const theme = await page.evaluate(() => document.documentElement.dataset.theme);
	if (theme !== 'dark') throw new Error(`tema=${theme}`);
});

await check('globo e relevo são ativados sem reload', async () => {
	await page.locator('button[title="Globo 3D"]').click();
	await page.waitForTimeout(1400);
	if (!page.url().includes('globe=1')) throw new Error(`globo: url=${page.url()}`);
	await page.locator('button[title="Relevo 3D com modelo digital de elevação"]').click();
	await page.waitForTimeout(1400);
	if (!page.url().includes('terrain=1') || page.url().includes('globe=1')) {
		throw new Error(`relevo: url=${page.url()}`);
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
