#!/usr/bin/env node
/**
 * Captura screenshots comparáveis (desktop/mobile, claro/escuro).
 * Uso: node tools/screenshots.mjs [baseUrl]
 * Requer um build servido em preview (npm run preview).
 */
import { firefox } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const OUT = path.resolve(import.meta.dirname, '..', 'docs', 'screenshots');
const executablePath = `${process.env.HOME}/.cache/ms-playwright/firefox-1555/firefox/firefox`;

const shots = [
	{ name: 'landing', url: '/', theme: 'light', viewport: { width: 1440, height: 900 } },
	{ name: 'landing-dark', url: '/', theme: 'dark', viewport: { width: 1440, height: 900 } },
	{ name: 'over', url: '/sobre', theme: 'light', viewport: { width: 1440, height: 900 } },
	{ name: 'explore', url: '/explore', theme: 'light', viewport: { width: 1440, height: 900 } },
	{ name: 'explore-2d', url: '/explore?projection=flat', theme: 'light', viewport: { width: 1440, height: 900 } },
	{ name: 'explore-2d-dark', url: '/explore?projection=flat&country=BRA&layer=population', theme: 'dark', viewport: { width: 1440, height: 900 } },
	{ name: 'explore-history', url: '/explore?layer=history&year=1991', theme: 'light', viewport: { width: 1440, height: 900 } },
	{ name: 'explore-globe', url: '/explore?globe=1', theme: 'dark', viewport: { width: 1440, height: 900 } },
	{ name: 'explore-terrain', url: '/explore?terrain=1&layer=physical', theme: 'light', viewport: { width: 1440, height: 900 } },
	{ name: 'explore-dark', url: '/explore?country=BRA&layer=economy', theme: 'dark', viewport: { width: 1440, height: 900 } },
	{ name: 'explore-mobile', url: '/explore?country=BRA&layer=political', theme: 'light', viewport: { width: 390, height: 844 } },
	{ name: 'explore-mobile-dark', url: '/explore?country=JPN&layer=population', theme: 'dark', viewport: { width: 390, height: 844 } },
	{ name: 'dossier', url: '/country/BRA', theme: 'light', viewport: { width: 1440, height: 900 } },
	{ name: 'dossier-dark', url: '/country/JPN', theme: 'dark', viewport: { width: 1440, height: 900 } },
	{ name: 'play', url: '/play', theme: 'light', viewport: { width: 1440, height: 900 } },
	{ name: 'play-dark', url: '/play', theme: 'dark', viewport: { width: 1440, height: 900 } },
	{ name: 'play-mobile', url: '/play', theme: 'light', viewport: { width: 390, height: 844 } }
];

await mkdir(OUT, { recursive: true });
const browser = await firefox.launch({ executablePath });
const errors = [];

for (const shot of shots) {
	const context = await browser.newContext({ viewport: shot.viewport, deviceScaleFactor: 1 });
	await context.addInitScript((theme) => {
		localStorage.setItem('mundivista:theme', theme);
	}, shot.theme);
	const page = await context.newPage();
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(`${shot.name}: ${message.text()}`);
	});
	page.on('pageerror', (error) => errors.push(`${shot.name}: ${error.message}`));
	await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(3200);
	await page.screenshot({ path: path.join(OUT, `${shot.name}.png`), fullPage: false });
	console.log(`✓ ${shot.name}.png`);
	await context.close();
}

await browser.close();
if (errors.length) {
	console.error('\nErros de console:');
	for (const error of errors) console.error(`  · ${error}`);
} else {
	console.log('\nSem erros de console.');
}
