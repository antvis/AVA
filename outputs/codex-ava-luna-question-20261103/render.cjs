const { chromium } = require('/private/tmp/ava-notebook-clean-ci/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || fs.existsSync(output)) throw new Error('Provide input and a new output path');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Users/banxuan/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      height: document.documentElement.scrollHeight,
      clipped: [...document.querySelectorAll('[data-fit]')].filter(e => e.scrollHeight > e.clientHeight+1 || e.scrollWidth > e.clientWidth+1).map(e => e.dataset.fit),
    }));
    if (geometry.width > geometry.viewport || geometry.clipped.length || errors.length) throw new Error(JSON.stringify({geometry,errors}));
    await page.screenshot({ path: output, fullPage: true });
    console.log(JSON.stringify({ output, geometry, errors }));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
