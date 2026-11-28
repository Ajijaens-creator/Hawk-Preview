/* HAWK Operational · Dashboard Strategis (A03 Bab 07) di Dashboard Library sidebar. Frontend + fixture lokal saja.
   python3 -m http.server 8811 dari hawk-erp-preview/, lalu node tests/hawk-live/ops-strategic.e2e.js (SHOTS=dir untuk screenshot) */
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
  const shot = async (n, full = true) => { if (SHOTS) { await p.waitForTimeout(250); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }); } };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const as = (id) => ev(i => OPX.actions['account-select']({ dataset: { id: i } }), id);
  const go = async (r) => { await p.goto(BASE + 'operational.html#' + r); await p.waitForTimeout(350); };
  const text = () => p.textContent('#opx-root');
  const links = () => p.$$eval('#nav a[href^="#op-strategic"]', as => as.filter(a => !a.hidden && !a.closest('[hidden]')).map(a => a.getAttribute('href').slice(1)));

  await go('op-dashboard'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
  await as('mgr-eni'); await go('op-dashboard');
  const views = await ev(() => OPX.strategic.VIEWS.map(v => [v.id, v.title]));
  ok('Enam opsi prioritas A03 Bab 07', views.length === 6, views.map(v => v[1]).join(' · '));
  ok('Dashboard Strategis berada di dalam Dashboard Library, setelah 12 dashboard (D09/D10 disembunyikan, NP-HAWK-OP-DASHBOARD-002)', await ev(() => { const s = [...document.querySelectorAll('#nav .nav-sec')].find(x => /Dashboard Library/.test(x.querySelector('.nav-sec-btn').textContent)); const hs = [...s.querySelectorAll('a')].map(a => a.getAttribute('href')); return hs.length === 19 && hs.slice(0, 12).every(h => h.startsWith('#op-analytics-')) && hs[12] === '#op-strategic' && hs.slice(13).every(h => h.startsWith('#op-strategic-')); }));
  ok('Manager melihat 6 tampilan + ikhtisar', (await links()).length === 7);

  /* satu klik per tampilan, tanpa NaN/undefined, submenu aktif */
  await ev(() => { const s = [...document.querySelectorAll('#nav .nav-sec')].find(x => /Dashboard Library/.test(x.textContent)); if (!s.classList.contains('open')) s.querySelector('.nav-sec-btn').click(); const g = document.querySelector('#nav .nav-grp .nav-tog[data-grp="grp:op-strategic"]'); if (g && !g.closest('.nav-grp').classList.contains('open')) g.click(); });
  const bad = [];
  for (const [id, title] of views) {
    await p.click(`#nav a[href="#op-strategic-${id}"]`); await p.waitForTimeout(300);
    const r = await ev(() => ({ h1: document.querySelector('#view h1')?.textContent, cur: document.querySelector('#nav a.cur')?.getAttribute('href'), t: document.getElementById('opx-root').innerText }));
    if (r.h1 !== title || r.cur !== '#op-strategic-' + id || /\bNaN\b|undefined/.test(r.t) || !/Data sintetis/.test(r.t)) bad.push(id + ' ' + JSON.stringify({ h1: r.h1, cur: r.cur }));
    await shot('ST-0' + (views.findIndex(v => v[0] === id) + 1) + '-' + id);
  }
  ok('Satu klik membuka setiap tampilan, submenu aktif, label data sintetis, tanpa NaN', bad.length === 0, bad.join(' | '));

  /* isi jujur: tanpa skor/angka resmi yang belum ada sumbernya */
  await go('op-strategic-xscore');
  ok('X-score: tidak ada skor tanpa kontrak STRACON', /Skor belum ditampilkan/.test(await text()) && (await p.locator('#opx-root .st-table td .st-na').count()) >= 16);
  await go('op-strategic-hpp');
  ok('HPP: kolom biaya kosong sampai recipe/kebijakan Finance tersedia', /Belum ada angka HPP resmi/.test(await text()) && await ev(() => [...document.querySelectorAll('#opx-root .st-table')][1].querySelectorAll('tbody tr').length > 0 && [...[...document.querySelectorAll('#opx-root .st-table')][1].querySelectorAll('tbody tr')].every(tr => tr.querySelectorAll('.st-na').length === 3)));
  await go('op-strategic-finance');
  ok('Kesehatan keuangan: indikator tanpa skor tunggal, likuiditas konsolidasi saja', /Indikator tanpa skor tunggal/.test(await text()) && /konsolidasi perusahaan saja/.test(await text()));
  await go('op-strategic-customer');
  const cust = await text();
  ok('Customer Focus: tiga metrik retensi terpisah, rebooking/cohort menunggu POS/CRM', /Returning share/.test(cust) && /Rebooking conversion/.test(cust) && /Cohort retention/.test(cust) && /butuh booking berikutnya/.test(cust));
  const guestOpen = await ev(() => OPX.cases.guest().filter(c => !['selesai', 'diverifikasi'].includes(c.caseState)).length);
  ok('Customer Focus: penghitung case = Hospitality Case', await ev(n => [...document.querySelectorAll('#opx-root .st-kpi')][0].querySelector('strong').textContent === String(n), guestOpen), String(guestOpen));
  await go('op-strategic-owner');
  ok('Ringkasan Owner: alasan perhatian menautkan rute yang ada', await ev(() => [...document.querySelectorAll('#opx-root a.st-chip')].every(a => { const r = a.getAttribute('href').slice(1); return !!HL.REGISTRY[r]; })));
  ok('Ringkasan Owner: case tamu = hitungan case tamu terbuka', await ev(n => [...document.querySelectorAll('#opx-root .st-kpi')][1].querySelector('strong').textContent === String(n), guestOpen));

  /* catat permintaan tidak terpenuhi (demo) */
  await go('op-strategic-capacity');
  const before = await ev(() => OPX.state.data.unmetDemand.length);
  await p.click('#opx-root [data-act="strategic-demand"]'); await p.waitForTimeout(200);
  await p.fill('#modal-root input[name="treatment"]', 'Hot Stone (demo)'); await p.fill('#modal-root input[name="skill"]', 'Hot stone');
  await p.click('#modal-root button[type="submit"]'); await p.waitForTimeout(300);
  ok('Permintaan tidak terpenuhi tersimpan sebagai satu request', (await ev(() => OPX.state.data.unmetDemand.length)) === before + 1 && /Hot Stone/.test(await text()));

  /* RBAC */
  const expect = { 'spv-CTR': ['owner', 'xscore', 'capacity', 'customer'], 'hosp-jro-okta': ['owner', 'xscore', 'customer'], 'head-reception-CTR': ['xscore'], 'reception-CTR': [], 'attendant-CTR': [] };
  for (const [id, want] of Object.entries(expect)) {
    await as(id); await go('op-dashboard');
    const got = (await links()).filter(r => r !== 'op-strategic').map(r => r.replace('op-strategic-', ''));
    ok(`RBAC ${id}: ${want.length} tampilan strategis`, got.join() === want.join() && ((await links()).includes('op-strategic') === want.length > 0), got.join() || 'tidak ada');
  }
  await as('spv-CTR'); await go('op-strategic-owner');
  ok('Supervisor: Ringkasan hanya outlet sendiri', await ev(() => document.querySelectorAll('#opx-root .st-table tbody tr').length === 1 && /Ubud/.test(document.querySelector('#opx-root .st-table tbody tr').textContent)));
  await go('op-strategic-hpp');
  ok('Supervisor: HPP & Profitabilitas ditolak', /Tidak berwenang/.test(await text()));
  await as('reception-CTR'); await go('op-strategic-capacity');
  ok('Reception: rute strategis ditolak', /Tidak berwenang/.test(await text()));

  /* mobile */
  await as('mgr-eni'); await p.setViewportSize({ width: 390, height: 844 });
  const over = [];
  for (const [id] of [['']].concat(views)) { await go('op-strategic' + (id ? '-' + id : '')); const o = await ev(() => document.documentElement.scrollWidth - window.innerWidth); if (o > 1) over.push((id || 'ikhtisar') + '+' + o); }
  ok('Mobile 390px: ikhtisar + 6 tampilan tanpa scroll horizontal', over.length === 0, over.join(' '));
  await go('op-strategic-owner'); await shot('ST-mobile-owner', false);
  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
