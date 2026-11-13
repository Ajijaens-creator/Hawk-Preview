/* HAWK four-portal · NB 03 Master Marketing Budget 2027 browser checks (klik nyata, role demo).
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/budget2027.e2e.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const go = async (r) => { await p.goto(BASE + 'commercial.html#' + r); await p.waitForTimeout(150); };
  const b = () => p.evaluate(() => window.HL.state.cx.b27);
  const setRole = async (r) => { await p.selectOption('#role', r); await p.waitForTimeout(120); };
  const kpi = (i) => p.locator('.kpis .kpi').nth(i).locator('.val').innerText();
  await go('screens'); await p.click('[data-action=reset]');
  await go('commercial'); await setRole('commercial-manager');
  const nav = (await p.locator('#nav .nav-mod.active a > span:nth-child(2)').allInnerTexts()).slice(0, 3).map(s => s.split('\n')[0]).join('|');
  ok('Sidebar: Executive Summary → Commercial Budget → Master Budget 2027', nav === 'Executive Summary|Commercial Budget|Master Budget 2027', nav);
  await go('budget-2027');
  ok('Envelope Commercial: 6% × Rp40 miliar, porsi non-People 85% = Rp 2.040.000.000', (await kpi(0)) === 'Rp 2.040.000.000' && (await p.locator('.kpis .kpi').nth(0).innerText()).includes('Rp 40.000.000.000'));
  const q = await p.locator('tbody tr').filter({ hasText: 'Q1' }).first().locator('td').allInnerTexts();
  const sum = q[1].split('+').map(x => Number(x.replace(/\D/g, ''))).reduce((a, c) => a + c, 0);
  ok('Q1 = Jan + Feb + Mar (tabel tiga bulanan)', sum === Number(q[2].replace(/\D/g, '')), q[2]);
  await go('budget-2027?period=Q1'); const vq = await kpi(1);
  let m = 0; for (const mo of ['1', '2', '3']) { await go('budget-2027?period=' + mo); m += Number((await kpi(1)).replace(/\D/g, '')); }
  ok('Filter Q1 = jumlah filter Jan, Feb, Mar', Number(vq.replace(/\D/g, '')) === m, vq);
  ok('Marketing Manager: People tidak muncul di tree', !(await (await go('budget-2027'), p.locator('main').innerText())).includes('CAT-PPL'));
  await go('budget-2027?view=people');
  const pv = await p.locator('main').innerText();
  ok('Deep link People Cost sebagai Marketing Manager hanya menampilkan persentase', pv.includes('15%') && !pv.includes('PB27-') && !/rencana Rp/.test(pv));
  /* allocation */
  await go('budget-2027?view=allocation');
  ok('Marketing Manager tidak punya input persentase People', (await p.locator('#w-CAT-PPL').count()) === 0);
  await p.fill('#w-CAT-DGT', '50'); await p.click('form[data-submit="cx:b27-weights"] > .btn'); await p.waitForTimeout(120);
  ok('Simpan persentase yang tidak 100% ditolak', (await p.locator('main').innerText()).includes('harus 100%') && (await b()).weights['CAT-DGT'] === 40);
  /* add + edit draft, submit, approve, post */
  await go('budget-2027?view=lines');
  await p.click('.new-content > summary');
  const f = p.locator('form[data-submit="cx:b27-line-save"]');
  await f.locator('[name=sub]').fill('Paid Ads'); await f.locator('[name=child]').fill('Meta'); await f.locator('[name=detail]').fill('Meta Ads Februari Center');
  await f.locator('[name=month]').selectOption('2'); await f.locator('[name=unitCost]').fill('20000000'); await f.locator('[name=request]').fill('18000000');
  await f.locator('button').click(); await p.waitForTimeout(150);
  const line = (await b()).lines.slice(-1)[0];
  ok('Tambah draft budget line', line.detail === 'Meta Ads Februari Center' && line.status === 'draft', line.id);
  await go(`budget-2027?view=lines&edit=${line.id}`);
  await p.locator('form[data-submit="cx:b27-line-save"] [name=detail]').fill('Meta Ads Februari Center v2'); await p.locator('form[data-submit="cx:b27-line-save"] button').click(); await p.waitForTimeout(150);
  ok('Edit draft', (await b()).lines.find(l => l.id === line.id).detail.endsWith('v2'));
  await go('budget-2027?view=lines&edit=BL27-005');
  await p.locator('form[data-submit="cx:b27-line-save"] [name=unitCost]').fill('500000000'); await p.locator('form[data-submit="cx:b27-line-save"] button').click(); await p.waitForTimeout(150);
  ok('Rencana yang melewati alokasi kategori ditolak dengan pesan', (await p.locator('main').innerText()).includes('melewati alokasi'));
  await go('budget-2027?view=lines'); const left0 = await kpi(4);
  await p.click(`[data-action="cx:b27-submit"][data-id="${line.id}"]`); await p.waitForTimeout(120);
  ok('Ajukan MRF: Commercial Manager tidak melihat tombol Setujui', (await p.locator(`[data-action="cx:b27-approve"][data-id="${line.id}"]`).count()) === 0);
  await setRole('finance-manager'); await go('budget-2027?view=lines');
  await p.click(`[data-action="cx:b27-approve"][data-id="${line.id}"]`); await p.waitForTimeout(120);
  const leftA = await kpi(4);
  await p.click(`[data-action="cx:b27-post"][data-id="${line.id}"]`); await p.waitForTimeout(120);
  const leftP = await kpi(4), l2 = (await b()).lines.find(l => l.id === line.id);
  ok('Approve mengurangi sisa sebesar MRF; posting penuh tidak mengubah sisa', Number(left0.replace(/\D/g, '')) - Number(leftA.replace(/\D/g, '')) === 18e6 && leftA === leftP && l2.status === 'posted' && l2.actual === 18e6, `${left0} → ${leftA} → ${leftP}`);
  await go(`budget-2027?view=lines&open=${line.id}`);
  ok('Jejak baris: MRF, posting, dan histori status', (await p.locator('main').innerText()).includes('PST27-') && (await p.locator('.history li').count()) >= 4);
  await go('budget-2027?view=effect');
  const eff = await p.locator('main').innerText();
  ok('Efektivitas: branding dinilai dari milestone; campaign pending evidence POS 2027', eff.includes('Milestone brand') && eff.includes('Pending evidence'));
  /* People: HRD → Finance */
  await setRole('hrd'); await go('budget-2027?view=people');
  await p.click('form[data-submit="cx:b27-people-batch"] button'); await p.waitForTimeout(100);
  await p.click('form[data-submit="cx:b27-people-batch"] button'); await p.waitForTimeout(100);
  ok('HRD kirim batch People dua kali → satu batch (tidak dobel)', (await b()).peopleBatches.length === 1 && (await b()).peopleBatches[0].status === 'Dikirim ke Finance');
  await setRole('finance-manager'); await go('budget-2027?view=people');
  await p.click('[data-action="cx:b27-people-post"]'); await p.waitForTimeout(100);
  ok('Finance merekonsiliasi dan memposting batch ke 7P People', (await b()).peopleBatches[0].status === 'Diposting');
  await setRole('commercial-manager'); await go('budget-2027');
  ok('Dashboard Commercial tetap tanpa People setelah posting batch', !(await p.locator('main').innerText()).includes('PB27-'));
  /* 390 px */
  const mb = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  let worst = ['', 0];
  for (const r of ['budget-2027', 'budget-2027?view=allocation', 'budget-2027?view=lines', 'budget-2027?view=effect', 'budget-2027?view=people', 'budget-2027?view=workbook']) { await mb.goto(BASE + 'commercial.html#' + r); await mb.waitForTimeout(120); const w = await mb.evaluate(() => document.documentElement.scrollWidth); if (w > worst[1]) worst = [r, w]; }
  ok('390 px: tanpa scroll horizontal di 6 tampilan Budget 2027', worst[1] <= 390, worst.join(' '));
  ok('Tidak ada console error', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`);
  fs.writeFileSync(path.join(__dirname, 'budget2027-results.json'), JSON.stringify({ ranAt: new Date().toISOString(), base: BASE, pass: out.length - fail, fail, results: out }, null, 1));
  process.exit(fail ? 1 : 0);
})();
