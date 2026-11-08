const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(500);
  const nvs = (process.argv[2]||'1,2,3,4,24,25,26,27,28,29,30').split(',');
  for (const nv of nvs) { await p.evaluate(n => location.hash = '#/nv/' + n, nv); await p.waitForTimeout(120); const t = await p.$eval('#view', e => e.innerText.slice(0, 80)); if (/Gagal merender|belum dirender/.test(await p.$eval('#view', e => e.innerText))) errs.push('render fail nv'+nv); }
  if (process.argv[3]) { await p.evaluate(n => location.hash = '#/nv/' + n, process.argv[3]); await p.waitForTimeout(200); await p.screenshot({ path: '/tmp/claude-0/shot.png', fullPage: false }); }
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
