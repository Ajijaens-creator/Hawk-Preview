/* HAWK Mobile (hawk-live/mobile.html) + tab "HAWK Mobile" di Demo Center HRD/Operational/Commercial/Sales.
   Jalankan: python3 -m http.server 8811 & node tests/hawk-live/mobile.e2e.js */
'use strict';
const { chromium } = require('playwright');
const B = process.env.BASE || 'http://localhost:8811/hawk-live/';
let pass = 0, fail = 0;
const ok = (n, c) => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗'} ${n}`); };
(async () => {
  const b = await chromium.launch(), errs = [], ext = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => { ext.push(r.request().url()); r.abort(); });
  const p = await ctx.newPage(); p.setDefaultTimeout(10000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const labs = [['hrd.html', 'hrd-dx', 4, 'Ayu'], ['operational.html', 'ops-dx', 3, 'Ayu'], ['commercial.html', 'commercial-dx', 1, 'Raka'], ['sales.html', 'sales-dx', 1, 'Sari']];
  for (const [page, route, n, who] of labs) {
    await p.goto(B + page + '#' + route); await p.waitForSelector('#dxlab-stage .dx-tab[data-tab="mobile"]');
    await p.click('#dxlab-stage .dx-tab[data-tab="mobile"]');
    const fr = p.frameLocator('#dxlab-stage .dx-cell[data-cell="mobile"] iframe');
    const h = await fr.locator('.greeting h1').innerText();
    ok(`${route}: tab HAWK Mobile, ${n} peran, login ${who}`, (await p.$$('#dxl-mobilehead .chip')).length === n && h.includes(who));
  }
  await p.goto(B + 'operational.html#ops-dx'); await p.click('#dxlab-stage .dx-tab[data-tab="mobile"]');
  await p.click('#dxl-mobilehead .chip >> text=Spa Supervisor');
  const fr = p.frameLocator('#dxlab-stage .dx-cell[data-cell="mobile"] iframe');
  ok('Ganti peran → Supervisor (Arya)', (await fr.locator('.greeting h1').innerText()).includes('Arya'));
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  m.on('pageerror', e => errs.push(e.message));
  await m.goto(B + 'mobile.html?role=therapist');
  for (const n of ['Pekerjaan', 'Presensi', 'Inbox', 'Saya', 'Beranda']) { await m.locator('#bottom-nav').getByText(n, { exact: true }).click(); }
  ok('5 layar bisa dibuka', (await m.locator('#bottom-nav [aria-current=page]').innerText()).includes('Beranda'));
  await m.click('.attendance-hero .primary-button'); await m.click('[data-action="face"]'); await m.click('[data-action="verify"]');
  ok('Check-in simulasi menghasilkan bukti presensi', (await m.locator('#sheet .receipt-id').innerText()).startsWith('ATT-DEMO-THERAPIST'));
  ok('390 px tanpa scroll horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  ok('Tanpa request keluar', ext.length === 0);
  ok('Tanpa error konsol', errs.length === 0);
  if (errs.length) console.log(errs);
  await b.close();
  console.log(`\n${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
