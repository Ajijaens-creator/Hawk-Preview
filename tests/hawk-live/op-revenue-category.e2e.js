/* HAWK Operational · NP-HAWK-OP-REVENUE-001 Diagram 02 Revenue Category (Playwright, klik nyata)
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/op-revenue-category.e2e.js
   DATA DEMO / SIMULASI. Baseline Diagram 03 diambil dari main d9b003f (audit Phase 1, 28 Nov 2026). */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const CATS = ['Service', 'Package', 'Product', 'Gift Card', 'Member'];
const COLORS = ['#095B32', '#E5A34B', '#B53F3E', '#AEC363', '#65839E'];
/* Baseline Diagram 03 (Revenue by outlet) sebelum perubahan, harus identik */
const D03 = {
  'all|2026-10-01|2026-10-31': { cats: ['Ubud Center', 'Shanti', 'Triloka', 'Bisma'], s: [92110000, 102610000, 113110000, 124820000], r: [8070000, 8115000, 8160000, 8205000], total: 465200000 },
  'all|2026-01-01|2026-10-31': { cats: ['Ubud Center', 'Shanti', 'Triloka', 'Bisma'], s: [807429600, 902022600, 993312300, 1094439300], r: [71030250, 71419050, 71589150, 71759250], total: 4083001500 },
  'CTR|2026-10-01|2026-10-31': { cats: ['Ubud Center'], s: [92110000], r: [8070000], total: 100180000 },
  'CTR|2026-01-01|2026-10-31': { cats: ['Ubud Center'], s: [807429600], r: [71030250], total: 878459850 },
};
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::ERR_/.test(m.text())) errors.push(m.text()); });
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n, loc) => { if (SHOTS) { await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await (loc || p).screenshot({ path: path.join(SHOTS, n + '.png') }); } };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const as = (id) => ev(i => OPX.actions['account-select']({ dataset: { id: i } }), id);
  const go = async (r) => { await p.goto(BASE + 'portal.html#' + r); await p.waitForTimeout(400); };
  const setF = (o, f, t) => ev(([o, f, t]) => { if (o) OPX.state.outletId = o; OPX.ui.analyticsFrom = f; OPX.ui.analyticsTo = t; OPX.save(); OPX.render(); }, [o, f, t]);
  const model = () => ev(() => { const m = OPX.analytics.model('revenue'); return { total: m.cards.find(c => c.key === 'total').value, ids: m.charts.map(c => c.id), d02: m.charts.find(c => c.id === 'revenue-composition'), d03: m.charts.find(c => c.id === 'revenue-outlet') }; });
  const d02 = () => p.locator('#opx-root .an-chart-card[data-chart-id="revenue-composition"]');
  const d03 = () => p.locator('#opx-root .an-chart-card[data-chart-id="revenue-outlet"]');
  const dom = (sel) => ev(s => { const c = document.querySelector(s); if (!c) return null; return { idx: c.querySelector('.an-widget-index')?.textContent, title: c.querySelector('h3')?.textContent, text: c.innerText, rows: [...c.querySelectorAll('.an-donut-row')].map(r => ({ name: r.querySelector('span').textContent, pct: r.querySelector('strong').textContent, amt: r.querySelector('small').textContent, color: getComputedStyle(r.querySelector('i')).backgroundColor })), strokes: [...c.querySelectorAll('svg circle[stroke-dasharray]')].map(x => x.getAttribute('stroke')), center: [...c.querySelectorAll('svg text')].map(t => t.textContent), legendCols: (() => { const l = c.querySelector('.an-donut-legend'); return l ? getComputedStyle(l).gridTemplateColumns.split(' ').length : 0; })(), html: c.innerHTML }; }, sel);
  const hex2rgb = h => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;

  await go('op-dashboard'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
  await as('mgr-eni'); await go('op-analytics-revenue'); await setF('all', '2026-10-01', '2026-10-31');

  /* T01–T05 struktur Diagram 02 */
  let m = await model(), D = await dom('#opx-root .an-chart-card[data-chart-id="revenue-composition"]');
  ok('T01 Urutan diagram tetap (D01 trend, D02 kategori, D03 outlet)', m.ids.join() === 'service-trend,revenue-composition,revenue-outlet', m.ids.join());
  ok('T02 Diagram 02 berjudul "Revenue Category" dengan label DIAGRAM 02', D.idx === 'DIAGRAM 02' && D.title === 'Revenue Category', `${D.idx} · ${D.title}`);
  ok('T03 5 kategori urut Service, Package, Product, Gift Card, Member', m.d02.categories.join() === CATS.join() && D.rows.map(r => r.name).join() === CATS.join(), D.rows.map(r => r.name).join());
  ok('T04 Warna sesuai spesifikasi (data, legend, segmen)', m.d02.colors.join() === COLORS.join() && D.rows.every((r, i) => r.color === hex2rgb(COLORS[i])) && D.strokes.every(s => COLORS.includes(s)), D.strokes.join());
  ok('T05 Tengah donut = total + label "Total Revenue"', D.center[1] === 'Total Revenue' && D.center[0] === '465,2 jt', D.center.join(' | '));
  ok('T06 Legend 2 kolom di desktop, menampilkan nominal dan %', D.legendCols === 2 && D.rows.every(r => /%$/.test(r.pct) && /Rp/.test(r.amt)), `${D.legendCols} kolom`);
  ok('T07 Label SIMULASI terlihat karena Package/Gift Card/Member belum ada di sumber', /SIMULASI/.test(D.text) && m.d02.simulated === true);
  ok('T08 Tanpa NaN / undefined / Infinity di Diagram 02', !/NaN|undefined|Infinity/.test(D.text));
  await shot('RC-01-d02-desktop', d02());

  /* T09 rekonsiliasi: jumlah D02 = kartu Total revenue untuk 4 kombinasi filter; D03 identik baseline */
  const recon = [], d03diff = [];
  for (const k of Object.keys(D03)) {
    const [o, f, t] = k.split('|'); await setF(o, f, t); const mm = await model(); const b = D03[k];
    const s = mm.d02.series[0].values.reduce((a, v) => a + v, 0);
    if (s !== mm.total || mm.total !== b.total) recon.push(`${k}: d02=${s} card=${mm.total}`);
    const d = mm.d03;
    if (d.title !== 'Revenue by outlet' || d.type !== 'stacked' || d.orientation !== 'horizontal' || d.categories.join() !== b.cats.join() || d.series.map(x => x.name).join() !== 'Service,Retail' || d.series.map(x => x.color).join() !== '#065b2b,#dfa24d' || d.series[0].values.join() !== b.s.join() || d.series[1].values.join() !== b.r.join() || d.metricKey !== 'total' || d.direction !== 'higher') d03diff.push(k);
    if (k.startsWith('all|2026-10')) await shot('RC-02-d03-unchanged', d03());
  }
  ok('T09 Total Diagram 02 = kartu Total revenue = baseline, 4 kombinasi outlet/periode', recon.length === 0, recon.join(' | '));
  ok('T10 Diagram 03 identik dengan baseline main d9b003f (judul, tipe, seri, warna, nilai)', d03diff.length === 0, d03diff.join(' | '));
  await setF('all', '2026-10-01', '2026-10-31');
  const D3 = await dom('#opx-root .an-chart-card[data-chart-id="revenue-outlet"]');
  ok('T11 DOM Diagram 03 tetap: DIAGRAM 03, "Revenue by outlet", legend Service/Retail, tanpa elemen Revenue Category', D3.idx === 'DIAGRAM 03' && D3.title === 'Revenue by outlet' && /Service/.test(D3.text) && /Retail/.test(D3.text) && !/an-donut-category|SIMULASI|Total Revenue/.test(D3.html));

  /* T12 detail & insight khusus kategori */
  await p.click('#opx-root .an-chart-card[data-chart-id="revenue-composition"] .an-donut-row >> nth=3'); await p.waitForTimeout(250);
  const det = await ev(() => { const t = document.querySelector('[data-revenue-category-detail]'); const mt = document.querySelector('.modal')?.innerText || document.body.innerText; return t ? { rows: [...t.querySelectorAll('tbody tr')].map(r => r.innerText.split('\t')[0].trim()), focus: t.querySelector('tr.is-focus')?.innerText.split('\t')[0].trim(), foot: t.querySelector('tfoot').innerText, text: mt } : null; });
  ok('T12 Detail: tabel 5 kategori + Total Revenue, baris yang diklik disorot, aturan pengakuan GC/Member tampil', !!det && det.rows.join() === CATS.join() && det.focus === 'Gift Card' && /Total Revenue/.test(det.foot) && /deposit gift card/.test(det.text) && /fee membership/.test(det.text) && !/NaN/.test(det.text), det ? det.focus + ' · ' + det.foot : 'tidak ada');
  await shot('RC-03-detail', p);
  await ev(() => OPX.closeModal && OPX.closeModal());
  await p.click('#opx-root .an-chart-card[data-chart-id="revenue-composition"] [data-act="analytics-insight"]'); await p.waitForTimeout(250);
  const ins = await ev(() => document.querySelector('.modal')?.innerText || '');
  ok('T13 Insight memakai konteks kategori dan tidak menilai baik/buruk kategori', /Gift Card \(redeem\)/.test(ins) && /tidak berarti baik atau buruk/.test(ins) && !/service\/retail/.test(ins), ins.slice(0, 80));
  await ev(() => OPX.closeModal && OPX.closeModal());
  const sum3 = await ev(() => document.querySelector('#opx-root .an-chart-card[data-chart-id="revenue-outlet"] .an-insight-slot').innerText);
  ok('T14 Ringkasan insight Diagram 03 tetap generik', /Komposisi \/ distribusi|Standar belum ditetapkan|Sesuai|Perlu|Acuan/.test(sum3) && !/Porsi terbesar/.test(sum3), sum3.slice(0, 60));

  /* T15 donut lain tidak terpengaruh */
  const others = [];
  for (const id of ['pnl', 'reviews', 'maintenance', 'grading', 'process']) {
    await go('op-analytics-' + id); await setF('all', '2026-10-01', '2026-10-31');
    others.push(...await ev(() => [...document.querySelectorAll('#opx-root .an-chart-card')].filter(c => c.querySelector('svg.an-donut')).map(c => ({ id: c.dataset.chartId, cat: !!c.querySelector('.an-donut-category,.an-donut-sim'), caption: [...c.querySelectorAll('svg text')].map(t => t.textContent)[1] }))));
  }
  ok('T15 Donut lain tetap memakai renderer bawaan (tanpa varian kategori, caption lama)', others.length >= 3 && others.every(o => !o.cat && ['total demo', 'distribusi'].includes(o.caption)), others.map(o => o.id + ':' + o.caption).join(', '));

  /* T16 scope akses: supervisor outlet terkunci */
  await as('spv-CTR'); await go('op-analytics-revenue'); await setF(null, '2026-10-01', '2026-10-31');
  m = await model();
  ok('T16 Supervisor Ubud: Diagram 02 hanya data outletnya, total = baseline Ubud', m.total === 100180000 && m.d02.series[0].values.reduce((a, v) => a + v, 0) === 100180000, String(m.total));
  await as('mgr-eni'); await go('op-analytics-revenue');

  /* T17 empty state */
  await setF('all', '2025-01-01', '2025-01-31');
  D = await dom('#opx-root .an-chart-card[data-chart-id="revenue-composition"]');
  ok('T17 Periode tanpa data: empty state, tanpa NaN dan tanpa pembagian nol', /Belum ada data terverifikasi/.test(D.text) && !/NaN|Infinity/.test(D.text));

  /* T18–T19 kategori nol & nilai negatif (data uji lokal, dipetakan eksplisit lewat revenueCategory) */
  await setF('CTR', '2026-10-01', '2026-10-31');
  await ev(() => { OPX.analytics.ensure().records.filter(r => r.group === 'revenue' && r.outlet === 'CTR' && r.date.startsWith('2026-10')).forEach(r => { r.values.revenueCategory = r.values.category === 'Retail' ? 'Product' : 'Service'; }); OPX.save(); OPX.render(); });
  m = await model(); D = await dom('#opx-root .an-chart-card[data-chart-id="revenue-composition"]');
  ok('T18 Kategori bernilai nol tetap tampil di legend (Rp0 / 0%) dan label SIMULASI hilang bila data sudah terpetakan', D.rows.length === 5 && ['Package', 'Gift Card', 'Member'].every(n => { const r = D.rows.find(x => x.name === n); return r && r.pct === '0%' && /Rp\s?0$/.test(r.amt); }) && !/SIMULASI/.test(D.text) && m.d02.series[0].values.reduce((a, v) => a + v, 0) === m.total, D.rows.map(r => r.name + ' ' + r.pct + ' ' + r.amt).join(' | '));
  await shot('RC-04-zero-categories', d02());
  await ev(() => { const r = OPX.analytics.ensure().records.find(r => r.group === 'revenue' && r.outlet === 'CTR' && r.date === '2026-10-05' && r.values.category === 'Retail'); r.values.revenueCategory = 'Gift Card'; r.values.amount = -500000; OPX.save(); OPX.render(); });
  m = await model(); D = await dom('#opx-root .an-chart-card[data-chart-id="revenue-composition"]');
  const gc = D.rows.find(r => r.name === 'Gift Card');
  ok('T19 Nilai negatif tidak di-clamp: tampil negatif + peringatan, total tetap = kartu', m.d02.series[0].values[3] === -500000 && /Nilai negatif pada Gift Card/.test(D.text) && /−|-/.test(gc.amt) && m.d02.series[0].values.reduce((a, v) => a + v, 0) === m.total && !/NaN/.test(D.text), gc.amt + ' · total ' + m.total);
  await shot('RC-05-negative-warning', d02());
  await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400); await as('mgr-eni');

  /* T20 mobile */
  await p.setViewportSize({ width: 390, height: 844 }); await go('op-analytics-revenue'); await setF('all', '2026-10-01', '2026-10-31');
  const mob = await ev(() => { const c = document.querySelector('#opx-root .an-chart-card[data-chart-id="revenue-composition"]'); const r = c.getBoundingClientRect(); return { over: document.documentElement.scrollWidth > window.innerWidth + 1, inside: [...c.querySelectorAll('.an-donut-row')].every(x => { const b = x.getBoundingClientRect(); return b.right <= r.right + 1 && b.left >= r.left - 1; }) }; });
  ok('T20 Mobile 390px: tanpa scroll horizontal, legend tetap di dalam kartu', !mob.over && mob.inside, JSON.stringify(mob));
  await d02().scrollIntoViewIfNeeded(); await shot('RC-06-d02-mobile', d02());

  ok('T21 Tidak ada error konsol/JS', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'op-revenue-category-results.json'), JSON.stringify({ at: new Date().toISOString(), pass: out.length - fail, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
