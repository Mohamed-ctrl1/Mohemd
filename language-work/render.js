const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 1 });
  await p.goto('file://' + process.argv[2]);
  await p.waitForTimeout(800);
  await p.locator('.stage').screenshot({ path: process.argv[2].replace(/\.html$/, '.png') });
  await p.pdf({ path: process.argv[2].replace(/\.html$/, '.pdf'), format: 'A4', printBackground: true });
  await b.close();
})();
