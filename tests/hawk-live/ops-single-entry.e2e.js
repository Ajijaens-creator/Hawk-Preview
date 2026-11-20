/* HAWK Operational · peta "satu sumber entri" untuk 14 Dashboard Kinerja + field entri yang dilengkapi dari sheet sumber Looker.
   python3 -m http.server 8811 dari root repo, lalu: node tests/hawk-live/ops-single-entry.e2e.js  (SHOTS=dir untuk screenshot) */
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
  const shot = async (n) => { if (SHOTS) { await p.waitForTimeout(250); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const as = (id) => ev((i) => OPX.actions['account-select']({ dataset: { id: i } }), id);
  const open = (id) => ev((d) => { OPX.ui = Object.assign(OPX.ui || {}, { analyticsId: d, analyticsTab: 'dashboard', analyticsFrom: '2026-10-01', analyticsTo: '2026-10-31' }); OPX.state.page = 'analytics'; OPX.render(); }, id);
  await p.goto(BASE + 'operational.html'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
  await as('spv-CTR'); await p.goto(BASE + 'operational.html#op-analytics'); await p.waitForTimeout(400);

  const ids = await ev(() => OPX.analytics.definitions.map(d => d.id));
  const map = await ev(() => OPX.analytics.singleEntry);
  ok('Peta sumber mencakup ke-14 dashboard', ids.length === 14 && ids.every(id => map[id] && map[id].rows.length && map[id].sheets.length && map[id].formula));
  ok('Setiap baris punya cara (otomatis / per kejadian / data induk) dan status', Object.values(map).every(m => m.rows.every(r => ['auto', 'event', 'master'].includes(r[2]) && ['done', 'build', 'backend', 'owner'].includes(r[3]))));
  ok('Tidak ada angka rupiah atau nama asli di peta (struktur saja)', !/Rp\s?\d|\d{3}\.\d{3}/.test(JSON.stringify(map)));

  await open('maintenance');
  ok('Tombol "Satu sumber entri" ada di header dashboard', (await p.locator('[data-act="analytics-single-entry"]').count()) > 0);
  await p.click('[data-act="analytics-single-entry"] >> nth=0'); await p.waitForTimeout(200);
  const one = await ev(() => document.querySelector('#modal-root').innerText);
  ok('Modal per dashboard: sheet sumber, rumus Looker, titik entri HAWK', /04 Maintenance/.test(one) && /Rumus Looker/i.test(one) && /Satu titik entri di HAWK OS/i.test(one), one.slice(0, 80));
  await shot('SE-01-maintenance');
  await p.click('#modal-root [data-act="analytics-single-entry"][data-all="1"]'); await p.waitForTimeout(200);
  ok('Modal semua: 14 blok dashboard', (await p.locator('#modal-root .se-block').count()) === 14);
  await shot('SE-02-all');
  await ev(() => OPX.closeModal && OPX.closeModal());

  const sch = await ev(() => { const S = OPX.analytics.schemas, k = g => S[g].fields.map(f => f.key); return { m: k('maintenance'), c: k('complaints'), cap: k('capacity'), cat: S.maintenance.fields.find(f => f.key === 'category').options }; });
  ok('Form maintenance: urgensi, mulai dikerjakan, dikerjakan oleh, kategori lengkap', ['urgency', 'workStartAt', 'workedBy'].every(k => sch.m.includes(k)) && ['Infrastruktur / Civil', 'Plumbing', 'Preventive'].every(o => sch.cat.includes(o)));
  ok('Form komplain: kategori 7P, karyawan terkait, referensi kunjungan', ['category7P', 'employeeRef', 'visitRef'].every(k => sch.c.includes(k)));
  ok('Kapasitas: master kapasitas revenue room + jumlah treatment', ['roomRevenueCapacity', 'treatmentCount'].every(k => sch.cap.includes(k)));

  /* entri komplain dengan field baru tersimpan */
  await as('reception-CTR'); await p.goto(BASE + 'operational.html#op-analytics'); await p.waitForTimeout(300);
  const rec = await ev(() => { const fd = new FormData(); Object.entries({ dashboardId: 'complaints', group: 'complaints', recordId: '', outlet: 'CTR', date: '2026-10-30', intent: 'submitted', evidence: 'Catatan reception demo', v_caseRef: 'CASE-E2E-SE', v_platform: 'Offline', v_category: 'Service', v_category7P: 'People', v_employeeRef: 'EMP-DEMO-1', v_visitRef: 'VIS-DEMO-1', v_openedAt: '2026-10-30T10:00', v_respondedAt: '', v_state: 'Open', v_resolvedAt: '', v_resolution: 'Ditindaklanjuti (demo)' }).forEach(([k, v]) => fd.set(k, v)); OPX.forms.analyticsEntry(fd); const r = OPX.analytics.ensure().records.find(x => x.values.caseRef === 'CASE-E2E-SE'); return r && r.values; });
  ok('Komplain tersimpan dengan 7P + employeeRef + visitRef', rec && rec.category7P === 'People' && rec.employeeRef === 'EMP-DEMO-1' && rec.visitRef === 'VIS-DEMO-1', JSON.stringify(rec || {}).slice(0, 120));

  await as('spv-CTR'); await p.goto(BASE + 'operational.html#op-analytics'); await p.waitForTimeout(300);
  const c = await ev(() => OPX.analytics.model('capacity').cards.find(x => x.key === 'treatments-per-therapist'));
  ok('Capacity: kartu Treatment / terapis / hari (paritas Looker Utility Terapis)', c && Number.isFinite(c.value) && c.value > 0, JSON.stringify(c || {}).slice(0, 100));
  await open('capacity');
  ok('Kartu treatment/terapis tampil di layar', /Treatment \/ terapis \/ hari/i.test(await ev(() => document.getElementById('opx-root').innerText)));
  await shot('SE-03-capacity');

  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
