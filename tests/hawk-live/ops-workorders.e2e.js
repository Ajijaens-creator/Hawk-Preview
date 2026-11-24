/* HAWK Operational · issue fasilitas → work order → catatan Maintenance (tanpa entry ulang) + DX-OP12.
   Frontend + fixture lokal. python3 -m http.server 8811 dari hawk-erp-preview/, lalu node tests/hawk-live/ops-workorders.e2e.js */
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
  const form = (name, obj) => ev(([n, o]) => { const fd = new FormData(); Object.entries(o).forEach(([k, v]) => fd.set(k, v)); OPX.forms[n](fd); }, [name, obj]);

  await go('op-dashboard'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
  ok('DX-OP12 terdaftar; Demo Center 12 skenario', await ev(() => OPX.demo.getScenario('work-order')?.code === 'DX-OP12' && OPX.demo.scenarios.length === 12 && OPX.demo.getScenario('work-order').steps.length === 5));

  /* jalankan DX-OP12 di Ubud */
  await as('mgr-eni'); await ev(() => { OPX.state.outletId = 'CTR'; OPX.save(); });
  await ev(() => OPX.demo.start('work-order', 'CTR')); await p.waitForTimeout(200);
  const run = () => ev(() => OPX.demo.getRun('work-order'));
  const step = (i) => ev((n) => { const r = OPX.demo.getRun('work-order'); const v = OPX.demo.evaluateStep(r, n); return v?.complete === true; }, i);

  await as('attendant-CTR'); await go('op-communication');
  await form('issueCreate', { outlet: 'CTR', dept: 'attendant', roomId: 'CTR-R02', title: 'Lampu ruang treatment mati (demo)', note: 'Lampu utama tidak menyala saat persiapan.', priority: 'Normal' });
  const iid = await ev(() => OPX.state.data.issues.filter(i => i.reporter === 'attendant-CTR').slice(-1)[0]?.id);
  ok('Attendant melaporkan issue fasilitas sekali', !!iid, iid);
  ok('DX langkah 1 terbukti dari data', await step(0));

  await as('spv-CTR'); await go('op-communication');
  await ev((id) => OPX.actions['issue-task']({ dataset: { id } }), iid); await p.waitForTimeout(150);
  ok('Tugas penanganan mencatat respons pertama', await ev((id) => { const i = OPX.state.data.issues.find(x => x.id === id); return !!i.taskId && !!i.respondedAt; }, iid));
  await ev(() => OPX.closeModal());
  const roomBefore = await ev(() => OPX.state.data.rooms.find(r => r.id === 'CTR-R02').status);
  await ev((id) => OPX.actions['issue-resolve']({ dataset: { id } }), iid); await p.waitForTimeout(150);
  ok('Konfirmasi penyelesaian menampilkan pilihan kategori sekali', await ev(() => { const s = document.querySelector('#modal-root select[name="mtCategory"]'); return !!s && s.value === 'Electrical'; }));
  await shot('WO-01-resolve-category');
  await p.fill('#modal-root textarea[name="resolution"]', 'Lampu diganti, dicek menyala normal (demo).');
  await p.click('#modal-root form[data-form="issueResolve"] button[type="submit"]'); await p.waitForTimeout(300);
  const rec = await ev((id) => { const i = OPX.state.data.issues.find(x => x.id === id); const r = OPX.workOrders.recordOf(i); return r && { status: r.status, cat: r.values.category, ref: r.values.ticketRef, author: r.authorId, opened: r.values.openedAt, resp: r.values.respondedAt, done: r.values.resolvedAt, state: r.values.state, outlet: r.outlet }; }, iid);
  ok('Penyelesaian membuat satu catatan Maintenance menunggu verifikasi', rec && rec.status === 'submitted' && rec.cat === 'Electrical' && rec.ref.startsWith(iid) && rec.state === 'Done' && rec.outlet === 'CTR', JSON.stringify(rec));
  ok('Waktu lapor ≤ respons ≤ selesai, diambil dari issue/tugas (bukan diketik)', rec && rec.opened <= rec.resp && rec.resp <= rec.done);
  ok('Status ruang tidak diubah otomatis (readiness tetap di Room & Facility)', (await ev(() => OPX.state.data.rooms.find(r => r.id === 'CTR-R02').status)) === roomBefore, roomBefore);
  await ev((id) => OPX.actions['issue-open']({ dataset: { id } }), iid); await p.waitForTimeout(150);
  ok('Drawer issue menautkan catatan Maintenance', /Catatan Maintenance ENTRY-DEMO-/.test(await p.textContent('#modal-root')));
  await shot('WO-02-issue-drawer');
  await ev(() => OPX.closeModal());
  ok('Pencatat (Supervisor) tidak dapat memverifikasi catatannya sendiri', await ev((id) => { const i = OPX.state.data.issues.find(x => x.id === id); return !OPX.analytics.canReview(OPX.workOrders.recordOf(i)); }, iid));
  ok('Resolusi ulang tidak menggandakan catatan', await ev((id) => { const n = OPX.analytics.ensure().records.filter(r => r.group === 'maintenance' && String(r.values.ticketRef).startsWith(id)).length; return n === 1; }, iid));

  await as('mgr-eni');
  const before = await ev(() => { OPX.state.outletId = 'CTR'; const d = OPX.analytics.ensure().records.find(r => r.group === 'maintenance' && r.status === 'submitted' && r.authorId === 'spv-CTR'); OPX.ui.analyticsFrom = d.date; OPX.ui.analyticsTo = d.date; return OPX.analytics.model('maintenance').cards.find(c => c.key === 'total').value || 0; });
  await form('analyticsReview', { recordId: rec ? await ev((id) => OPX.workOrders.recordOf(OPX.state.data.issues.find(x => x.id === id)).id, iid) : '', decision: 'verified', note: 'Dicek di lokasi (demo).', checked: 'on' });
  const after = await ev(() => OPX.analytics.model('maintenance').cards.find(c => c.key === 'total').value || 0);
  ok('Verifikasi Manager memasukkan catatan ke dashboard Maintenance', after === before + 1, `${before} → ${after}`);
  ok('DX-OP12 langkah state 1–4 terbukti dari data', await ev(() => { const s = OPX.demo.getScenario('work-order'), r = OPX.demo.getRun('work-order'); return [0, 1, 2, 3].every(n => { const v = OPX.demo.evaluateStep(r, n); return v?.complete === true; }); }));
  await go('op-analytics-maintenance'); await shot('WO-03-maintenance-dashboard');
  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
