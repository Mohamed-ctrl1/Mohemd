const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const f = process.argv[2];
  await p.goto('file://' + f);
  await p.waitForTimeout(900);
  await p.pdf({ path: f.replace(/\.html$/, '.pdf'), format: 'A4', printBackground: true });
  await b.close();
})();
