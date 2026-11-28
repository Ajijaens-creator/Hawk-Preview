/* HAWK Operational · NP-OP01 UI Navigation Amendment (Aji 23 Nov 2026): Dashboard Library sebagai menu expandable
   di sidebar utama, 14 dashboard sebagai submenu langsung, panel navigasi krem di halaman dihapus.
   Frontend + fixture lokal saja. python3 -m http.server 8811 dari hawk-erp-preview/, lalu node tests/hawk-live/ops-dashlib.e2e.js
   (SHOTS=dir untuk screenshot) */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n) => { if (SHOTS) { await p.waitForTimeout(250); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const as = (id) => ev(i => OPX.actions['account-select']({ dataset: { id: i } }), id);
  const go = async (r) => { await p.goto(BASE + 'operational.html#' + r); await p.waitForTimeout(350); };
  const links = () => p.$$eval('#nav a[href^="#op-analytics"]', as => as.filter(a => !a.hidden).map(a => a.getAttribute('href').slice(1)));
  const openSec = () => ev(() => { const s = [...document.querySelectorAll('#nav .nav-sec')].find(x => /Dashboard Library/.test(x.textContent)); if (s && !s.classList.contains('open')) s.querySelector('.nav-sec-btn').click(); });
  const state = () => ev(() => ({ h1: document.querySelector('#view h1')?.textContent || '', cur: [...document.querySelectorAll('#nav a.cur')].map(a => a.getAttribute('href')), id: OPX.ui.analyticsId, aside: !!document.querySelector('.an-report-nav'), inner: document.querySelectorAll('#opx-root [data-act="analytics-open"]').length, cards: document.querySelectorAll('#opx-root .an-kpis > *').length, charts: document.querySelectorAll('#opx-root .an-chart-card').length }));

  await go('op-dashboard'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
  await as('mgr-eni'); await go('op-dashboard');
  const defs = await ev(() => OPX.analytics.definitions.filter(d => !OPX.analytics.isNavHidden(d.id)).map(d => [d.id, d.title, d.navLabel])); /* NP-HAWK-OP-DASHBOARD-002: D09/D10 disembunyikan dari menu */
  ok('Dashboard Library = menu expandable di sidebar utama', await ev(() => !!([...document.querySelectorAll('#nav .nav-sec .nav-sec-btn')].find(b => /Dashboard Library/.test(b.textContent))?.hasAttribute('aria-expanded'))));
  ok('12 dashboard (tanpa D09/D10) = submenu langsung, urutan referensi', (await links()).join() === defs.map(d => 'op-analytics-' + d[0]).join(), String((await links()).length));
  ok('Label submenu = label dashboard', await ev((ds) => ds.every(([id, , nl]) => document.querySelector(`#nav a[href="#op-analytics-${id}"]`)?.textContent.includes(nl)), defs));

  /* acceptance: satu klik pada submenu membuka dashboard, tanpa daftar navigasi kedua */
  await openSec();
  const miss = [];
  for (const [id, title] of defs) {
    await p.click(`#nav a[href="#op-analytics-${id}"]`); await p.waitForTimeout(250);
    const s = await state();
    if (s.h1 !== title || s.id !== id || s.cur.join() !== '#op-analytics-' + id || s.aside || s.inner || !(s.cards || s.charts)) miss.push(id + JSON.stringify(s));
  }
  ok('Satu klik membuka masing-masing 12 dashboard, submenu aktif ter-highlight, tanpa panel navigasi kedua', miss.length === 0, miss.slice(0, 2).join(' | '));
  ok('Highlight gold pada submenu aktif', await ev(() => { const a = document.querySelector('#nav a.cur[href^="#op-analytics-"]'); return !!a && /201, 154, 46/.test(getComputedStyle(a).boxShadow); }));
  const w = await ev(() => ({ main: document.querySelector('.an-report-main').getBoundingClientRect().width, view: document.getElementById('opx-root').getBoundingClientRect().width }));
  ok('Area dashboard memakai lebar penuh konten', w.main >= w.view - 60, JSON.stringify(w));

  /* fitur tetap: filter periode, outlet, tab entry/verifikasi, sumber data, insight, interaksi diagram */
  await go('op-analytics-revenue');
  await ev(() => { const f = document.querySelector('form[data-form="analytics-filter"]'); f.from.value = '2026-09-01'; f.to.value = '2026-09-30'; f.requestSubmit(); }); await p.waitForTimeout(250);
  await p.click('#nav a[href="#op-analytics-waste"]'); await p.waitForTimeout(250);
  ok('Filter periode tetap saat pindah submenu', await ev(() => OPX.ui.analyticsFrom === '2026-09-01' && OPX.ui.analyticsTo === '2026-09-30' && document.querySelector('form[data-form="analytics-filter"]').from.value === '2026-09-01'));
  await ev(() => { const s = document.getElementById('outlet-select'); s.value = 'SHT'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(250);
  ok('Filter outlet tetap berfungsi', await ev(() => OPX.state.outletId === 'SHT' && /Shanti/i.test(document.querySelector('.an-scope b').textContent)));
  await ev(() => { const s = document.getElementById('outlet-select'); s.value = 'all'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(200);
  await p.click('#opx-root [data-act="analytics-tab"][data-id="entry"]'); await p.waitForTimeout(200);
  ok('Tab Data & verifikasi tetap ada', /Sumber data & verifikasi/.test(await p.textContent('#opx-root')));
  await p.click('#opx-root [data-act="analytics-tab"][data-id="dashboard"]'); await p.waitForTimeout(200);
  await p.click('#opx-root [data-act="analytics-source"]'); await p.waitForTimeout(200);
  ok('Sumber data tetap terbuka', /Sumber data/.test(await p.textContent('#modal-root')));
  await ev(() => OPX.closeModal());
  ok('AI Insight per diagram tetap ada', (await p.locator('#opx-root [data-act="analytics-insight"]').count()) > 0);
  const chart = p.locator('#opx-root .an-chart-card [data-act]').first();
  ok('Interaksi diagram tetap ada', (await chart.count()) > 0);
  ok('Input data tim tetap ada', (await p.locator('#opx-root [data-act="analytics-entry"]').count()) > 0);
  await shot('DL-01-desktop-waste');

  /* rute lama #op-analytics tetap jalan dan submenu dashboard aktif ter-highlight */
  await ev(() => { OPX.ui.analyticsId = 'pnl'; OPX.save(); }); await go('op-analytics');
  ok('Rute lama #op-analytics tetap membuka dashboard aktif + highlight submenu', (await state()).cur.join() === '#op-analytics-pnl');
  await ev(() => OPX.goPage('analytics')); await p.waitForTimeout(300);
  ok('Navigasi internal ke Dashboard Kinerja memakai rute submenu', await ev(() => location.hash === '#op-analytics-pnl'));

  /* RBAC: sidebar hanya dashboard yang diizinkan; Supervisor terkunci satu outlet */
  for (const id of ['spv-CTR', 'hosp-jro-okta', 'reception-CTR', 'attendant-CTR']) {
    await as(id); await go('op-dashboard');
    const allowed = await ev(() => OPX.has('analytics') ? OPX.analytics.navDefinitions().map(d => 'op-analytics-' + d.id) : []);
    const shown = await links();
    ok(`RBAC ${id}: submenu = dashboard yang diizinkan (${allowed.length})`, shown.join() === allowed.join(), shown.length + ' tampil');
    if (id === 'spv-CTR') ok('Supervisor terkunci pada satu outlet', await ev(() => { const s = document.getElementById('outlet-select'); return s.disabled && s.options.length === 1 && OPX.state.outletId === OPX.user().outlet; }));
  }
  const denied = await ev(() => { const v = OPX.analytics.visibleDefinitions().map(d => d.id); return OPX.analytics.definitions.map(d => d.id).find(x => !v.includes(x)); });
  if (denied) { await go('op-analytics-' + denied); ok('Rute dashboard di luar RBAC ditolak, bukan membuka dashboard lain', /Tidak berwenang/.test(await p.textContent('#opx-root'))); }

  /* mobile: sidebar sebagai drawer, dashboard tetap terbaca */
  await as('mgr-eni'); await p.setViewportSize({ width: 390, height: 844 }); await go('op-analytics-revenue');
  await p.click('#menu'); await p.waitForTimeout(250);
  ok('Mobile: sidebar terbuka sebagai drawer', await ev(() => document.getElementById('sidebar').classList.contains('on')));
  await openSec(); await shot('DL-03-mobile-drawer');
  await p.click('#nav a[href="#op-analytics-capacity"]'); await p.waitForTimeout(400);
  ok('Mobile: pilih submenu menutup drawer dan membuka dashboard', await ev(() => !document.getElementById('sidebar').classList.contains('on') && OPX.ui.analyticsId === 'capacity'));
  let over = [];
  for (const [id] of defs) { await go('op-analytics-' + id); const o = await ev(() => document.documentElement.scrollWidth - window.innerWidth); if (o > 1) over.push(id + '+' + o); }
  ok('Mobile 390px: 12 dashboard tanpa scroll horizontal', over.length === 0, over.join(' '));
  await go('op-analytics-revenue'); await shot('DL-02-mobile-revenue');
  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
