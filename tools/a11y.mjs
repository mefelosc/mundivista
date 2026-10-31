#!/usr/bin/env node
/** Auditoria de acessibilidade com axe-core contra o preview. */
import { existsSync } from 'node:fs';
import { firefox } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const candidates = [
	process.env.PLAYWRIGHT_FIREFOX_PATH,
	`${process.env.HOME}/.cache/ms-playwright/firefox-1555/firefox/firefox`
].filter(Boolean);
const executablePath = candidates.find((candidate) => existsSync(candidate));
const pages = [
	['/', 'light'],
	['/explore', 'light'],
	['/explore?country=BRA&layer=economy', 'dark'],
	['/explore?layer=political&country=BRA', 'light'],
	['/explore?projection=globe', 'dark'],
	['/country/BRA', 'light'],
	['/paises', 'light'],
	['/play', 'dark'],
	['/sobre', 'light']
];
const browser = await firefox.launch(executablePath ? { executablePath } : {});
let total = 0;

for (const [url, theme] of pages) {
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
	await context.addInitScript((value) => localStorage.setItem('mundivista:theme', value), theme);
	const page = await context.newPage();
	await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1800);
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();
	const relevant = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
	total += relevant.length;
	console.log(`\n${url} (${theme}): ${relevant.length} violação(ões) séria(s)`);
	for (const violation of relevant) {
		console.log(`  · [${violation.impact}] ${violation.id}: ${violation.help}`);
		for (const node of violation.nodes.slice(0, 3)) {
			console.log(`    ${node.target.join(' ')} — ${node.failureSummary?.split('\n')[1] ?? ''}`);
		}
	}
	await context.close();
}

await browser.close();
console.log(`\nTotal: ${total}`);
process.exit(total ? 1 : 0);
