/* HAWK Operational · NP-HAWK-OP-DASHBOARD-002 Sembunyikan D09 Tripadvisor & D10 Maintenance dari navigasi (Playwright)
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/op-hide-dashboards.e2e.js
   Hanya visibilitas menu. Baseline akses per role diambil dari main cfcfdf7 (audit Phase 1, 28 Nov 2026). DATA DEMO / SIMULASI. */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const HIDDEN = ['tripadvisor', 'maintenance'];
const ORDER12 = ['Revenue Overview', 'Profit & Loss', 'Capacity & Productivity', 'Waste & Accuracy', 'Customer Review', 'Customer Satisfaction', 'Rebooking Customer', 'Handling Complain', 'Grading FO', 'Team Competency', 'Grooming Karyawan', 'Bisnis Proses'];
/* jumlah dashboard yang boleh diakses per role sebelum perubahan (tidak boleh berubah: RBAC tetap) */
const ACCESS = { manager: 14, assistant: 14, hospitality: 14, supervisor: 14, 'head-reception': 9, 'head-therapist': 3, 'head-attendant': 5, reception: 7, therapist: 1, attendant: 3, security: 2 };
const roleKey = (a) => a.role === 'head' ? 'head-' + a.dept : a.role;
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::ERR_/.test(m.text())) errors.push(m.text()); });
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n) => { if (SHOTS) { await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const as = (id) => ev(i => OPX.actions['account-select']({ dataset: { id: i } }), id);
  const go = async (r) => { await p.goto(BASE + 'portal.html#' + r); await p.waitForTimeout(300); };
  const openLib = () => ev(() => { const s = [...document.querySelectorAll('#nav .nav-sec')].find(x => /Dashboard Library/.test(x.textContent)); if (s && !s.classList.contains('open')) s.querySelector('.nav-sec-btn').click(); });
  const navDash = () => ev(() => [...document.querySelectorAll('#nav a[href^="#op-analytics-"]')].filter(a => !a.hidden && !a.closest('[hidden]')).map(a => ({ id: a.getAttribute('href').slice(14), label: a.textContent.trim() })));
  const crumb = () => ev(() => (document.querySelector('.an-breadcrumb')?.textContent || '').replace(/\s+/g, ' ').trim());

  await go('op-dashboard'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);

  /* T01 konfigurasi & data tetap */
  const cfg = await ev(() => ({ hidden: OPX.analytics.NAV_HIDDEN.slice(), defs: OPX.analytics.definitions.map(d => d.id), routes: ['tripadvisor', 'maintenance'].map(id => typeof HL.REGISTRY['op-analytics-' + id] === 'function'), items: HL.PORTALS.Operational.items.filter(i => /op-analytics-(tripadvisor|maintenance)$/.test(i[0])).map(i => i[3]), seed: ['tripadvisor', 'maintenance'].map(g => OPX.analytics.ensure().records.filter(r => r.group === g).length) }));
  ok('T01 A.NAV_HIDDEN = tripadvisor, maintenance; 14 definisi & id tetap; rute tetap terdaftar', cfg.hidden.join() === HIDDEN.join() && cfg.defs.length === 14 && cfg.defs[8] === 'tripadvisor' && cfg.defs[9] === 'maintenance' && cfg.routes.every(Boolean), JSON.stringify(cfg.routes));
  ok('T02 Item menu D09/D10 berstatus "hidden" (mekanisme arsip yang sudah ada); data historis tetap ada', cfg.items.join() === 'hidden,hidden' && cfg.seed.every(n => n > 0), 'records ' + cfg.seed.join('/'));

  /* T03–T05 semua akun demo */
  const accts = await ev(() => OPX.accounts.map(a => ({ id: a.id, role: a.role, dept: a.dept })));
  const bad = [], accBad = [], cntBad = [];
  for (const a of accts) {
    await as(a.id); await go('op-dashboard');
    const nav = await navDash(); const exp = await ev(() => OPX.has('analytics') ? OPX.analytics.visibleDefinitions().filter(d => !OPX.analytics.isNavHidden(d.id)).map(d => d.id) : []);
    const acc = await ev(() => OPX.has('analytics') ? OPX.analytics.visibleDefinitions().length : 0);
    if (nav.some(n => HIDDEN.includes(n.id)) || nav.map(n => n.id).join() !== exp.join() || nav.some(n => !n.label)) bad.push(a.id + ':' + nav.map(n => n.id).join('/'));
    if (ACCESS[roleKey(a)] !== undefined && acc !== ACCESS[roleKey(a)]) accBad.push(a.id + '=' + acc);
    if (exp.length) { await go('op-analytics-' + exp[0]); const c = await crumb(); if (c !== `DASHBOARD / 01 DARI ${exp.length}`) cntBad.push(a.id + ':' + c); }
  }
  ok(`T03 ${accts.length} akun demo (semua role): D09/D10 tidak tampil di menu, sisa menu = akses existing tanpa baris kosong`, bad.length === 0, bad.slice(0, 3).join(' | '));
  ok('T04 Akses (RBAC) per role tidak berubah: Manager/Asst/Hosp/Spv 14, Head Reception 9, Head Attendant 5, Reception 7, Attendant 3, Security 2 …', accBad.length === 0, accBad.join(' '));
  ok('T05 Penghitung = jumlah dashboard di menu per akun (tanpa angka 12 di-hardcode)', cntBad.length === 0, cntBad.slice(0, 3).join(' | '));

  /* T06–T08 Manager: urutan, counter, sidebar */
  await as('mgr-eni'); await go('op-analytics-revenue'); await openLib(); await p.waitForTimeout(150);
  const n12 = await navDash();
  ok('T06 Manager: 12 dashboard dalam urutan relatif semula', n12.length === 12 && n12.every((n, i) => n.label.endsWith(ORDER12[i])), n12.length + ' item');
  ok('T07 Counter Revenue "DASHBOARD / 01 DARI 12"', (await crumb()) === 'DASHBOARD / 01 DARI 12', await crumb());
  await shot('AFTER-01-revenue-sidebar');
  await go('op-analytics-complaints'); await openLib(); const cc = await crumb();
  const seq = n12.map(n => n.id); const k = seq.indexOf('complaints');
  ok('T08 Urutan navigasi: Handling Complain → Grading FO (08 → 09 DARI 12)', cc === 'DASHBOARD / 08 DARI 12' && seq[k + 1] === 'grading', cc + ' → ' + seq[k + 1]);
  await shot('AFTER-02-complaints-sidebar');
  await go('op-analytics-grading'); ok('T09 Grading FO berfungsi: "09 DARI 12", diagram tampil', (await crumb()) === 'DASHBOARD / 09 DARI 12' && (await p.locator('#opx-root .an-chart-card').count()) > 0);
  ok('T10 Grup Dashboard Library tanpa placeholder/label tersembunyi untuk D09/D10', await ev(() => !document.querySelector('#nav a[href="#op-analytics-tripadvisor"], #nav a[href="#op-analytics-maintenance"]') && ![...document.querySelectorAll('#nav .nav-sec')].find(x => /Dashboard Library/.test(x.textContent)).innerText.match(/Tripadvisor|Maintenance Performance/)));

  /* T11–T13 URL langsung tetap mengikuti akses lama */
  await go('op-analytics-maintenance');
  const dm = await ev(() => ({ h1: document.querySelector('#view h1')?.textContent, cards: document.querySelectorAll('#opx-root .an-kpis > *').length, charts: document.querySelectorAll('#opx-root .an-chart-card').length, cur: document.querySelectorAll('#nav a.cur[href^="#op-analytics-"]').length }));
  ok('T11 Manager URL langsung Maintenance: dashboard tetap lengkap, counter "TIDAK DITAMPILKAN DI MENU", tidak ada menu lain yang tersorot', dm.h1 === 'Maintenance Performance' && dm.cur === 0 && dm.cards > 0 && dm.charts > 0 && (await crumb()) === 'DASHBOARD / TIDAK DITAMPILKAN DI MENU', JSON.stringify(dm));
  await shot('AFTER-03-direct-maintenance');
  await p.click('#opx-root [data-act="analytics-tab"][data-id="entry"]'); await p.waitForTimeout(200);
  ok('T12 Tab "Data & verifikasi" D10 tetap berfungsi lewat URL langsung', await ev(() => /verifikasi|Input|Catatan/i.test(document.querySelector('#opx-root').innerText) && OPX.ui.analyticsTab === 'entry'));
  await ev(() => { OPX.ui.analyticsTab = 'dashboard'; });
  await as('reception-CTR'); await go('op-analytics-tripadvisor');
  const rt = await ev(() => ({ h1: document.querySelector('#view h1')?.textContent, charts: document.querySelectorAll('#opx-root .an-chart-card, #opx-root .an-entry, #opx-root form').length }));
  await as('therapist-CTR'); await go('op-analytics-maintenance');
  const th = await ev(() => ({ crumb: document.querySelector('.an-breadcrumb')?.textContent || '', charts: document.querySelectorAll('#opx-root .an-chart-card').length }));
  ok('T13 URL langsung: Reception tetap bisa membuka Tripadvisor, Therapist tetap ditolak untuk Maintenance (sama dengan sebelum)', rt.h1 === 'Tripadvisor Performance' && rt.charts > 0 && !th.crumb && th.charts === 0, JSON.stringify({ rt, th }));

  /* T14 tidak ada shortcut ke D09/D10 di halaman Operational mana pun */
  await as('mgr-eni'); await go('op-dashboard');
  const routes = await ev(() => [...new Set([...document.querySelectorAll('#nav a[href^="#op"]')].filter(a => !a.hidden).map(a => a.getAttribute('href').slice(1)))]);
  const leaks = [];
  for (const r of routes.concat(['op-strategic'])) { await go(r); const l = await ev(() => [...document.querySelectorAll('a[href*="op-analytics-tripadvisor"], a[href*="op-analytics-maintenance"], [data-id="tripadvisor"][data-act="analytics-open"], [data-id="maintenance"][data-act="analytics-open"]')].length); if (l) leaks.push(r + ':' + l); }
  ok(`T14 Tidak ada link/shortcut ke D09/D10 di ${routes.length + 1} halaman Operational (termasuk Dashboard Strategis)`, leaks.length === 0, leaks.join(' '));
  await go('op-strategic'); await shot('AFTER-04-strategis');
  ok('T15 Dashboard Strategis tetap tersedia di menu dan memakai data maintenance (KPI tetap dihitung)', await ev(() => !!document.querySelector('#nav a[href="#op-strategic"]') && OPX.analytics.model('maintenance').verifiedCount > 0));

  /* T16 hitungan portal */
  ok('T16 Kartu portal Operational tidak lagi menghitung D09/D10', await ev(() => HL.PORTALS.Operational.items.filter(i => /op-analytics-/.test(i[0]) && i[3] !== 'hidden').length === 12));

  /* T17 mobile */
  await p.setViewportSize({ width: 390, height: 844 }); await go('op-analytics-revenue');
  ok('T17 Mobile 390px: counter 01 DARI 12, tanpa scroll horizontal', (await crumb()) === 'DASHBOARD / 01 DARI 12' && await ev(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await p.setViewportSize({ width: 820, height: 1100 }); await go('op-analytics-grading');
  ok('T18 Tablet 820px: counter 09 DARI 12, tanpa scroll horizontal', (await crumb()) === 'DASHBOARD / 09 DARI 12' && await ev(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await p.setViewportSize({ width: 1440, height: 950 });

  /* T19 reaktivasi: NAV_HIDDEN = [] mengembalikan 14 menu di posisi semula */
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errors.push('reactivate: ' + e.message));
  await p2.route('**/ops/ops-analytics-data.js', async route => { const r = await route.fetch(); const body = (await r.text()).replace("A.NAV_HIDDEN=['tripadvisor','maintenance'];", 'A.NAV_HIDDEN=[];'); await route.fulfill({ response: r, body }); });
  await p2.goto(BASE + 'portal.html#op-analytics-tripadvisor'); await p2.waitForTimeout(500);
  await p2.evaluate(() => OPX.actions['account-select']({ dataset: { id: 'mgr-eni' } })); await p2.goto(BASE + 'portal.html#op-analytics-tripadvisor'); await p2.waitForTimeout(400);
  const re = await p2.evaluate(() => ({ hidden: OPX.analytics.NAV_HIDDEN.length, nav: [...document.querySelectorAll('#nav a[href^="#op-analytics-"]')].filter(a => !a.hidden).map(a => a.getAttribute('href').slice(14)), crumb: (document.querySelector('.an-breadcrumb')?.textContent || '').replace(/\s+/g, ' ').trim() }));
  ok('T19 Reaktivasi (NAV_HIDDEN = []): 14 menu kembali, Tripadvisor di posisi 09 DARI 14', re.hidden === 0 && re.nav.length === 14 && re.nav[8] === 'tripadvisor' && re.nav[9] === 'maintenance' && re.crumb === 'DASHBOARD / 09 DARI 14', re.crumb);
  await p2.close();

  ok('T20 Tidak ada error konsol/JS', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'op-hide-dashboards-results.json'), JSON.stringify({ at: new Date().toISOString(), pass: out.length - fail, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
