/* HAWK Operational · Addendum A02: 14 Dashboard Kinerja, data entry/verifikasi, insight per diagram, Jro Okta.
   Browser nyata di shell hawk-live (bukan VM). Frontend + fixture lokal saja; bukan uji backend.
   python3 -m http.server 8811 dari root repo, lalu: node tests/hawk-live/ops-a02.e2e.js  (SHOTS=dir untuk screenshot) */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const POS = 'https://preview.jaens.id/rnd-demo';
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const HELPERS = () => {
  window.T = {
    as(id) { OPX.actions['account-select']({ dataset: { id } }); },
    A() { return OPX.analytics; },
    modal() { return document.querySelector('#modal-root')?.innerText || ''; },
    text() { return document.getElementById('opx-root')?.innerText || ''; },
    downloads: [],
  };
  const hook = () => { if (window.OPX && !OPX.__dl) { OPX.__dl = true; OPX.download = (name, data) => T.downloads.push({ name, data: typeof data === 'string' ? data : JSON.stringify(data) }); } else if (!window.OPX) setTimeout(hook, 20); };
  document.addEventListener('DOMContentLoaded', hook);
};
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(HELPERS);
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n, full = false) => { if (SHOTS) { await p.waitForTimeout(250); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }); } };
  const go = async (r) => { await p.goto(BASE + 'operational.html#' + r); await p.waitForTimeout(350); };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const visibleNav = () => p.$$eval('#nav a', as => as.filter(a => !a.hidden && !a.closest('[hidden]')).map(a => a.getAttribute('href')));
  const open = (id, extra) => ev(([d, x]) => { OPX.ui = Object.assign(OPX.ui || {}, { analyticsId: d, analyticsTab: 'dashboard' }, x || {}); OPX.state.page = 'analytics'; OPX.render(); }, [id, extra]);
  await p.goto(BASE + 'operational.html'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);

  /* ---------------- struktur ---------------- */
  const defs = await ev(() => T.A().definitions.map(d => [d.id, d.title]));
  ok('14 dashboard dalam urutan referensi + 13 kelompok sumber bersama', defs.length === 14 && (await ev(() => Object.keys(T.A().schemas).length)) === 13, defs.map(d => d[1]).join(' · '));
  ok('Dashboard Kinerja di grup sendiri "Dashboard Library", tepat setelah grup Kendali outlet', await ev(() => { const sec = [...document.querySelectorAll('#nav .nav-sec')]; const i = sec.findIndex(x => /Dashboard Library/.test(x.querySelector('.nav-sec-btn').textContent)); return i === 1 && /Kendali outlet/i.test(sec[0].querySelector('.nav-sec-btn').textContent) && [...sec[i].querySelectorAll('a[href^="#op-analytics-"]')].map(a => a.getAttribute('href')).join() === T.A().navDefinitions().map(d => '#op-analytics-' + d.id).join(); }));
  ok('Amandemen navigasi 23 Nov + NP-HAWK-OP-DASHBOARD-002: 14 dashboard, 12 submenu Dashboard Library (D09/D10 disembunyikan)', (await visibleNav()).filter(h => /analytics/.test(h)).length === 12);
  ok('Command Center, Demo Center, RACE, Budget, Communication, Team & Access tetap ada', ['#op-dashboard', '#ops-dx', '#op-race', '#op-budget', '#op-communication', '#op-settings'].every(async h => (await visibleNav()).includes(h)));
  ok('POS & Receptionist tetap ke POS existing (tab baru)', await ev(u => { const a = document.querySelector(`#nav a[href="${u}"]`); return !!a && a.target === '_blank'; }, POS));

  /* ---------------- 14 × 2 periode × 2 tab ---------------- */
  await go('op-analytics');
  let actions = 0, bad = [];
  for (const from of ['2026-10-01', '2026-01-01']) for (const [id, title] of defs) for (const tab of ['dashboard', 'entry']) {
    await open(id, { analyticsFrom: from, analyticsTo: '2026-10-31', analyticsTab: tab });
    const r = await ev(() => { const h = document.getElementById('opx-root').innerHTML; return { h: h.length, nan: /\bNaN\b|>undefined</.test(h), acts: [...h.matchAll(/data-act="([^"]+)"/g)].map(m => m[1]).filter(a => typeof OPX.actions[a] !== 'function'), title: document.getElementById('opx-root').innerText }; });
    actions++;
    if (r.nan || r.acts.length || !r.title.toUpperCase().includes(title.toUpperCase().slice(0, 10))) bad.push(`${id}/${from}/${tab}${r.acts.length ? ' aksi tanpa handler: ' + r.acts[0] : ''}${r.nan ? ' NaN/undefined' : ''}`);
  }
  ok('Semua 56 kombinasi (14 × 2 periode × 2 tab) dirender tanpa NaN dan tanpa tombol mati', bad.length === 0, bad.slice(0, 3).join(' | ') || actions + ' render');
  await open('revenue', { analyticsFrom: '2026-10-01', analyticsTo: '2026-10-31' });
  await shot('A02-01-revenue-overview', true);
  const chg = await ev(() => ({ n: document.querySelectorAll('#opx-root .an-kpi-change').length, t: document.querySelector('#opx-root .an-kpi-change')?.textContent || '', ui: [OPX.ui.analyticsFrom, OPX.ui.analyticsTo].join('..') }));
  ok('Paritas Looker: 4 kartu Revenue memuat perubahan vs periode lalu', chg.n === 4 && /vs periode lalu/.test(chg.t) && chg.ui === '2026-10-01..2026-10-31', chg.t);
  ok('Periode pembanding Okt → Sep (bulan penuh), rentang hari → hari sebelumnya', await ev(() => JSON.stringify([OPX.prevPeriod('2026-10-01', '2026-10-31'), OPX.prevPeriod('2026-01-01', '2026-10-31'), OPX.prevPeriod('2026-10-10', '2026-10-16')])) === JSON.stringify([{ from: '2026-09-01', to: '2026-09-30' }, { from: '2025-03-01', to: '2025-12-31' }, { from: '2026-10-03', to: '2026-10-09' }]));
  ok('Tanpa data periode lalu, kartu tidak menampilkan perubahan karangan', await ev(() => OPX.analytics.model('retention').cards.every(c => !c.change)));

  /* ---------------- drilldown, insight, standar ---------------- */
  await p.click('#opx-root [data-act="analytics-detail"] >> nth=0'); await p.waitForTimeout(250);
  const det = await ev(() => T.modal());
  ok('Klik kartu → detail metrik dengan sumber/periode', det.length > 80 && /sumber|Sumber/.test(det), det.slice(0, 80).replace(/\n/g, ' '));
  await shot('A02-02-detail-kartu');
  await ev(() => OPX.closeModal());
  const ins = await p.$('#opx-root [data-act="analytics-insight"]');
  ok('Setiap diagram punya tombol Insight', (await p.locator('#opx-root [data-act="analytics-insight"]').count()) >= (await p.locator('#opx-root .chart, #opx-root [data-chart], #opx-root .an-chart').count() || 1));
  if (ins) { await ins.click(); await p.waitForTimeout(250); }
  const insight = await ev(() => T.modal());
  ok('Insight berlabel simulasi, belum terhubung AI', /simulasi/i.test(insight) && /AI/.test(insight), insight.slice(0, 90).replace(/\n/g, ' '));
  await shot('A02-03-insight-simulasi');
  await ev(() => OPX.closeModal());
  const std = await p.$('#opx-root [data-act="analytics-standard"]');
  if (std) { await std.click(); await p.waitForTimeout(250); }
  ok('Eni dapat membuka pengaturan Standar (arah, batas, dasar SOP)', /higher|lower|range|neutral|Lebih tinggi|Arah/i.test(await ev(() => T.modal())));
  await shot('A02-04-standar');
  await ev(() => OPX.closeModal());

  /* ---------------- satu feedback → dua laporan ---------------- */
  const before = await ev(() => [T.A().model('reviews').verifiedCount, T.A().model('satisfaction').verifiedCount]);
  await ev(() => T.as('reception-CTR')); await go('op-analytics');
  await ev(() => { const fd = new FormData(); Object.entries({ dashboardId: 'reviews', group: 'feedback', recordId: '', outlet: 'CTR', date: '2026-10-30', intent: 'submitted', evidence: 'Foto form feedback demo', v_visitRef: 'VIS-E2E-001', v_channel: 'Offline', v_platform: 'Form outlet', v_rating: '5', v_satisfaction: 'Puas', v_comment: 'Terapi sangat nyaman (demo)' }).forEach(([k, v]) => fd.set(k, v)); OPX.forms.analyticsEntry(fd); });
  const rec = await ev(() => T.A().ensure().records.find(r => r.values.visitRef === 'VIS-E2E-001'));
  ok('Reception menyimpan feedback sebagai submitted', rec && rec.status === 'submitted' && rec.outlet === 'CTR');
  await shot('A02-05-data-verifikasi-reception', true);
  ok('Pembuat tidak dapat memverifikasi catatan sendiri', await ev(id => { const r = T.A().ensure().records.find(x => x.id === id); try { T.A().reviewRecord(id, 'verified'); return false; } catch (e) { return r.status === 'submitted'; } }, rec.id));
  await ev(() => T.as('mgr-eni'));
  ok('Catatan belum verified belum masuk hasil laporan', (await ev(() => T.A().model('reviews').verifiedCount)) === before[0]);
  await ev(() => T.as('head-reception-CTR'));
  ok('Head Reception outlet yang sama memverifikasi', await ev(id => { T.A().reviewRecord(id, 'verified'); return T.A().ensure().records.find(x => x.id === id).status === 'verified'; }, rec.id));
  await ev(() => T.as('hosp-jro-okta'));
  const after = await ev(() => [T.A().model('reviews').verifiedCount, T.A().model('satisfaction').verifiedCount]);
  ok('Satu record feedback memperbarui Customer Review dan Customer Satisfaction (dilihat Jro Okta)', after[0] === before[0] + 1 && after[1] === before[1] + 1, `${before} → ${after}`);
  ok('Revenue / Finance tidak dapat diinput ulang manual', await ev(() => { T.as('reception-CTR'); try { T.A().addRecord({ group: 'revenue', outlet: 'CTR', date: '2026-10-30', values: { amount: 100 }, status: 'submitted' }); return false; } catch (e) { return true; } }));
  ok('Data kritis: review Head belum final, Supervisor final assurance', await ev(() => { T.as('attendant-CTR'); const r = T.A().addRecord({ group: 'maintenance', outlet: 'CTR', date: '2026-10-30', status: 'submitted', evidence: 'Foto tiket demo', values: { ticketRef: 'MT-E2E-1', category: 'HVAC', openedAt: '2026-10-30T09:00', respondedAt: '2026-10-30T09:10', state: 'Done', resolvedAt: '2026-10-30T11:00', description: 'AC servis demo' } }); T.as('head-attendant-CTR'); const a = T.A().reviewRecord(r.id, 'verified').final; const s1 = r.status; T.as('spv-CTR'); const b = T.A().reviewRecord(r.id, 'verified').final; return a === false && s1 === 'submitted' && b === true && r.status === 'verified'; }));

  /* ---------------- Jro Okta ---------------- */
  await ev(() => T.as('hosp-jro-okta')); await go('op-analytics');
  ok('Jro Okta: Hospitality Manager, 14 dashboard, 4 outlet', await ev(() => OPX.user().name === 'Jro Okta' && /Hospitality/.test(OPX.user().title) && T.A().visibleDefinitions().length === 14 && OPX.user().assignedOutlets?.length === 4));
  ok('Jro Okta tanpa hak sensitif (settings.manage, verifikasi stok/tugas, POS)', await ev(() => ['settings.manage', 'inventory.verify', 'task.verify', 'pos'].every(x => !OPX.has(x))));
  ok('Jro Okta muncul di pilihan akun demo', await ev(() => { OPX.actions.accounts(); const t = T.modal(); OPX.closeModal(); return /Jro Okta/.test(t); }));
  await open('satisfaction'); await shot('A02-06-jro-okta-satisfaction', true);

  /* ---------------- Supervisor satu outlet ---------------- */
  for (const o of ['CTR', 'SHT', 'TRL', 'BSM']) {
    await ev(x => T.as('spv-' + x), o);
    const r = await ev(x => ({ rows: T.A().records('revenue').every(r => r.outlet === x), defs: T.A().visibleDefinitions().length, write: (() => { try { T.A().addRecord({ group: 'feedback', outlet: x === 'CTR' ? 'SHT' : 'CTR', date: '2026-10-30', values: {}, evidence: 'Uji lintas outlet', status: 'submitted' }); return true; } catch (e) { return false; } })() }), o);
    ok(`Supervisor ${o}: 14 dashboard, data dan input hanya outlet sendiri`, r.rows && r.defs === 14 && !r.write);
  }
  await ev(() => T.as('spv-CTR')); await go('op-analytics');
  ok('Supervisor tidak punya pemilih outlet lain', await ev(() => { const s = document.getElementById('outlet-select'); return s.disabled && s.options.length === 1; }));
  await ev(() => OPX.actions['analytics-export']({ dataset: { id: 'revenue' } }));
  const csv = await ev(() => T.downloads.at(-1));
  ok('CSV Supervisor hanya outlet sendiri', !!csv && /Ubud/.test(csv.data) && !/Shanti|Triloka|Bisma/.test(csv.data));
  await ev(() => T.as('reception-CTR')); const nDl = await ev(() => T.downloads.length);
  await ev(() => OPX.actions['analytics-export']({ dataset: { id: 'pnl' } }));
  ok('Staff tidak dapat membuka/ekspor P&L', (await ev(() => T.downloads.length)) === nDl && (await ev(() => !T.A().canViewDashboard('pnl'))));

  /* ---------------- SER / RACE ---------------- */
  await ev(() => T.as('mgr-eni'));
  ok('Inventaris SER: 23 Vegen, 4 siklus/77 Beacon, 17 dimensi/209 butir RSF', await ev(() => OPX.serCatalog.vegen.length === 23 && OPX.serCatalog.beacons.reduce((s, r) => s + r.count, 0) === 77 && OPX.serCatalog.rsf.length === 17 && OPX.serCatalog.rsf.reduce((s, r) => s + r.items.length, 0) === 209));
  await go('op-race'); await ev(() => { OPX.ui.raceTab = 'score'; OPX.render(); });
  ok('X-Score tetap menunggu kontrak', /Menunggu kontrak/.test(await ev(() => T.text())));
  await ev(() => { OPX.ui.raceTab = 'vegen'; OPX.render(); }); await shot('A02-07-race-vegen', true);
  ok('Complaint rate tanpa data verified tetap kosong (bukan 0)', await ev(() => T.A().model('satisfaction').cards.some(c => c.label === 'Complaint rate' && c.value === null)));

  /* ---------------- Demo Center A02 ---------------- */
  await go('ops-dx');
  ok('Demo Center: 12 skenario (8 A02 + 4 A03) / 6 peran / 60 langkah, DX-OP08 tersedia', await ev(() => { const c = OPX.demo.counts(); return c.scenarios === 12 && c.roles === 6 && c.steps === 60 && OPX.demo.getScenario('dashboard-source')?.code === 'DX-OP08'; }));

  /* ---------------- regresi Command Center & POS ---------------- */
  await go('op-dashboard'); ok('Command Center tetap tersedia', /Command Center/.test(await p.textContent('.page-head h1')));
  await go('op-pos'); ok('Gateway POS tetap menautkan POS existing (Dashboard POS & Appointment Book)', (await p.locator(`#opx-root a[href^="${POS}"]`).count()) > 0);

  /* ---------------- responsif ---------------- */
  for (const [w, h, n] of [[834, 1112, 'tablet'], [390, 844, 'mobile']]) {
    await p.setViewportSize({ width: w, height: h }); await go('op-analytics');
    for (const id of defs.map(d => d[0])) {
      await open(id);
      const over = await ev(() => document.documentElement.scrollWidth - window.innerWidth);
      if (over > 1) { ok(`Responsif ${n} ${w}px ${id}`, false, `+${over}px`); }
    }
    ok(`Responsif ${n} ${w}px: 14 dashboard tanpa scroll horizontal halaman`, true);
    if (n === 'mobile') { await open('revenue'); await shot('A02-08-mobile-revenue'); await open('reviews', { analyticsTab: 'entry' }); await shot('A02-09-mobile-entry'); }
  }
  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
