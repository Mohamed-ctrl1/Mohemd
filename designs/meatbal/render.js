const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  for (const f of process.argv.slice(2)) {
    await p.goto('file://' + f);
    await p.waitForTimeout(700);
    await p.locator('.stage').screenshot({ path: f.replace(/\.html$/, '.png') });
  }
  await b.close();
})();
